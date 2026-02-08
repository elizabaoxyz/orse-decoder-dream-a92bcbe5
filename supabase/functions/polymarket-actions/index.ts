import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { ethers } from "https://esm.sh/ethers@6.13.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Bright Data Web Unlocker API configuration
const BRIGHT_DATA_API_URL = "https://api.brightdata.com/request";
const BRIGHT_DATA_ZONE = "web_unlocker1";

const getBrightDataApiKey = () => Deno.env.get("BRIGHT_DATA_API_KEY") || "";

// Helper function to make requests through Bright Data Web Unlocker
async function fetchWithProxy(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = getBrightDataApiKey();
  
  if (apiKey) {
    try {
      console.log("[fetchWithProxy] Using Bright Data Web Unlocker for:", url);
      
      const targetHeaders: Array<{name: string; value: string}> = [];
      if (options.headers) {
        const headers = options.headers as Record<string, string>;
        Object.entries(headers).forEach(([key, value]) => {
          if (typeof value === "string") {
            targetHeaders.push({ name: key, value: value });
          }
        });
      }
      
      const payload: Record<string, unknown> = {
        zone: BRIGHT_DATA_ZONE,
        url: url,
        format: "raw",
        country: "us",
      };
      
      payload.method = (options.method || "GET").toUpperCase();
      
      if (options.body) {
        payload.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
      }
      
      if (targetHeaders.length > 0) {
        const headersObj: Record<string, string> = {};
        targetHeaders.forEach(h => { headersObj[h.name] = h.value; });
        payload.headers = headersObj;
      }
      
      const proxyResponse = await fetch(BRIGHT_DATA_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (proxyResponse.ok) {
        const responseText = await proxyResponse.text();
        try {
          const jsonData = JSON.parse(responseText);
          return new Response(JSON.stringify(jsonData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(responseText, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }
      } else {
        const errorText = await proxyResponse.text();
        console.error("[fetchWithProxy] Bright Data error:", proxyResponse.status, errorText);
      }
    } catch (brightDataErr) {
      console.error("[fetchWithProxy] Bright Data error:", brightDataErr);
    }
  }
  
  console.log("[fetchWithProxy] Using direct request to:", url);
  return fetch(url, options);
}

// Prefer direct calls; only use proxy if blocked
async function fetchClobPreferDirect(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const direct = await fetch(url, options);
    if (direct.status === 403 || direct.status === 429 || direct.status === 503) {
      console.log(`[fetchClobPreferDirect] Direct blocked (${direct.status}); using proxy`);
      return await fetchWithProxy(url, options);
    }
    return direct;
  } catch (err) {
    console.error("[fetchClobPreferDirect] Direct request error, using proxy:", err);
    return await fetchWithProxy(url, options);
  }
}

const CLOB_API_URL = "https://clob.polymarket.com";
const GAMMA_API_URL = "https://gamma-api.polymarket.com";
const RELAYER_URL = "https://relayer-v2.polymarket.com";
const CHAIN_ID = 137; // Polygon Mainnet

// =============================================================================
// CTF Exchange Addresses (Polygon Mainnet)
// =============================================================================
const CTF_EXCHANGE_ADDRESS = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E";
const NEG_RISK_CTF_EXCHANGE_ADDRESS = "0xC5d563A36AE78145C45a50134d48A1215220f80a";
const CONDITIONAL_TOKENS_ADDRESS = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045";
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC (PoS)

async function getClobServerTimeSeconds(): Promise<number | null> {
  try {
    const res = await fetchClobPreferDirect(`${CLOB_API_URL}/time`, { method: "GET" });
    const text = (await res.text()).trim();
    const asNumber = Number(text);
    if (Number.isFinite(asNumber) && asNumber > 0) return Math.floor(asNumber);
    try {
      const json = JSON.parse(text);
      if (typeof json === "number") return Math.floor(json);
      if (typeof json?.timestamp === "number") return Math.floor(json.timestamp);
    } catch { /* ignore */ }
    return null;
  } catch (err) {
    console.error("[getClobServerTimeSeconds] Error:", err);
    return null;
  }
}

async function getClobTimestampString(): Promise<string> {
  const serverTs = await getClobServerTimeSeconds();
  const ts = serverTs ?? Math.floor(Date.now() / 1000);
  return String(ts);
}

// Multiple RPC endpoints for fallback
const POLYGON_RPCS = [
  "https://polygon-bor-rpc.publicnode.com",
  "https://1rpc.io/matic",
  "https://endpoints.omniatech.io/v1/matic/mainnet/public",
];

// Builder credentials from environment
const BUILDER_ADDRESS = Deno.env.get("POLYMARKET_BUILDER_ADDRESS") || "";
const BUILDER_API_KEY = Deno.env.get("POLYMARKET_BUILDER_API_KEY") || "";
const BUILDER_SECRET = Deno.env.get("POLYMARKET_BUILDER_SECRET") || "";
const BUILDER_PASSPHRASE = Deno.env.get("POLYMARKET_BUILDER_PASSPHRASE") || "";

// CLOB Trading credentials
const getWalletPrivateKey = () => Deno.env.get("WALLET_PRIVATE_KEY") || "";

// Derived CLOB API credentials (cached per-wallet)
let CLOB_API_KEY = "";
let CLOB_API_SECRET = "";
let CLOB_PASSPHRASE = "";
let WALLET_ADDRESS = "";

// =============================================================================
// Types
// =============================================================================

interface MarketInfo {
  id: string;
  condition_id?: string;
  conditionId?: string;
  question: string;
  description?: string;
  market_slug?: string;
  slug?: string;
  end_date_iso?: string;
  endDateIso?: string;
  game_start_time?: string;
  seconds_delay?: number;
  minimum_tick_size?: string;
  minimumTickSize?: string;
  tokens?: TokenInfo[];
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  accepting_orders?: boolean;
  acceptingOrders?: boolean;
  enable_order_book?: boolean;
  enableOrderBook?: boolean;
  liquidity?: string | number;
  volume?: string | number;
  volume24hr?: number;
  bestBid?: number;
  bestAsk?: number;
  outcomePrices?: string;
  outcomes?: string;
  clobTokenIds?: string;
  neg_risk?: boolean;
  negRisk?: boolean;
}

interface TokenInfo {
  token_id: string;
  outcome: string;
  price?: number;
  winner?: boolean;
}

interface OrderBookSummary {
  tokenId: string;
  bestBid: string | null;
  bestAsk: string | null;
  spread: string | null;
  spreadPercent: string | null;
  bidDepth: number;
  askDepth: number;
  midpoint: string | null;
}

interface SearchResult {
  markets: MarketInfo[];
  total: number;
  query: string;
}

// =============================================================================
// Crypto Helpers
// =============================================================================

function decodePolySecret(secret: string): Uint8Array {
  const encoder = new TextEncoder();
  const trimmed = (secret || "").trim();
  if (!trimmed) return encoder.encode("");

  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    const decoded = base64Decode(padded);
    return new Uint8Array(decoded);
  } catch {
    return encoder.encode(trimmed);
  }
}

async function generateL2Signature(
  secret: string,
  timestamp: string,
  method: string,
  requestPath: string,
  body: string = ""
): Promise<string> {
  const message = timestamp + method.toUpperCase() + requestPath + body;
  const encoder = new TextEncoder();
  const keyData = decodePolySecret(secret);
  const keyBuffer = new ArrayBuffer(keyData.length);
  new Uint8Array(keyBuffer).set(keyData);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64Encode(signature);
}

// =============================================================================
// Builder Attribution Headers (HMAC signing for order attribution)
// These headers are ADDED to order requests so Polymarket credits trades
// to our builder account. Separate from the user's L2 auth headers.
// =============================================================================

async function generateBuilderAttributionHeaders(
  method: string,
  requestPath: string,
  body: string = ""
): Promise<Record<string, string>> {
  if (!BUILDER_API_KEY || !BUILDER_SECRET || !BUILDER_PASSPHRASE) {
    console.log("[builderAttribution] Builder credentials not configured, skipping attribution");
    return {};
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = timestamp + method.toUpperCase() + requestPath + body;
  const encoder = new TextEncoder();

  const keyData = decodePolySecret(BUILDER_SECRET);
  const keyBuffer = new ArrayBuffer(keyData.length);
  new Uint8Array(keyBuffer).set(keyData);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const signatureB64 = base64Encode(signature);

  console.log("[builderAttribution] Generated builder HMAC headers for:", method, requestPath);

  return {
    "POLY-BUILDER-ADDRESS": BUILDER_ADDRESS,
    "POLY-BUILDER-SIGNATURE": signatureB64,
    "POLY-BUILDER-TIMESTAMP": timestamp,
    "POLY-BUILDER-API-KEY": BUILDER_API_KEY,
    "POLY-BUILDER-PASSPHRASE": BUILDER_PASSPHRASE,
  };
}

// =============================================================================
// Builder Auth Headers (for builder-specific endpoints like /builder/trades)
// =============================================================================

async function createBuilderAuthHeaders(
  method: string,
  requestPath: string,
  body: string = ""
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await generateL2Signature(BUILDER_SECRET, timestamp, method, requestPath, body);

  return {
    "POLY-ADDRESS": BUILDER_ADDRESS,
    "POLY-SIGNATURE": signature,
    "POLY-TIMESTAMP": timestamp,
    "POLY-API-KEY": BUILDER_API_KEY,
    "POLY-PASSPHRASE": BUILDER_PASSPHRASE,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

// =============================================================================
// Market Search & Resolution
// =============================================================================

async function searchMarkets(query: string, limit = 10): Promise<SearchResult> {
  console.log(`[searchMarkets] Searching for: "${query}"`);
  
  const url = new URL(`${GAMMA_API_URL}/markets`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  
  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch markets: ${response.status}`);
  }

  const allMarkets: MarketInfo[] = await response.json();
  
  const queryLower = query.toLowerCase();
  const filtered = allMarkets.filter(m => 
    m.question?.toLowerCase().includes(queryLower) ||
    m.description?.toLowerCase().includes(queryLower) ||
    m.market_slug?.toLowerCase().includes(queryLower)
  ).slice(0, limit);

  return {
    markets: filtered,
    total: filtered.length,
    query,
  };
}

async function resolveTokenId(marketSlugOrTokenId: string, outcome: "YES" | "NO" = "YES"): Promise<{ tokenId: string; marketTitle: string; tickSize: string; negRisk: boolean } | null> {
  console.log(`[resolveTokenId] Resolving: "${marketSlugOrTokenId}", outcome: ${outcome}`);
  
  if (/^\d{50,}$/.test(marketSlugOrTokenId)) {
    return { tokenId: marketSlugOrTokenId, marketTitle: "Unknown", tickSize: "0.01", negRisk: false };
  }
  
  try {
    const searchResult = await searchMarkets(marketSlugOrTokenId, 5);
    if (searchResult.markets.length === 0) return null;
    
    const market = searchResult.markets[0];
    console.log(`[resolveTokenId] Found market: ${market.question}`);
    
    // Extract tickSize and negRisk from market data
    const tickSize = market.minimum_tick_size || market.minimumTickSize || "0.01";
    const negRisk = market.neg_risk ?? market.negRisk ?? false;
    
    if (market.clobTokenIds) {
      try {
        const tokenIds: string[] = JSON.parse(market.clobTokenIds);
        if (tokenIds.length > 0) {
          const tokenIndex = outcome === "YES" ? 0 : 1;
          const tokenId = tokenIds[tokenIndex] || tokenIds[0];
          return { tokenId, marketTitle: market.question || "Unknown", tickSize, negRisk };
        }
      } catch { /* ignore */ }
    }
    
    if (market.tokens && market.tokens.length > 0) {
      const outcomeToken = market.tokens.find(t => 
        t.outcome?.toUpperCase() === outcome
      );
      const tokenId = outcomeToken?.token_id || market.tokens[0].token_id;
      return { tokenId, marketTitle: market.question || "Unknown", tickSize, negRisk };
    }
    
    if (market.condition_id || market.conditionId) {
      const conditionId = market.condition_id || market.conditionId || "";
      return { tokenId: conditionId, marketTitle: market.question || "Unknown", tickSize, negRisk };
    }
    
    return null;
  } catch (error) {
    console.error(`[resolveTokenId] Error:`, error);
    return null;
  }
}

// =============================================================================
// Market Details & Order Book
// =============================================================================

async function getMarketDetails(marketId: string): Promise<MarketInfo | null> {
  try {
    const gammaResponse = await fetch(`${GAMMA_API_URL}/markets/${marketId}`, {
      headers: { "Accept": "application/json" },
    });
    if (gammaResponse.ok) return await gammaResponse.json();
  } catch { /* fallback */ }
  
  const clobResponse = await fetch(`${CLOB_API_URL}/markets/${marketId}`, {
    headers: { "Accept": "application/json" },
  });
  if (!clobResponse.ok) return null;
  return await clobResponse.json();
}

async function getOrderBookSummary(tokenId: string): Promise<OrderBookSummary> {
  const url = new URL(`${CLOB_API_URL}/book`);
  url.searchParams.set("token_id", tokenId);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) throw new Error(`Failed to fetch order book: ${response.status}`);

  const book = await response.json();
  const bids = book.bids || [];
  const asks = book.asks || [];
  
  const bestBid = bids.length > 0 ? bids[0].price : null;
  const bestAsk = asks.length > 0 ? asks[0].price : null;
  
  let spread: string | null = null;
  let spreadPercent: string | null = null;
  let midpoint: string | null = null;
  
  if (bestBid && bestAsk) {
    const bidNum = parseFloat(bestBid);
    const askNum = parseFloat(bestAsk);
    spread = (askNum - bidNum).toFixed(4);
    const midpointNum = (bidNum + askNum) / 2;
    midpoint = midpointNum.toFixed(4);
    spreadPercent = ((askNum - bidNum) / midpointNum * 100).toFixed(2);
  }

  return { tokenId, bestBid, bestAsk, spread, spreadPercent, bidDepth: bids.length, askDepth: asks.length, midpoint };
}

async function getBestPrice(tokenId: string, side: "buy" | "sell"): Promise<string | null> {
  const summary = await getOrderBookSummary(tokenId);
  return side === "buy" ? summary.bestAsk : summary.bestBid;
}

async function getSpread(tokenId: string): Promise<{ spread: string | null; spreadPercent: string | null }> {
  const summary = await getOrderBookSummary(tokenId);
  return { spread: summary.spread, spreadPercent: summary.spreadPercent };
}

async function getAllMarkets(limit = 100, offset = 0): Promise<MarketInfo[]> {
  const url = new URL(`${GAMMA_API_URL}/markets`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("order", "volume24hr");
  url.searchParams.set("ascending", "false");

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) throw new Error(`Failed to fetch markets: ${response.status}`);
  return await response.json();
}

async function getPriceHistory(tokenId: string, interval = "1d"): Promise<unknown> {
  const url = new URL(`${CLOB_API_URL}/prices-history`);
  url.searchParams.set("market", tokenId);
  url.searchParams.set("interval", interval);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) throw new Error(`Failed to fetch price history: ${response.status}`);
  return await response.json();
}

// =============================================================================
// Trading Capability & CLOB Credential Derivation
// =============================================================================

function checkTradingCapability(): { canTrade: boolean; reason?: string } {
  if (!getWalletPrivateKey()) {
    return { canTrade: false, reason: "WALLET_PRIVATE_KEY not configured. Trading is disabled." };
  }
  return { canTrade: true };
}

async function initializeClobCredentials(): Promise<boolean> {
  const pk = getWalletPrivateKey();
  if (!pk) return false;

  try {
    const wallet = new ethers.Wallet(pk);
    const derivedAddress = wallet.address;

    if (WALLET_ADDRESS && WALLET_ADDRESS.toLowerCase() !== derivedAddress.toLowerCase()) {
      CLOB_API_KEY = "";
      CLOB_API_SECRET = "";
      CLOB_PASSPHRASE = "";
    }

    WALLET_ADDRESS = derivedAddress;

    if (CLOB_API_KEY && CLOB_API_SECRET && CLOB_PASSPHRASE) return true;

    return await createNewApiKey(wallet);
  } catch (error) {
    console.error("[initializeClobCredentials] Error:", error);
    return false;
  }
}

async function createNewApiKey(wallet: ethers.Wallet): Promise<boolean> {
  try {
    const timestamp = (await getClobServerTimeSeconds()) ?? Math.floor(Date.now() / 1000);
    const nonce = 0;

    const domain = { name: "ClobAuthDomain", version: "1", chainId: CHAIN_ID };
    const types = {
      ClobAuth: [
        { name: "address", type: "address" },
        { name: "timestamp", type: "string" },
        { name: "nonce", type: "uint256" },
        { name: "message", type: "string" },
      ],
    };
    const value = {
      address: wallet.address,
      timestamp: timestamp.toString(),
      nonce,
      message: "This message attests that I control the given wallet",
    };

    const signature = await wallet.signTypedData(domain, types, value);

    const l1Headers = {
      "Content-Type": "application/json",
      "POLY_ADDRESS": wallet.address.toLowerCase(),
      "POLY_SIGNATURE": signature,
      "POLY_TIMESTAMP": timestamp.toString(),
      "POLY_NONCE": nonce.toString(),
    };

    const response = await fetchClobPreferDirect(`${CLOB_API_URL}/auth/api-key`, {
      method: "POST",
      headers: l1Headers,
      body: JSON.stringify({
        address: wallet.address.toLowerCase(),
        timestamp: timestamp.toString(),
        nonce: nonce.toString(),
        signature,
      }),
    });

    const responseText = await response.text();
    console.log("[createNewApiKey] Response:", response.status);

    if (!response.ok) {
      if (response.status === 409 || response.status === 400 || response.status === 401) {
        return await deriveApiKey(wallet, timestamp, nonce, signature);
      }
      return false;
    }

    let data;
    try { data = JSON.parse(responseText); } catch { return false; }

    if (data.error || !data.apiKey || !data.secret || !data.passphrase) {
      return await deriveApiKey(wallet, timestamp, nonce, signature);
    }

    CLOB_API_KEY = data.apiKey;
    CLOB_API_SECRET = data.secret;
    CLOB_PASSPHRASE = data.passphrase;
    console.log("[createNewApiKey] Successfully created CLOB API credentials");
    return true;
  } catch (error) {
    console.error("[createNewApiKey] Error:", error);
    return false;
  }
}

async function deriveApiKey(wallet: ethers.Wallet, timestamp: number, nonce: number, existingSignature?: string): Promise<boolean> {
  try {
    let signature = existingSignature;
    
    if (!signature) {
      const domain = { name: "ClobAuthDomain", version: "1", chainId: CHAIN_ID };
      const types = {
        ClobAuth: [
          { name: "address", type: "address" },
          { name: "timestamp", type: "string" },
          { name: "nonce", type: "uint256" },
          { name: "message", type: "string" },
        ],
      };
      signature = await wallet.signTypedData(domain, types, {
        address: wallet.address,
        timestamp: timestamp.toString(),
        nonce,
        message: "This message attests that I control the given wallet",
      });
    }

    const l1Headers = {
      "Content-Type": "application/json",
      "POLY_ADDRESS": wallet.address.toLowerCase(),
      "POLY_SIGNATURE": signature,
      "POLY_TIMESTAMP": timestamp.toString(),
      "POLY_NONCE": nonce.toString(),
    };

    const response = await fetchClobPreferDirect(`${CLOB_API_URL}/auth/derive-api-key`, {
      method: "GET",
      headers: l1Headers,
    });

    const responseText = await response.text();
    console.log("[deriveApiKey] Response:", response.status);

    if (!response.ok) return false;

    let data;
    try { data = JSON.parse(responseText); } catch { return false; }
    if (data.error || !data.apiKey || !data.secret || !data.passphrase) return false;

    CLOB_API_KEY = data.apiKey;
    CLOB_API_SECRET = data.secret;
    CLOB_PASSPHRASE = data.passphrase;
    console.log("[deriveApiKey] Successfully derived CLOB API credentials");
    return true;
  } catch (error) {
    console.error("[deriveApiKey] Error:", error);
    return false;
  }
}

// Browser-like headers to bypass Cloudflare
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://polymarket.com",
  "Referer": "https://polymarket.com/",
};

async function createClobAuthHeaders(
  method: string,
  requestPath: string,
  body: string = "",
  includeBuilderAttribution = false
): Promise<Record<string, string>> {
  const initialized = await initializeClobCredentials();
  if (!initialized || !CLOB_API_KEY || !CLOB_API_SECRET || !CLOB_PASSPHRASE || !WALLET_ADDRESS) {
    throw new Error("CLOB credentials not initialized");
  }

  const timestamp = await getClobTimestampString();
  const signature = await generateL2Signature(CLOB_API_SECRET, timestamp, method, requestPath, body);

  const headers: Record<string, string> = {
    ...BROWSER_HEADERS,
    "POLY-ADDRESS": WALLET_ADDRESS,
    "POLY-SIGNATURE": signature,
    "POLY-TIMESTAMP": timestamp,
    "POLY-API-KEY": CLOB_API_KEY,
    "POLY-PASSPHRASE": CLOB_PASSPHRASE,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  // Add proxy address for trading endpoints
  const isTradingEndpoint =
    requestPath.startsWith("/order") ||
    requestPath.startsWith("/orders") ||
    requestPath.startsWith("/cancel") ||
    requestPath.startsWith("/redeem") ||
    requestPath.startsWith("/trades");

  const proxyAddress = BUILDER_ADDRESS || "";
  if (isTradingEndpoint && proxyAddress && proxyAddress.toLowerCase() !== WALLET_ADDRESS.toLowerCase()) {
    headers["POLY-PROXY-ADDRESS"] = proxyAddress;
    console.log(`[createClobAuthHeaders] Using proxy wallet: ${proxyAddress}`);
  }

  // *** BUILDER ORDER ATTRIBUTION ***
  // Add builder HMAC headers for order placement so trades are credited to our builder account
  if (includeBuilderAttribution || isTradingEndpoint) {
    const builderHeaders = await generateBuilderAttributionHeaders(method, requestPath, body);
    Object.assign(headers, builderHeaders);
    console.log("[createClobAuthHeaders] Added builder attribution headers");
  }

  return headers;
}

// =============================================================================
// EIP-712 Order Signing for CTF Exchange
// =============================================================================

// Order side enum matching the contract
const ORDER_SIDE = { BUY: 0, SELL: 1 } as const;

// EIP-712 domain for CTF Exchange
function getExchangeDomain(negRisk: boolean) {
  return {
    name: "ClobExchange",
    version: "1",
    chainId: CHAIN_ID,
    verifyingContract: negRisk ? NEG_RISK_CTF_EXCHANGE_ADDRESS : CTF_EXCHANGE_ADDRESS,
  };
}

// EIP-712 types for order
const ORDER_TYPES = {
  Order: [
    { name: "salt", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "signer", type: "address" },
    { name: "taker", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "makerAmount", type: "uint256" },
    { name: "takerAmount", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "feeRateBps", type: "uint256" },
    { name: "side", type: "uint8" },
    { name: "signatureType", type: "uint8" },
  ],
};

// Calculate maker and taker amounts from price and size
// For BUY: makerAmount = size * price (USDC), takerAmount = size (shares)
// For SELL: makerAmount = size (shares), takerAmount = size * price (USDC)
function calculateOrderAmounts(
  side: "BUY" | "SELL",
  size: number,
  price: number,
  tickSize: string
): { makerAmount: string; takerAmount: string } {
  // USDC has 6 decimals on Polygon
  const USDC_DECIMALS = 6;
  const SHARE_DECIMALS = 6; // CTF tokens also use 6 decimals

  // Round price to tick size
  const tick = parseFloat(tickSize);
  const roundedPrice = Math.round(price / tick) * tick;

  if (side === "BUY") {
    // Buying shares: pay USDC, receive shares
    const usdcAmount = size * roundedPrice;
    const makerAmount = BigInt(Math.round(usdcAmount * (10 ** USDC_DECIMALS)));
    const takerAmount = BigInt(Math.round(size * (10 ** SHARE_DECIMALS)));
    return { makerAmount: makerAmount.toString(), takerAmount: takerAmount.toString() };
  } else {
    // Selling shares: pay shares, receive USDC
    const usdcAmount = size * roundedPrice;
    const makerAmount = BigInt(Math.round(size * (10 ** SHARE_DECIMALS)));
    const takerAmount = BigInt(Math.round(usdcAmount * (10 ** USDC_DECIMALS)));
    return { makerAmount: makerAmount.toString(), takerAmount: takerAmount.toString() };
  }
}

function generateRandomSalt(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return BigInt("0x" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join("")).toString();
}

interface SignedOrder {
  salt: string;
  maker: string;
  signer: string;
  taker: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  expiration: string;
  nonce: string;
  feeRateBps: string;
  side: number;
  signatureType: number;
  signature: string;
}

async function createSignedOrder(
  wallet: ethers.Wallet,
  tokenId: string,
  price: number,
  size: number,
  side: "BUY" | "SELL",
  tickSize: string,
  negRisk: boolean,
  funderAddress?: string
): Promise<SignedOrder> {
  const salt = generateRandomSalt();
  const { makerAmount, takerAmount } = calculateOrderAmounts(side, size, price, tickSize);
  
  // Maker is the funder (proxy wallet if set, otherwise signer)
  const maker = funderAddress || wallet.address;
  const signer = wallet.address;
  const taker = "0x0000000000000000000000000000000000000000"; // open order
  const expiration = "0"; // no expiration (GTC)
  const nonce = "0";
  const feeRateBps = "0"; // Polymarket sets fees server-side
  const signatureType = funderAddress && funderAddress.toLowerCase() !== wallet.address.toLowerCase() 
    ? 2  // POLY_GNOSIS_SAFE (proxy wallet)
    : 0; // EOA

  const orderData = {
    salt,
    maker,
    signer,
    taker,
    tokenId,
    makerAmount,
    takerAmount,
    expiration,
    nonce,
    feeRateBps,
    side: side === "BUY" ? ORDER_SIDE.BUY : ORDER_SIDE.SELL,
    signatureType,
  };

  const domain = getExchangeDomain(negRisk);
  const signature = await wallet.signTypedData(domain, ORDER_TYPES, orderData);

  console.log(`[createSignedOrder] Created ${side} order: price=${price}, size=${size}, tokenId=${tokenId.slice(0, 20)}...`);
  console.log(`[createSignedOrder] maker=${maker}, signer=${signer}, signatureType=${signatureType}, negRisk=${negRisk}`);

  return {
    ...orderData,
    salt: orderData.salt.toString(),
    tokenId: orderData.tokenId.toString(),
    makerAmount: orderData.makerAmount.toString(),
    takerAmount: orderData.takerAmount.toString(),
    expiration: orderData.expiration.toString(),
    nonce: orderData.nonce.toString(),
    feeRateBps: orderData.feeRateBps.toString(),
    signature,
  };
}

// =============================================================================
// Trading Actions
// =============================================================================

interface TradeParams {
  tokenId: string;
  amount: number;
  price?: number;
  side: "BUY" | "SELL";
  tickSize?: string;
  negRisk?: boolean;
}

interface OrderResult {
  orderId?: string;
  status: string;
  message: string;
  details?: unknown;
}

async function placeOrder(params: TradeParams): Promise<OrderResult> {
  console.log(`[placeOrder] Placing ${params.side} order:`, params);
  
  const initialized = await initializeClobCredentials();
  if (!initialized) {
    return { status: "error", message: "Failed to initialize trading credentials." };
  }

  try {
    // Get current best price if not specified
    let price = params.price;
    if (!price) {
      const summary = await getOrderBookSummary(params.tokenId);
      price = params.side === "BUY" 
        ? parseFloat(summary.bestAsk || "0.5")
        : parseFloat(summary.bestBid || "0.5");
    }

    const tickSize = params.tickSize || "0.01";
    const negRisk = params.negRisk ?? false;

    // Create properly signed EIP-712 order
    const pk = getWalletPrivateKey();
    if (!pk) return { status: "error", message: "Wallet private key not configured" };

    const wallet = new ethers.Wallet(pk);
    
    // Use BUILDER_ADDRESS as funder (proxy wallet) if different from signer
    const funderAddress = BUILDER_ADDRESS && BUILDER_ADDRESS.toLowerCase() !== wallet.address.toLowerCase()
      ? BUILDER_ADDRESS
      : undefined;

    const signedOrder = await createSignedOrder(
      wallet,
      params.tokenId,
      price,
      params.amount,
      params.side,
      tickSize,
      negRisk,
      funderAddress
    );

    // Build request with order type
    const orderPayload = {
      order: signedOrder,
      orderType: "GTC", // Good Till Cancelled
      owner: funderAddress || wallet.address,
    };

    const requestPath = "/order";
    const bodyString = JSON.stringify(orderPayload);
    
    // Create headers with builder attribution
    const headers = await createClobAuthHeaders("POST", requestPath, bodyString, true);

    const response = await fetchWithProxy(`${CLOB_API_URL}${requestPath}`, {
      method: "POST",
      headers,
      body: bodyString,
    });

    const responseText = await response.text();
    console.log(`[placeOrder] Response: ${response.status}`, responseText);

    if (!response.ok) {
      return { status: "error", message: `Order failed: ${response.status} - ${responseText}` };
    }

    const orderData = JSON.parse(responseText);
    return {
      orderId: orderData.orderID || orderData.id,
      status: orderData.status || "success",
      message: `${params.side} order placed successfully`,
      details: orderData,
    };
  } catch (error) {
    console.error("[placeOrder] Error:", error);
    return { status: "error", message: error instanceof Error ? error.message : "Unknown error" };
  }
}

// =============================================================================
// Relayer Client - Gasless Transactions
// =============================================================================

interface RelayerTransaction {
  to: string;
  data: string;
  value?: string;
}

interface RelayerResponse {
  success: boolean;
  transactionHash?: string;
  status?: string;
  error?: string;
}

async function executeRelayerTransaction(
  transactions: RelayerTransaction[],
  description: string
): Promise<RelayerResponse> {
  console.log(`[relayer] Executing ${transactions.length} transaction(s): ${description}`);

  if (!BUILDER_API_KEY || !BUILDER_SECRET || !BUILDER_PASSPHRASE) {
    return { success: false, error: "Builder credentials not configured for relayer" };
  }

  try {
    const requestPath = "/execute";
    const body = JSON.stringify({
      transactions,
      description,
    });

    // Relayer uses builder auth headers
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await generateL2Signature(BUILDER_SECRET, timestamp, "POST", requestPath, body);

    const headers: Record<string, string> = {
      "POLY-ADDRESS": BUILDER_ADDRESS,
      "POLY-SIGNATURE": signature,
      "POLY-TIMESTAMP": timestamp,
      "POLY-API-KEY": BUILDER_API_KEY,
      "POLY-PASSPHRASE": BUILDER_PASSPHRASE,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    const response = await fetch(`${RELAYER_URL}${requestPath}`, {
      method: "POST",
      headers,
      body,
    });

    const responseText = await response.text();
    console.log(`[relayer] Response: ${response.status}`, responseText);

    if (!response.ok) {
      return { success: false, error: `Relayer failed: ${response.status} - ${responseText}` };
    }

    const data = JSON.parse(responseText);
    return {
      success: true,
      transactionHash: data.transactionHash || data.hash,
      status: data.status,
    };
  } catch (error) {
    console.error("[relayer] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Deploy a proxy wallet for a user (gasless)
async function deployProxyWallet(userAddress: string): Promise<RelayerResponse> {
  console.log(`[relayer] Deploying proxy wallet for: ${userAddress}`);
  
  // The relayer handles proxy wallet deployment automatically
  // We just need to call the deploy endpoint with builder auth
  const requestPath = "/deploy";
  const body = JSON.stringify({ owner: userAddress });
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await generateL2Signature(BUILDER_SECRET, timestamp, "POST", requestPath, body);

  const headers: Record<string, string> = {
    "POLY-ADDRESS": BUILDER_ADDRESS,
    "POLY-SIGNATURE": signature,
    "POLY-TIMESTAMP": timestamp,
    "POLY-API-KEY": BUILDER_API_KEY,
    "POLY-PASSPHRASE": BUILDER_PASSPHRASE,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(`${RELAYER_URL}${requestPath}`, {
      method: "POST",
      headers,
      body,
    });

    const responseText = await response.text();
    console.log(`[relayer-deploy] Response: ${response.status}`, responseText);

    if (!response.ok) {
      return { success: false, error: `Deploy failed: ${response.status} - ${responseText}` };
    }

    const data = JSON.parse(responseText);
    return {
      success: true,
      transactionHash: data.transactionHash || data.hash,
      status: data.proxyAddress || data.address || "deployed",
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Approve USDC spending for the exchange (gasless via relayer)
async function approveExchangeSpending(negRisk = false): Promise<RelayerResponse> {
  const exchangeAddress = negRisk ? NEG_RISK_CTF_EXCHANGE_ADDRESS : CTF_EXCHANGE_ADDRESS;
  const maxApproval = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  
  // ERC20 approve(address spender, uint256 amount) function selector
  const approveData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256"],
    [exchangeAddress, maxApproval]
  );
  const functionSelector = "0x095ea7b3"; // approve(address,uint256)
  const calldata = functionSelector + approveData.slice(2);

  return await executeRelayerTransaction(
    [{ to: USDC_ADDRESS, data: calldata, value: "0" }],
    `Approve USDC spending for ${negRisk ? "NegRisk " : ""}CTF Exchange`
  );
}

// =============================================================================
// Wallet & Balance
// =============================================================================

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

async function tryRpcProvider(): Promise<ethers.JsonRpcProvider> {
  for (const url of POLYGON_RPCS) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      await provider.getBlockNumber();
      return provider;
    } catch {
      console.warn(`[tryRpcProvider] ${url} failed`);
    }
  }
  throw new Error("All Polygon RPCs failed");
}

async function fetchOnchainBalances(
  provider: ethers.JsonRpcProvider,
  address: string
): Promise<{ usdc: string; matic: string } | undefined> {
  try {
    const maticWei = await provider.getBalance(address);
    const matic = ethers.formatEther(maticWei);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const usdcBal = await usdc.balanceOf(address);
    const decimals = await usdc.decimals();
    const usdcFormatted = ethers.formatUnits(usdcBal, decimals);
    return { usdc: usdcFormatted, matic };
  } catch (e) {
    console.error("[fetchOnchainBalances] Error:", address, e);
    return undefined;
  }
}

async function getWalletBalance(): Promise<{
  address: string;
  balance: string;
  positions: unknown[];
  onchain?: { usdc: string; matic: string };
  builder?: { address: string; onchain?: { usdc: string; matic: string } };
  clob?: unknown;
}> {
  const initialized = await initializeClobCredentials();
  if (!initialized) return { address: "", balance: "0", positions: [] };

  let clobBalance = "0";
  let clobRaw: unknown = null;
  try {
    const requestPath = "/balance-allowance?asset_type=0";
    const doRequest = async (viaProxy: boolean) => {
      const headers = await createClobAuthHeaders("GET", requestPath);
      const url = `${CLOB_API_URL}${requestPath}`;
      const res = viaProxy
        ? await fetchWithProxy(url, { method: "GET", headers })
        : await fetch(url, { method: "GET", headers });
      const text = await res.text();
      return { res, text };
    };

    let { res, text } = await doRequest(false);

    if (!res.ok && res.status === 401) {
      CLOB_API_KEY = "";
      CLOB_API_SECRET = "";
      CLOB_PASSPHRASE = "";
      await initializeClobCredentials();
      ({ res, text } = await doRequest(false));
    }

    if (!res.ok && [401, 403, 429, 503].includes(res.status)) {
      ({ res, text } = await doRequest(true));
    }

    if (res.ok) {
      const data = JSON.parse(text);
      const hasError = data?.error !== undefined;
      const hasBalance = data?.balance !== undefined || data?.availableBalance !== undefined;
      if (!hasError && hasBalance) {
        clobRaw = data;
        clobBalance = String(data?.balance ?? data?.availableBalance ?? data?.available ?? data?.collateral ?? "0");
      }
    }
  } catch (error) {
    console.error("[getWalletBalance] CLOB balance error:", error);
  }

  let positions: unknown[] = [];
  try {
    const resp = await fetch(`https://data-api.polymarket.com/positions?user=${WALLET_ADDRESS}`, {
      headers: { Accept: "application/json" },
    });
    if (resp.ok) {
      const data = await resp.json();
      positions = Array.isArray(data) ? data : (data?.positions ?? []);
    }
  } catch { /* ignore */ }

  let onchain: { usdc: string; matic: string } | undefined;
  let builderOnchain: { usdc: string; matic: string } | undefined;

  try {
    const provider = await tryRpcProvider();
    const shouldCheckBuilder = BUILDER_ADDRESS && BUILDER_ADDRESS.toLowerCase() !== WALLET_ADDRESS.toLowerCase();
    onchain = await fetchOnchainBalances(provider, WALLET_ADDRESS);
    builderOnchain = shouldCheckBuilder ? await fetchOnchainBalances(provider, BUILDER_ADDRESS) : undefined;
  } catch { /* ignore */ }

  return {
    address: WALLET_ADDRESS,
    balance: clobBalance,
    positions,
    onchain,
    builder: BUILDER_ADDRESS && BUILDER_ADDRESS.toLowerCase() !== WALLET_ADDRESS.toLowerCase()
      ? { address: BUILDER_ADDRESS, onchain: builderOnchain }
      : undefined,
    clob: clobRaw ?? undefined,
  };
}

async function getOpenOrders(): Promise<unknown[]> {
  const initialized = await initializeClobCredentials();
  if (!initialized) return [];

  try {
    const requestPath = "/orders";
    const headers = await createClobAuthHeaders("GET", requestPath);
    const response = await fetch(`${CLOB_API_URL}${requestPath}`, { method: "GET", headers });
    if (!response.ok) return [];
    return await response.json();
  } catch { return []; }
}

async function cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  const initialized = await initializeClobCredentials();
  if (!initialized) return { success: false, message: "Failed to initialize credentials" };

  try {
    const requestPath = `/order/${orderId}`;
    const headers = await createClobAuthHeaders("DELETE", requestPath);
    const response = await fetch(`${CLOB_API_URL}${requestPath}`, { method: "DELETE", headers });
    if (!response.ok) return { success: false, message: `Failed to cancel: ${response.status}` };
    return { success: true, message: "Order cancelled successfully" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function redeemWinnings(conditionId: string): Promise<{ success: boolean; message: string; txHash?: string }> {
  const initialized = await initializeClobCredentials();
  if (!initialized) return { success: false, message: "Failed to initialize credentials" };

  try {
    const market = await getMarketDetails(conditionId);
    if (!market) return { success: false, message: "Market not found" };
    if (!market.closed) return { success: false, message: "Market not yet resolved." };

    const requestPath = "/redeem";
    const bodyPayload = { conditionId };
    const bodyString = JSON.stringify(bodyPayload);
    const headers = await createClobAuthHeaders("POST", requestPath, bodyString);

    const response = await fetch(`${CLOB_API_URL}${requestPath}`, {
      method: "POST",
      headers,
      body: bodyString,
    });

    const responseText = await response.text();
    if (!response.ok) return { success: false, message: `Redeem failed: ${responseText}` };

    const data = JSON.parse(responseText);
    return { success: true, message: "Winnings redeemed!", txHash: data.transactionHash };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

// =============================================================================
// Diagnostics
// =============================================================================

interface DiagResult {
  l1_derive_ok: boolean;
  l1_derive_status?: number;
  l1_derive_error?: string;
  balance_direct_status?: number;
  balance_direct_ok: boolean;
  balance_proxy_status?: number;
  balance_proxy_ok: boolean;
  builder_attribution_configured: boolean;
  relayer_available: boolean;
  headers_sent: string[];
  wallet_address_masked: string;
  builder_address_masked: string;
}

async function runDiagnostics(): Promise<DiagResult> {
  const result: DiagResult = {
    l1_derive_ok: false,
    balance_direct_ok: false,
    balance_proxy_ok: false,
    builder_attribution_configured: !!(BUILDER_API_KEY && BUILDER_SECRET && BUILDER_PASSPHRASE),
    relayer_available: !!(BUILDER_API_KEY && BUILDER_SECRET),
    headers_sent: [],
    wallet_address_masked: WALLET_ADDRESS ? `${WALLET_ADDRESS.slice(0, 6)}...${WALLET_ADDRESS.slice(-4)}` : "not set",
    builder_address_masked: BUILDER_ADDRESS ? `${BUILDER_ADDRESS.slice(0, 6)}...${BUILDER_ADDRESS.slice(-4)}` : "not set",
  };

  try {
    CLOB_API_KEY = "";
    CLOB_API_SECRET = "";
    CLOB_PASSPHRASE = "";
    const initialized = await initializeClobCredentials();
    result.l1_derive_ok = initialized && !!CLOB_API_KEY;
    result.l1_derive_status = initialized ? 200 : 0;
  } catch (e) {
    result.l1_derive_error = e instanceof Error ? e.message.slice(0, 100) : "unknown";
  }

  try {
    const requestPath = "/balance-allowance?asset_type=0";
    const headers = await createClobAuthHeaders("GET", requestPath);
    result.headers_sent = Object.keys(headers);
    const res = await fetch(`${CLOB_API_URL}${requestPath}`, { method: "GET", headers });
    result.balance_direct_status = res.status;
    result.balance_direct_ok = res.ok;
  } catch { /* ignore */ }

  try {
    const requestPath = "/balance-allowance?asset_type=0";
    const headers = await createClobAuthHeaders("GET", requestPath);
    const res = await fetchWithProxy(`${CLOB_API_URL}${requestPath}`, { method: "GET", headers });
    result.balance_proxy_status = res.status;
    result.balance_proxy_ok = res.ok;
  } catch { /* ignore */ }

  return result;
}

function formatDiagForChat(diag: DiagResult): string {
  return [
    `🔧 **Polymarket Diagnostics**`,
    ``,
    `**Wallet:** ${diag.wallet_address_masked}`,
    `**Builder:** ${diag.builder_address_masked}`,
    ``,
    `**L1 Auth:** ${diag.l1_derive_ok ? "✅ OK" : "❌ FAIL"}${diag.l1_derive_error ? ` (${diag.l1_derive_error})` : ""}`,
    `**Balance (direct):** ${diag.balance_direct_ok ? "✅" : "❌"} (${diag.balance_direct_status ?? "N/A"})`,
    `**Balance (proxy):** ${diag.balance_proxy_ok ? "✅" : "❌"} (${diag.balance_proxy_status ?? "N/A"})`,
    `**Builder Attribution:** ${diag.builder_attribution_configured ? "✅ Configured" : "❌ Not configured"}`,
    `**Relayer (Gasless):** ${diag.relayer_available ? "✅ Available" : "❌ Not available"}`,
    ``,
    `**Headers:** ${diag.headers_sent.filter(h => h.startsWith("POLY")).join(", ")}`,
  ].join("\n");
}

// =============================================================================
// Chat Formatting Helpers
// =============================================================================

function formatTradeResultForChat(result: OrderResult, side: string, tokenId: string, amount: number): string {
  if (result.status === "success" || result.orderId) {
    return `✅ **${side} Order Placed**
Order ID: \`${result.orderId || "pending"}\`
Token: \`${tokenId.slice(0, 20)}...\`
Amount: ${amount} shares
Status: ${result.message}
🏷️ *Builder attributed*`;
  }
  return `❌ **Order Failed**\nError: ${result.message}`;
}

function formatWalletForChat(wallet: {
  address: string;
  balance: string;
  positions: unknown[];
  onchain?: { usdc: string; matic: string };
  builder?: { address: string; onchain?: { usdc: string; matic: string } };
}): string {
  const toUsd = (v?: string) => {
    const n = v ? Number.parseFloat(v) : NaN;
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : "N/A";
  };

  const clobBal = Number.parseFloat(wallet.balance || "0");
  const clobUsd = Number.isFinite(clobBal) ? `$${clobBal.toFixed(2)}` : "$0.00";

  if (wallet.builder) {
    return `💰 **Wallet**
Address: \`${wallet.builder.address}\`
CLOB Balance: ${clobUsd}
On-chain USDC: ${toUsd(wallet.builder.onchain?.usdc)}
Open Positions: ${wallet.positions.length}`;
  }

  return `💰 **Wallet**
Address: \`${wallet.address}\`
CLOB Balance: ${clobUsd}
On-chain USDC: ${toUsd(wallet.onchain?.usdc)}
Open Positions: ${wallet.positions.length}`;
}

function formatMarketForChat(market: MarketInfo): string {
  let priceInfo = "N/A";
  
  if (market.outcomePrices && market.outcomes) {
    try {
      const prices = JSON.parse(market.outcomePrices) as number[];
      const outcomes = JSON.parse(market.outcomes) as string[];
      priceInfo = outcomes.map((o, i) => `${o}: ${(prices[i] * 100).toFixed(1)}%`).join(", ");
    } catch { /* ignore */ }
  }
  
  if (priceInfo === "N/A" && (market.bestBid || market.bestAsk)) {
    const yesPrice = market.bestAsk ? (market.bestAsk * 100).toFixed(1) : "?";
    const noPrice = market.bestBid ? ((1 - market.bestBid) * 100).toFixed(1) : "?";
    priceInfo = `Yes: ${yesPrice}%, No: ${noPrice}%`;
  }
  
  if (priceInfo === "N/A" && market.tokens && market.tokens.length > 0) {
    priceInfo = market.tokens.map(t => `${t.outcome}: ${((t.price || 0) * 100).toFixed(1)}%`).join(", ");
  }

  const volume = typeof market.volume24hr === 'number' 
    ? market.volume24hr.toLocaleString() 
    : parseFloat(String(market.volume24hr || "0")).toLocaleString();

  const marketId = market.conditionId || market.condition_id || market.id;
  const slug = market.slug || market.market_slug || "";
  
  return `📊 **${market.question}**
ID: \`${marketId}\`
${slug ? `Slug: ${slug}\n` : ""}Prices: ${priceInfo}
Volume 24h: $${volume}
Status: ${market.active ? "🟢 Active" : "🔴 Inactive"}`;
}

function formatOrderBookForChat(summary: OrderBookSummary): string {
  return `📈 **Order Book Summary**
Token: \`${summary.tokenId.slice(0, 20)}...\`
Best Bid: ${summary.bestBid || "N/A"}
Best Ask: ${summary.bestAsk || "N/A"}
Spread: ${summary.spread || "N/A"} (${summary.spreadPercent || "N/A"}%)
Midpoint: ${summary.midpoint || "N/A"}
Bid Depth: ${summary.bidDepth} orders
Ask Depth: ${summary.askDepth} orders`;
}

// =============================================================================
// HTTP Server
// =============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    console.log(`[polymarket-actions] Action: ${action}, Params:`, params);

    let data;
    let formattedResponse: string | undefined;

    switch (action) {
      // ==================== SEARCH / DISCOVERY ====================
      case "searchMarkets":
      case "GET_MARKETS": {
        const result = await searchMarkets(params?.query || "", params?.limit || 10);
        data = result;
        formattedResponse = result.markets.length > 0
          ? `Found ${result.total} markets for "${result.query}":\n\n` + 
            result.markets.map(m => formatMarketForChat(m)).join("\n\n---\n\n")
          : `No markets found for "${result.query}"`;
        break;
      }

      case "getMarketDetails":
      case "GET_MARKET_DETAILS": {
        const market = await getMarketDetails(params?.marketId);
        data = market;
        formattedResponse = market ? formatMarketForChat(market) : "Market not found";
        break;
      }

      // ==================== ORDER BOOK / PRICING ====================
      case "getOrderBookSummary":
      case "GET_ORDER_BOOK_SUMMARY": {
        const summary = await getOrderBookSummary(params?.tokenId);
        data = summary;
        formattedResponse = formatOrderBookForChat(summary);
        break;
      }

      case "getBestPrice":
      case "GET_BEST_PRICE": {
        const price = await getBestPrice(params?.tokenId, params?.side || "buy");
        data = { price };
        formattedResponse = `Best ${params?.side || "buy"} price: ${price || "N/A"}`;
        break;
      }

      case "getSpread":
      case "GET_SPREAD": {
        const spreadInfo = await getSpread(params?.tokenId);
        data = spreadInfo;
        formattedResponse = `Spread: ${spreadInfo.spread || "N/A"} (${spreadInfo.spreadPercent || "N/A"}%)`;
        break;
      }

      case "getAllMarkets": {
        data = await getAllMarkets(params?.limit, params?.offset);
        break;
      }

      case "getPriceHistory": {
        data = await getPriceHistory(params?.tokenId, params?.interval);
        break;
      }

      // ==================== TRADING CAPABILITY ====================
      case "checkTradingCapability": {
        data = checkTradingCapability();
        break;
      }

      // ==================== TRADING ACTIONS (with Builder Attribution) ====================
      case "buy":
      case "PLACE_ORDER_BUY": {
        const capability = checkTradingCapability();
        if (!capability.canTrade) {
          data = { status: "error", message: capability.reason };
          formattedResponse = `❌ Trading disabled: ${capability.reason}`;
        } else {
          let tokenId = params?.tokenId;
          let marketTitle = "Unknown Market";
          let tickSize = params?.tickSize || "0.01";
          let negRisk = params?.negRisk ?? false;
          
          if (!tokenId && params?.marketSlug) {
            const resolved = await resolveTokenId(params.marketSlug, params?.outcome || "YES");
            if (!resolved) {
              data = { status: "error", message: `Market not found: ${params.marketSlug}` };
              formattedResponse = `❌ **Market Not Found**\nCould not find: "${params.marketSlug}"`;
              break;
            }
            tokenId = resolved.tokenId;
            marketTitle = resolved.marketTitle;
            tickSize = resolved.tickSize;
            negRisk = resolved.negRisk;
          }
          
          if (!tokenId) {
            data = { status: "error", message: "Missing tokenId or marketSlug" };
            formattedResponse = `❌ **Missing Parameter**\nProvide a market (e.g., /buy trump 0.1)`;
            break;
          }
          
          const result = await placeOrder({
            tokenId,
            amount: params?.amount || 1,
            price: params?.price,
            side: "BUY",
            tickSize,
            negRisk,
          });
          data = result;
          formattedResponse = formatTradeResultForChat(result, "BUY", marketTitle, params?.amount || 1);
        }
        break;
      }

      case "sell":
      case "PLACE_ORDER_SELL": {
        const capability = checkTradingCapability();
        if (!capability.canTrade) {
          data = { status: "error", message: capability.reason };
          formattedResponse = `❌ Trading disabled: ${capability.reason}`;
        } else {
          let tokenId = params?.tokenId;
          let marketTitle = "Unknown Market";
          let tickSize = params?.tickSize || "0.01";
          let negRisk = params?.negRisk ?? false;
          
          if (!tokenId && params?.marketSlug) {
            const resolved = await resolveTokenId(params.marketSlug, params?.outcome || "YES");
            if (!resolved) {
              data = { status: "error", message: `Market not found: ${params.marketSlug}` };
              formattedResponse = `❌ **Market Not Found**\nCould not find: "${params.marketSlug}"`;
              break;
            }
            tokenId = resolved.tokenId;
            marketTitle = resolved.marketTitle;
            tickSize = resolved.tickSize;
            negRisk = resolved.negRisk;
          }
          
          if (!tokenId) {
            data = { status: "error", message: "Missing tokenId or marketSlug" };
            formattedResponse = `❌ **Missing Parameter**\nProvide a market (e.g., /sell trump 1)`;
            break;
          }
          
          const result = await placeOrder({
            tokenId,
            amount: params?.amount || 1,
            price: params?.price,
            side: "SELL",
            tickSize,
            negRisk,
          });
          data = result;
          formattedResponse = formatTradeResultForChat(result, "SELL", marketTitle, params?.amount || 1);
        }
        break;
      }

      case "redeem":
      case "REDEEM_WINNINGS": {
        const capability = checkTradingCapability();
        if (!capability.canTrade) {
          data = { status: "error", message: capability.reason };
          formattedResponse = `❌ Trading disabled: ${capability.reason}`;
        } else {
          const result = await redeemWinnings(params?.conditionId || params?.marketId);
          data = result;
          formattedResponse = result.success 
            ? `✅ ${result.message}${result.txHash ? `\nTx: \`${result.txHash}\`` : ""}`
            : `❌ ${result.message}`;
        }
        break;
      }

      // ==================== WALLET & ORDERS ====================
      case "wallet":
      case "GET_WALLET_BALANCE": {
        const capability = checkTradingCapability();
        if (!capability.canTrade) {
          data = { status: "error", message: capability.reason };
          formattedResponse = `❌ ${capability.reason}`;
        } else {
          const wallet = await getWalletBalance();
          data = wallet;
          formattedResponse = formatWalletForChat(wallet);
        }
        break;
      }

      case "orders":
      case "GET_OPEN_ORDERS": {
        const capability = checkTradingCapability();
        if (!capability.canTrade) {
          data = { status: "error", message: capability.reason };
          formattedResponse = `❌ ${capability.reason}`;
        } else {
          const orders = await getOpenOrders();
          data = orders;
          formattedResponse = orders.length > 0
            ? `📋 **Open Orders (${orders.length})**\n` + JSON.stringify(orders, null, 2).slice(0, 500)
            : "📋 No open orders";
        }
        break;
      }

      case "cancel":
      case "CANCEL_ORDER": {
        const capability = checkTradingCapability();
        if (!capability.canTrade) {
          data = { status: "error", message: capability.reason };
          formattedResponse = `❌ ${capability.reason}`;
        } else {
          const result = await cancelOrder(params?.orderId);
          data = result;
          formattedResponse = result.success ? `✅ ${result.message}` : `❌ ${result.message}`;
        }
        break;
      }

      // ==================== RELAYER (GASLESS) ====================
      case "deployProxyWallet": {
        const result = await deployProxyWallet(params?.userAddress || WALLET_ADDRESS);
        data = result;
        formattedResponse = result.success
          ? `✅ Proxy wallet deployed!\nAddress: ${result.status}\nTx: \`${result.transactionHash}\``
          : `❌ Deploy failed: ${result.error}`;
        break;
      }

      case "approveSpending": {
        const result = await approveExchangeSpending(params?.negRisk ?? false);
        data = result;
        formattedResponse = result.success
          ? `✅ USDC spending approved for exchange\nTx: \`${result.transactionHash}\``
          : `❌ Approval failed: ${result.error}`;
        break;
      }

      case "relayTransaction": {
        if (!params?.transactions) {
          data = { success: false, error: "Missing transactions" };
          formattedResponse = "❌ Missing transactions parameter";
        } else {
          const result = await executeRelayerTransaction(params.transactions, params?.description || "Custom transaction");
          data = result;
          formattedResponse = result.success
            ? `✅ Transaction relayed!\nTx: \`${result.transactionHash}\``
            : `❌ Relay failed: ${result.error}`;
        }
        break;
      }

      // ==================== DIAGNOSTICS ====================
      case "diag":
      case "DIAG": {
        const diagResult = await runDiagnostics();
        data = diagResult;
        formattedResponse = formatDiagForChat(diagResult);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data, formattedResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[polymarket-actions] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
