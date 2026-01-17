import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { ethers } from "https://esm.sh/ethers@6.13.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      
      // Build headers array for target request (Bright Data format)
      const targetHeaders: Array<{name: string; value: string}> = [];
      if (options.headers) {
        const headers = options.headers as Record<string, string>;
        Object.entries(headers).forEach(([key, value]) => {
          if (typeof value === "string") {
            targetHeaders.push({ name: key, value: value });
          }
        });
      }
      
      console.log("[fetchWithProxy] Target headers count:", targetHeaders.length);
      
      // Bright Data Web Unlocker API request
      // See: https://docs.brightdata.com/scraping-automation/web-unlocker/web-unlocker-api
      const payload: Record<string, unknown> = {
        zone: BRIGHT_DATA_ZONE,
        url: url,
        format: "raw", // Get raw response from target
        country: "us", // Use US residential IP for Polymarket
      };
      
      // Add method
      payload.method = (options.method || "GET").toUpperCase();
      
      // Add body if present (for POST requests)
      if (options.body) {
        payload.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
        console.log("[fetchWithProxy] Request body length:", String(payload.body).length);
      }
      
      // Add headers if present - Bright Data accepts object format for headers
      if (targetHeaders.length > 0) {
        // Convert array to object format (which Bright Data also accepts)
        const headersObj: Record<string, string> = {};
        targetHeaders.forEach(h => {
          headersObj[h.name] = h.value;
        });
        payload.headers = headersObj;
        console.log("[fetchWithProxy] Headers being sent:", Object.keys(headersObj).join(", "));
      }
      
      console.log("[fetchWithProxy] Bright Data payload method:", payload.method, "url:", url);
      
      const proxyResponse = await fetch(BRIGHT_DATA_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log("[fetchWithProxy] Bright Data response status:", proxyResponse.status);
      
      if (proxyResponse.ok) {
        const responseText = await proxyResponse.text();
        console.log("[fetchWithProxy] Bright Data success, response length:", responseText.length);
        
        // Try to parse as JSON
        try {
          const jsonData = JSON.parse(responseText);
          return new Response(JSON.stringify(jsonData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          // Return raw text if not JSON
          return new Response(responseText, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }
      } else {
        const errorText = await proxyResponse.text();
        console.error("[fetchWithProxy] Bright Data error:", proxyResponse.status, errorText);
        // Fall through to direct request
      }
    } catch (brightDataErr) {
      console.error("[fetchWithProxy] Bright Data error:", brightDataErr);
      // Fall through to direct request
    }
  } else {
    console.log("[fetchWithProxy] No Bright Data API key, using direct request");
  }
  
  // Direct request as final fallback
  console.log("[fetchWithProxy] Using direct request to:", url);
  return fetch(url, options);
}

const CLOB_API_URL = "https://clob.polymarket.com";
const GAMMA_API_URL = "https://gamma-api.polymarket.com";
const CHAIN_ID = 137; // Polygon Mainnet

// Multiple RPC endpoints for fallback (public, no auth)
const POLYGON_RPCS = [
  "https://polygon-bor-rpc.publicnode.com",
  "https://1rpc.io/matic",
  "https://endpoints.omniatech.io/v1/matic/mainnet/public",
];
const USDC_POLYGON_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC (PoS)

// Builder credentials from environment
const BUILDER_ADDRESS = Deno.env.get("POLYMARKET_BUILDER_ADDRESS") || "";
const BUILDER_API_KEY = Deno.env.get("POLYMARKET_BUILDER_API_KEY") || "";
const BUILDER_SECRET = Deno.env.get("POLYMARKET_BUILDER_SECRET") || "";
const BUILDER_PASSPHRASE = Deno.env.get("POLYMARKET_BUILDER_PASSPHRASE") || "";

// CLOB Trading credentials
const getWalletPrivateKey = () => Deno.env.get("WALLET_PRIVATE_KEY") || "";

// Derived CLOB API credentials (cached per-wallet; reset if wallet changes)
let CLOB_API_KEY = "";
let CLOB_API_SECRET = "";
let CLOB_PASSPHRASE = "";
let WALLET_ADDRESS = "";

// =============================================================================
// Types (matching plugin-polymarket structure)
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
  // Gamma API specific fields
  bestBid?: number;
  bestAsk?: number;
  outcomePrices?: string; // JSON string like "[0.52, 0.48]"
  outcomes?: string; // JSON string like '["Yes", "No"]'
  clobTokenIds?: string; // JSON string like '["tokenId1", "tokenId2"]'
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
// Helper Functions
// =============================================================================

async function generateL2Signature(
  secret: string,
  timestamp: string,
  method: string,
  requestPath: string,
  body: string = ""
): Promise<string> {
  const message = timestamp + method + requestPath + body;
  const encoder = new TextEncoder();
  
  let keyData: Uint8Array;
  try {
    const decoded = base64Decode(secret);
    keyData = new Uint8Array(decoded);
  } catch {
    keyData = encoder.encode(secret);
  }
  
  const keyBuffer = new ArrayBuffer(keyData.length);
  const keyView = new Uint8Array(keyBuffer);
  keyView.set(keyData);
  
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
// Action: Search Markets (GET_MARKETS / /market command)
// =============================================================================

async function searchMarkets(query: string, limit = 10): Promise<SearchResult> {
  console.log(`[searchMarkets] Searching for: "${query}"`);
  
  // Use Gamma API for search capability
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
  
  // Filter by query (case-insensitive search in question and description)
  const queryLower = query.toLowerCase();
  const filtered = allMarkets.filter(m => 
    m.question?.toLowerCase().includes(queryLower) ||
    m.description?.toLowerCase().includes(queryLower) ||
    m.market_slug?.toLowerCase().includes(queryLower)
  ).slice(0, limit);

  console.log(`[searchMarkets] Found ${filtered.length} markets matching "${query}"`);
  
  return {
    markets: filtered,
    total: filtered.length,
    query,
  };
}

// =============================================================================
// Helper: Resolve marketSlug to tokenId
// =============================================================================

async function resolveTokenId(marketSlugOrTokenId: string, outcome: "YES" | "NO" = "YES"): Promise<{ tokenId: string; marketTitle: string } | null> {
  console.log(`[resolveTokenId] Resolving: "${marketSlugOrTokenId}", outcome: ${outcome}`);
  
  // If it looks like a token ID (long numeric string), return as-is
  if (/^\d{50,}$/.test(marketSlugOrTokenId)) {
    console.log(`[resolveTokenId] Already a tokenId`);
    return { tokenId: marketSlugOrTokenId, marketTitle: "Unknown" };
  }
  
  // Search for the market using the slug/query
  try {
    const searchResult = await searchMarkets(marketSlugOrTokenId, 5);
    if (searchResult.markets.length === 0) {
      console.log(`[resolveTokenId] No markets found for: ${marketSlugOrTokenId}`);
      return null;
    }
    
    const market = searchResult.markets[0];
    console.log(`[resolveTokenId] Found market: ${market.question}`);
    
    // Try to parse clobTokenIds (it's a JSON string from Gamma API)
    if (market.clobTokenIds) {
      try {
        const tokenIds: string[] = JSON.parse(market.clobTokenIds);
        if (tokenIds.length > 0) {
          // clobTokenIds[0] = YES, clobTokenIds[1] = NO (typically)
          const tokenIndex = outcome === "YES" ? 0 : 1;
          const tokenId = tokenIds[tokenIndex] || tokenIds[0];
          console.log(`[resolveTokenId] Resolved from clobTokenIds: ${tokenId}`);
          return { tokenId, marketTitle: market.question || market.market_slug || "Unknown" };
        }
      } catch (parseErr) {
        console.error(`[resolveTokenId] Failed to parse clobTokenIds:`, parseErr);
      }
    }
    
    // Get the token ID from tokens array
    if (market.tokens && market.tokens.length > 0) {
      // Find the token matching the outcome
      const outcomeToken = market.tokens.find(t => 
        t.outcome?.toUpperCase() === outcome || 
        t.outcome?.toUpperCase() === "YES" && outcome === "YES" ||
        t.outcome?.toUpperCase() === "NO" && outcome === "NO"
      );
      
      const tokenId = outcomeToken?.token_id || market.tokens[0].token_id;
      console.log(`[resolveTokenId] Resolved from tokens: ${tokenId}`);
      return { tokenId, marketTitle: market.question || market.market_slug || "Unknown" };
    }
    
    // Fallback to condition_id if no tokens
    if (market.condition_id || market.conditionId) {
      const conditionId = market.condition_id || market.conditionId || "";
      console.log(`[resolveTokenId] Using condition_id as fallback: ${conditionId}`);
      return { tokenId: conditionId, marketTitle: market.question || "Unknown" };
    }
    
    console.log(`[resolveTokenId] No tokenId found for market`);
    return null;
  } catch (error) {
    console.error(`[resolveTokenId] Error:`, error);
    return null;
  }
}

// =============================================================================
// Action: Get Market Details (GET_MARKET_DETAILS / /explain command)
// =============================================================================

async function getMarketDetails(marketId: string): Promise<MarketInfo | null> {
  console.log(`[getMarketDetails] Fetching market: ${marketId}`);
  
  // Try Gamma API first (more detailed info)
  try {
    const gammaResponse = await fetch(`${GAMMA_API_URL}/markets/${marketId}`, {
      headers: { "Accept": "application/json" },
    });
    
    if (gammaResponse.ok) {
      const market = await gammaResponse.json();
      console.log(`[getMarketDetails] Found market on Gamma API`);
      return market;
    }
  } catch (e) {
    console.log(`[getMarketDetails] Gamma API failed, trying CLOB`);
  }
  
  // Fallback to CLOB API
  const clobResponse = await fetch(`${CLOB_API_URL}/markets/${marketId}`, {
    headers: { "Accept": "application/json" },
  });
  
  if (!clobResponse.ok) {
    console.error(`[getMarketDetails] Market not found: ${marketId}`);
    return null;
  }
  
  return await clobResponse.json();
}

// =============================================================================
// Action: Get Order Book Summary (GET_ORDER_BOOK_SUMMARY / /orderbook command)
// =============================================================================

async function getOrderBookSummary(tokenId: string): Promise<OrderBookSummary> {
  console.log(`[getOrderBookSummary] Fetching order book for token: ${tokenId}`);
  
  const url = new URL(`${CLOB_API_URL}/book`);
  url.searchParams.set("token_id", tokenId);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order book: ${response.status}`);
  }

  const book = await response.json();
  
  // Extract best prices
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

  return {
    tokenId,
    bestBid,
    bestAsk,
    spread,
    spreadPercent,
    bidDepth: bids.length,
    askDepth: asks.length,
    midpoint,
  };
}

// =============================================================================
// Action: Get Best Price
// =============================================================================

async function getBestPrice(tokenId: string, side: "buy" | "sell"): Promise<string | null> {
  const summary = await getOrderBookSummary(tokenId);
  return side === "buy" ? summary.bestAsk : summary.bestBid;
}

// =============================================================================
// Action: Get Spread
// =============================================================================

async function getSpread(tokenId: string): Promise<{ spread: string | null; spreadPercent: string | null }> {
  const summary = await getOrderBookSummary(tokenId);
  return { 
    spread: summary.spread, 
    spreadPercent: summary.spreadPercent 
  };
}

// =============================================================================
// Action: Get All Markets (paginated)
// =============================================================================

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

  if (!response.ok) {
    throw new Error(`Failed to fetch markets: ${response.status}`);
  }

  return await response.json();
}

// =============================================================================
// Action: Get Price History
// =============================================================================

async function getPriceHistory(tokenId: string, interval = "1d"): Promise<unknown> {
  const url = new URL(`${CLOB_API_URL}/prices-history`);
  url.searchParams.set("market", tokenId);
  url.searchParams.set("interval", interval);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch price history: ${response.status}`);
  }

  return await response.json();
}

// =============================================================================
// Action: Check Trading Capability
// =============================================================================

function checkTradingCapability(): { canTrade: boolean; reason?: string } {
  if (!getWalletPrivateKey()) {
    return {
      canTrade: false,
      reason: "WALLET_PRIVATE_KEY not configured. Trading is disabled."
    };
  }

  return { canTrade: true };
}

// =============================================================================
// CLOB API Credential Derivation (from plugin-polymarket)
// =============================================================================

async function initializeClobCredentials(): Promise<boolean> {
  const pk = getWalletPrivateKey();
  if (!pk) {
    console.error("[initializeClobCredentials] No wallet private key configured");
    return false;
  }

  try {
    const wallet = new ethers.Wallet(pk);
    const derivedAddress = wallet.address;

    // If user updated the secret, the derived wallet address will change.
    // Reset cached API creds so we re-auth against CLOB with the new wallet.
    if (WALLET_ADDRESS && WALLET_ADDRESS.toLowerCase() !== derivedAddress.toLowerCase()) {
      console.log("[initializeClobCredentials] Wallet changed; clearing cached CLOB credentials");
      CLOB_API_KEY = "";
      CLOB_API_SECRET = "";
      CLOB_PASSPHRASE = "";
    }

    WALLET_ADDRESS = derivedAddress;
    console.log(`[initializeClobCredentials] Wallet address: ${WALLET_ADDRESS}`);

    if (CLOB_API_KEY && CLOB_API_SECRET && CLOB_PASSPHRASE) {
      console.log("[initializeClobCredentials] Already initialized");
      return true;
    }

    // Try L1 authentication (works for all wallets)
    return await createNewApiKey(wallet);
  } catch (error) {
    console.error("[initializeClobCredentials] Error:", error);
    return false;
  }
}

async function createNewApiKey(wallet: ethers.Wallet): Promise<boolean> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = 0;

    // L1 Authentication using EIP-712 typed data signature
    const domain = {
      name: "ClobAuthDomain",
      version: "1",
      chainId: CHAIN_ID,
    };

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
    console.log("[createNewApiKey] Creating API key with EIP-712 signature...");

    // L1 Auth requires BOTH headers AND body with the same params
    // CRITICAL: Use UNDERSCORE style headers (POLY_ADDRESS per official docs)
    const l1Headers = {
      "Content-Type": "application/json",
      "POLY_ADDRESS": wallet.address.toLowerCase(),
      "POLY_SIGNATURE": signature,
      "POLY_TIMESTAMP": timestamp.toString(),
      "POLY_NONCE": nonce.toString(),
    };

    // Try POST to create new API key (use proxy to bypass Cloudflare)
    // CRITICAL: timestamp must be STRING in body to match headers (API requirement)
    const response = await fetchWithProxy(`${CLOB_API_URL}/auth/api-key`, {
      method: "POST",
      headers: l1Headers,
      body: JSON.stringify({
        address: wallet.address.toLowerCase(),
        timestamp: timestamp.toString(), // Must be string to match header
        nonce,
        signature,
      }),
    });

    const responseText = await response.text();
    console.log("[createNewApiKey] Response:", response.status, responseText);

    if (!response.ok) {
      // If create fails (409 = already exists), try derive endpoint
      if (response.status === 409 || response.status === 400) {
        console.log("[createNewApiKey] Create failed, trying derive...");
        return await deriveApiKey(wallet, timestamp, nonce, signature);
      }
      // For 401, might need different signature format
      if (response.status === 401) {
        console.log("[createNewApiKey] Auth failed, trying derive with fresh signature...");
        return await deriveApiKey(wallet, timestamp, nonce, signature);
      }
      return false;
    }

    const data = JSON.parse(responseText);
    CLOB_API_KEY = data.apiKey;
    CLOB_API_SECRET = data.secret;
    CLOB_PASSPHRASE = data.passphrase;
    
    console.log("[createNewApiKey] Successfully created new CLOB API credentials");
    return true;
  } catch (error) {
    console.error("[createNewApiKey] Error:", error);
    return false;
  }
}

async function deriveApiKey(wallet: ethers.Wallet, timestamp: number, nonce: number, existingSignature?: string): Promise<boolean> {
  try {
    // Use existing signature or create new one
    let signature = existingSignature;
    
    if (!signature) {
      const domain = {
        name: "ClobAuthDomain",
        version: "1",
        chainId: CHAIN_ID,
      };

      const types = {
        ClobAuth: [
          { name: "address", type: "address" },
          { name: "timestamp", type: "string" },
          { name: "nonce", type: "uint256" },
          { name: "message", type: "string" },
        ],
      };

      const message = {
        address: wallet.address,
        timestamp: timestamp.toString(),
        nonce,
        message: "This message attests that I control the given wallet",
      };

      signature = await wallet.signTypedData(domain, types, message);
    }

    // L1 Headers for derive endpoint (GET request)
    // CRITICAL: Use UNDERSCORE style headers (POLY_ADDRESS per official docs)
    const l1Headers = {
      "Content-Type": "application/json",
      "POLY_ADDRESS": wallet.address.toLowerCase(),
      "POLY_SIGNATURE": signature,
      "POLY_TIMESTAMP": timestamp.toString(),
      "POLY_NONCE": nonce.toString(),
    };

    // Try GET first (standard derive) - use proxy to bypass Cloudflare
    const response = await fetchWithProxy(`${CLOB_API_URL}/auth/derive-api-key`, {
      method: "GET",
      headers: l1Headers,
    });

    const responseText = await response.text();
    console.log("[deriveApiKey] Response:", response.status, responseText);

    if (!response.ok) {
      console.error("[deriveApiKey] Failed - wallet may need to sign up on Polymarket.com first");
      return false;
    }

    const data = JSON.parse(responseText);
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

// Browser-like headers to bypass Cloudflare protection
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"macOS"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site",
  "Origin": "https://polymarket.com",
  "Referer": "https://polymarket.com/",
};

async function createClobAuthHeaders(
  method: string,
  requestPath: string,
  body: string = ""
): Promise<Record<string, string>> {
  const initialized = await initializeClobCredentials();
  if (!initialized || !CLOB_API_KEY || !CLOB_API_SECRET || !CLOB_PASSPHRASE || !WALLET_ADDRESS) {
    throw new Error("CLOB credentials not initialized");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await generateL2Signature(CLOB_API_SECRET, timestamp, method, requestPath, body);

  // Use BUILDER_ADDRESS as proxy wallet (1/1 Safe multisig that holds funds)
  // The signer (WALLET_ADDRESS) signs for the proxy wallet
  const proxyAddress = BUILDER_ADDRESS || "";

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

  // Add proxy address header if configured (for Safe multisig trading)
  if (proxyAddress && proxyAddress.toLowerCase() !== WALLET_ADDRESS.toLowerCase()) {
    headers["POLY-PROXY-ADDRESS"] = proxyAddress;
    console.log(`[createClobAuthHeaders] Using proxy wallet: ${proxyAddress}`);
  }

  return headers;
}

// =============================================================================
// Trading Actions (BUY / SELL / REDEEM)
// =============================================================================

interface TradeParams {
  tokenId: string;
  amount: number; // Amount of shares
  price?: number; // Limit price (0-1), if not provided uses market price
  side: "BUY" | "SELL";
}

interface OrderResult {
  orderId?: string;
  status: string;
  message: string;
  details?: unknown;
}

async function placeOrder(params: TradeParams): Promise<OrderResult> {
  console.log(`[placeOrder] Placing ${params.side} order:`, params);
  
  // Initialize credentials
  const initialized = await initializeClobCredentials();
  if (!initialized) {
    return {
      status: "error",
      message: "Failed to initialize trading credentials. Please check your wallet private key.",
    };
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

    // Build order payload following Polymarket CLOB API spec
    const orderPayload = {
      tokenId: params.tokenId,
      price: price.toString(),
      size: params.amount.toString(),
      side: params.side,
      type: "GTC", // Good Till Cancelled
      feeRateBps: "100", // 1% fee
    };

    // Sign the order
    const pk = getWalletPrivateKey();
    if (!pk) {
      return { status: "error", message: "Wallet private key not configured" };
    }

    const wallet = new ethers.Wallet(pk);
    const orderHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(orderPayload)));
    const orderSignature = await wallet.signMessage(ethers.getBytes(orderHash));

    const signedOrder = {
      ...orderPayload,
      maker: WALLET_ADDRESS,
      signature: orderSignature,
    };

    const requestPath = "/order";
    const bodyString = JSON.stringify(signedOrder);
    const headers = await createClobAuthHeaders("POST", requestPath, bodyString);

    // Use proxy for trading requests to bypass Cloudflare
    const response = await fetchWithProxy(`${CLOB_API_URL}${requestPath}`, {
      method: "POST",
      headers,
      body: bodyString,
    });

    const responseText = await response.text();
    console.log(`[placeOrder] Response: ${response.status}`, responseText);

    if (!response.ok) {
      return {
        status: "error",
        message: `Order failed: ${response.status} - ${responseText}`,
      };
    }

    const orderData = JSON.parse(responseText);
    return {
      orderId: orderData.orderID || orderData.id,
      status: "success",
      message: `${params.side} order placed successfully`,
      details: orderData,
    };
  } catch (error) {
    console.error("[placeOrder] Error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error placing order",
    };
  }
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

async function tryRpcProvider(): Promise<ethers.JsonRpcProvider> {
  for (const url of POLYGON_RPCS) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      await provider.getBlockNumber(); // quick connectivity test
      return provider;
    } catch {
      console.warn(`[tryRpcProvider] ${url} failed, trying next...`);
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

    const usdc = new ethers.Contract(USDC_POLYGON_ADDRESS, ERC20_ABI, provider);
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
  balance: string; // CLOB balance (collateral)
  positions: unknown[];
  onchain?: { usdc: string; matic: string };
  builder?: { address: string; onchain?: { usdc: string; matic: string } };
  clob?: unknown;
}> {
  console.log("[getWalletBalance] Fetching wallet info");

  const initialized = await initializeClobCredentials();
  if (!initialized) {
    return { address: "", balance: "0", positions: [] };
  }

  // 1) CLOB collateral balance (what Polymarket uses for trading)
  let clobBalance = "0";
  let clobRaw: unknown = null;
  try {
    const requestPath = "/balance-allowance";
    const headers = await createClobAuthHeaders("GET", requestPath);

    const response = await fetch(`${CLOB_API_URL}${requestPath}`, {
      method: "GET",
      headers,
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("[getWalletBalance] CLOB balance-allowance failed:", response.status, text);
    } else {
      const data = JSON.parse(text);
      clobRaw = data;
      clobBalance = String(
        data?.balance ?? data?.availableBalance ?? data?.available ?? data?.collateral ?? "0"
      );
    }
  } catch (error) {
    console.error("[getWalletBalance] CLOB balance-allowance error:", error);
  }

  // 2) Positions (public data-api; useful even if CLOB endpoint changes)
  let positions: unknown[] = [];
  try {
    const resp = await fetch(`https://data-api.polymarket.com/positions?user=${WALLET_ADDRESS}`, {
      headers: { Accept: "application/json" },
    });
    if (resp.ok) {
      const data = await resp.json();
      positions = Array.isArray(data) ? data : (data?.positions ?? []);
    }
  } catch (e) {
    console.error("[getWalletBalance] Positions fetch error:", e);
  }

  // 3) On-chain balances: show BOTH signing wallet and (if different) builder address
  let onchain: { usdc: string; matic: string } | undefined;
  let builderOnchain: { usdc: string; matic: string } | undefined;

  try {
    const provider = await tryRpcProvider();

    const normalizedBuilder = (BUILDER_ADDRESS || "").trim();
    const shouldCheckBuilder =
      normalizedBuilder && normalizedBuilder.toLowerCase() !== WALLET_ADDRESS.toLowerCase();

    // Sequential calls to avoid batching issues on some RPCs
    onchain = await fetchOnchainBalances(provider, WALLET_ADDRESS);
    builderOnchain = shouldCheckBuilder ? await fetchOnchainBalances(provider, normalizedBuilder) : undefined;
  } catch (e) {
    console.error("[getWalletBalance] On-chain balance fetch error:", e);
  }

  return {
    address: WALLET_ADDRESS,
    balance: clobBalance,
    positions,
    onchain,
    builder:
      (BUILDER_ADDRESS || "").trim() && (BUILDER_ADDRESS || "").trim().toLowerCase() !== WALLET_ADDRESS.toLowerCase()
        ? { address: (BUILDER_ADDRESS || "").trim(), onchain: builderOnchain }
        : undefined,
    clob: clobRaw ?? undefined,
  };
}

async function getOpenOrders(): Promise<unknown[]> {
  console.log("[getOpenOrders] Fetching open orders");
  
  const initialized = await initializeClobCredentials();
  if (!initialized) {
    return [];
  }

  try {
    const requestPath = "/orders";
    const headers = await createClobAuthHeaders("GET", requestPath);

    const response = await fetch(`${CLOB_API_URL}${requestPath}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error("[getOpenOrders] Failed:", response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("[getOpenOrders] Error:", error);
    return [];
  }
}

async function cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  console.log(`[cancelOrder] Cancelling order: ${orderId}`);
  
  const initialized = await initializeClobCredentials();
  if (!initialized) {
    return { success: false, message: "Failed to initialize credentials" };
  }

  try {
    const requestPath = `/order/${orderId}`;
    const headers = await createClobAuthHeaders("DELETE", requestPath);

    const response = await fetch(`${CLOB_API_URL}${requestPath}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      return { success: false, message: `Failed to cancel: ${response.status}` };
    }

    return { success: true, message: "Order cancelled successfully" };
  } catch (error) {
    console.error("[cancelOrder] Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function redeemWinnings(conditionId: string): Promise<{ success: boolean; message: string; txHash?: string }> {
  console.log(`[redeemWinnings] Redeeming for condition: ${conditionId}`);
  
  const initialized = await initializeClobCredentials();
  if (!initialized) {
    return { success: false, message: "Failed to initialize credentials" };
  }

  try {
    // Get market info to check if resolved
    const market = await getMarketDetails(conditionId);
    if (!market) {
      return { success: false, message: "Market not found" };
    }

    if (!market.closed) {
      return { success: false, message: "Market is not yet resolved. Cannot redeem." };
    }

    // Call redeem endpoint
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
    console.log(`[redeemWinnings] Response: ${response.status}`, responseText);

    if (!response.ok) {
      return { success: false, message: `Redeem failed: ${responseText}` };
    }

    const data = JSON.parse(responseText);
    return {
      success: true,
      message: "Winnings redeemed successfully!",
      txHash: data.transactionHash,
    };
  } catch (error) {
    console.error("[redeemWinnings] Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

function formatTradeResultForChat(result: OrderResult, side: string, tokenId: string, amount: number): string {
  if (result.status === "success") {
    return `✅ **${side} Order Placed**
Order ID: \`${result.orderId || "pending"}\`
Token: \`${tokenId.slice(0, 20)}...\`
Amount: ${amount} shares
Status: ${result.message}`;
  } else {
    return `❌ **Order Failed**
Error: ${result.message}`;
  }
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

  // If builder (proxy wallet) exists, show it as the primary wallet
  if (wallet.builder) {
    return `💰 **Wallet**
Address: \`${wallet.builder.address}\`
CLOB Balance: ${clobUsd}
On-chain USDC (Polygon): ${toUsd(wallet.builder.onchain?.usdc)}
Open Positions: ${wallet.positions.length}`;
  }

  // Fallback: show signer wallet directly
  return `💰 **Wallet**
Address: \`${wallet.address}\`
CLOB Balance: ${clobUsd}
On-chain USDC (Polygon): ${toUsd(wallet.onchain?.usdc)}
Open Positions: ${wallet.positions.length}`;
}

// =============================================================================
// Action: Format Market for Chat Response
// =============================================================================

function formatMarketForChat(market: MarketInfo): string {
  // Try to extract prices from various sources
  let priceInfo = "N/A";
  
  // Method 1: From outcomePrices (Gamma API format - JSON string)
  if (market.outcomePrices && market.outcomes) {
    try {
      const prices = JSON.parse(market.outcomePrices) as number[];
      const outcomes = JSON.parse(market.outcomes) as string[];
      priceInfo = outcomes.map((o, i) => `${o}: ${(prices[i] * 100).toFixed(1)}%`).join(", ");
    } catch (e) {
      console.log("Failed to parse outcomePrices:", e);
    }
  }
  
  // Method 2: From bestBid/bestAsk (Gamma API)
  if (priceInfo === "N/A" && (market.bestBid || market.bestAsk)) {
    const yesPrice = market.bestAsk ? (market.bestAsk * 100).toFixed(1) : "?";
    const noPrice = market.bestBid ? ((1 - market.bestBid) * 100).toFixed(1) : "?";
    priceInfo = `Yes: ${yesPrice}%, No: ${noPrice}%`;
  }
  
  // Method 3: From tokens array (CLOB API format)
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
      // Search/Discovery Actions
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
        formattedResponse = market 
          ? formatMarketForChat(market)
          : "Market not found";
        break;
      }

      // Order Book Actions
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

      // General Market Data
      case "getAllMarkets": {
        data = await getAllMarkets(params?.limit, params?.offset);
        break;
      }

      case "getPriceHistory": {
        data = await getPriceHistory(params?.tokenId, params?.interval);
        break;
      }

      // Trading Capability Check
      case "checkTradingCapability": {
        data = checkTradingCapability();
        break;
      }

      // ==================== TRADING ACTIONS ====================
      
      // Buy shares
      case "buy":
      case "PLACE_ORDER_BUY": {
        const capability = checkTradingCapability();
        if (!capability.canTrade) {
          data = { status: "error", message: capability.reason };
          formattedResponse = `❌ Trading disabled: ${capability.reason}`;
        } else {
          // Resolve marketSlug to tokenId if needed
          let tokenId = params?.tokenId;
          let marketTitle = "Unknown Market";
          
          if (!tokenId && params?.marketSlug) {
            const resolved = await resolveTokenId(params.marketSlug, params?.outcome || "YES");
            if (!resolved) {
              data = { status: "error", message: `Market not found: ${params.marketSlug}` };
              formattedResponse = `❌ **Market Not Found**\nCould not find market: "${params.marketSlug}"`;
              break;
            }
            tokenId = resolved.tokenId;
            marketTitle = resolved.marketTitle;
          }
          
          if (!tokenId) {
            data = { status: "error", message: "Missing tokenId or marketSlug" };
            formattedResponse = `❌ **Missing Parameter**\nPlease provide a market (e.g., /buy trump 0.1)`;
            break;
          }
          
          const result = await placeOrder({
            tokenId,
            amount: params?.amount || 1,
            price: params?.price,
            side: "BUY",
          });
          data = result;
          formattedResponse = formatTradeResultForChat(result, "BUY", marketTitle, params?.amount || 1);
        }
        break;
      }

      // Sell shares
      case "sell":
      case "PLACE_ORDER_SELL": {
        const capability = checkTradingCapability();
        if (!capability.canTrade) {
          data = { status: "error", message: capability.reason };
          formattedResponse = `❌ Trading disabled: ${capability.reason}`;
        } else {
          // Resolve marketSlug to tokenId if needed
          let tokenId = params?.tokenId;
          let marketTitle = "Unknown Market";
          
          if (!tokenId && params?.marketSlug) {
            const resolved = await resolveTokenId(params.marketSlug, params?.outcome || "YES");
            if (!resolved) {
              data = { status: "error", message: `Market not found: ${params.marketSlug}` };
              formattedResponse = `❌ **Market Not Found**\nCould not find market: "${params.marketSlug}"`;
              break;
            }
            tokenId = resolved.tokenId;
            marketTitle = resolved.marketTitle;
          }
          
          if (!tokenId) {
            data = { status: "error", message: "Missing tokenId or marketSlug" };
            formattedResponse = `❌ **Missing Parameter**\nPlease provide a market (e.g., /sell trump 1)`;
            break;
          }
          
          const result = await placeOrder({
            tokenId,
            amount: params?.amount || 1,
            price: params?.price,
            side: "SELL",
          });
          data = result;
          formattedResponse = formatTradeResultForChat(result, "SELL", marketTitle, params?.amount || 1);
        }
        break;
      }

      // Redeem winnings
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

      // Get wallet balance
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

      // Get open orders
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

      // Cancel order
      case "cancel":
      case "CANCEL_ORDER": {
        const capability = checkTradingCapability();
        if (!capability.canTrade) {
          data = { status: "error", message: capability.reason };
          formattedResponse = `❌ ${capability.reason}`;
        } else {
          const result = await cancelOrder(params?.orderId);
          data = result;
          formattedResponse = result.success 
            ? `✅ ${result.message}` 
            : `❌ ${result.message}`;
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        formattedResponse 
      }),
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
