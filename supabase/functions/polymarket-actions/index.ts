import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLOB_API_URL = "https://clob.polymarket.com";
const GAMMA_API_URL = "https://gamma-api.polymarket.com";
const CHAIN_ID = 137; // Polygon Mainnet

// Builder credentials from environment
const BUILDER_ADDRESS = Deno.env.get("POLYMARKET_BUILDER_ADDRESS") || "";
const BUILDER_API_KEY = Deno.env.get("POLYMARKET_BUILDER_API_KEY") || "";
const BUILDER_SECRET = Deno.env.get("POLYMARKET_BUILDER_SECRET") || "";
const BUILDER_PASSPHRASE = Deno.env.get("POLYMARKET_BUILDER_PASSPHRASE") || "";

// CLOB Trading credentials (optional - for trading)
const WALLET_PRIVATE_KEY = Deno.env.get("WALLET_PRIVATE_KEY") || "";

// =============================================================================
// Types (matching plugin-polymarket structure)
// =============================================================================

interface MarketInfo {
  id: string;
  condition_id: string;
  question: string;
  description?: string;
  market_slug?: string;
  end_date_iso?: string;
  game_start_time?: string;
  seconds_delay?: number;
  minimum_tick_size?: string;
  tokens: TokenInfo[];
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  accepting_orders?: boolean;
  enable_order_book?: boolean;
  liquidity?: string;
  volume?: string;
  volume24hr?: string;
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
  if (!WALLET_PRIVATE_KEY) {
    return {
      canTrade: false,
      reason: "WALLET_PRIVATE_KEY not configured. Trading is disabled."
    };
  }
  
  return { canTrade: true };
}

// =============================================================================
// Action: Format Market for Chat Response
// =============================================================================

function formatMarketForChat(market: MarketInfo): string {
  const tokens = market.tokens || [];
  const priceInfo = tokens.map(t => `${t.outcome}: ${(t.price || 0) * 100}%`).join(", ");
  
  return `📊 **${market.question}**
ID: \`${market.condition_id || market.id}\`
Prices: ${priceInfo || "N/A"}
Volume 24h: $${parseFloat(market.volume24hr || "0").toLocaleString()}
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
