import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLOB_API_URL = "https://clob.polymarket.com";
const CHAIN_ID = 137; // Polygon Mainnet

// Builder credentials from environment
const BUILDER_ADDRESS = Deno.env.get("POLYMARKET_BUILDER_ADDRESS") || "";
const BUILDER_API_KEY = Deno.env.get("POLYMARKET_BUILDER_API_KEY") || "";
const BUILDER_SECRET = Deno.env.get("POLYMARKET_BUILDER_SECRET") || "";
const BUILDER_PASSPHRASE = Deno.env.get("POLYMARKET_BUILDER_PASSPHRASE") || "";

// Types
interface TradeParams {
  id?: string;
  maker_address?: string;
  market?: string;
  asset_id?: string;
  before?: string;
  after?: string;
  limit?: number;
}

interface BuilderTrade {
  id: string;
  tradeType: string;
  takerOrderHash: string;
  builder: string;
  market: string;
  assetId: string;
  side: string;
  size: string;
  sizeUsdc: string;
  price: string;
  status: string;
  outcome: string;
  outcomeIndex: number;
  owner: string;
  maker: string;
  transactionHash: string;
  matchTime: string;
  bucketIndex: number;
  fee: string;
  feeUsdc: string;
  err_msg?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface BuilderTradesPaginatedResponse {
  trades: BuilderTrade[];
  next_cursor: string;
  limit: number;
  count: number;
}

interface BuilderStats {
  totalTrades: number;
  totalVolumeUsdc: string;
  totalFeesUsdc: string;
  uniqueMarkets: number;
  uniqueUsers: number;
}

// Generate HMAC-SHA256 signature for L2 authentication
async function generateL2Signature(
  secret: string,
  timestamp: string,
  method: string,
  requestPath: string,
  body: string = ""
): Promise<string> {
  const message = timestamp + method + requestPath + body;
  const encoder = new TextEncoder();
  
  // Try to decode as base64, if it fails use the secret as-is
  let keyData: Uint8Array;
  try {
    const decoded = base64Decode(secret);
    keyData = new Uint8Array(decoded);
  } catch {
    // If not base64, use the raw secret string
    keyData = encoder.encode(secret);
  }
  
  // Create a new ArrayBuffer and copy data
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

// Create L2 auth headers for Builder API
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

// Get builder trades with attribution
async function getBuilderTrades(params: TradeParams = {}): Promise<BuilderTradesPaginatedResponse> {
  // Check if we have all required credentials
  if (!BUILDER_ADDRESS || !BUILDER_API_KEY || !BUILDER_SECRET || !BUILDER_PASSPHRASE) {
    console.log("Builder credentials not fully configured, returning empty trades");
    return {
      trades: [],
      next_cursor: "",
      limit: params.limit || 100,
      count: 0
    };
  }

  const url = new URL(`${CLOB_API_URL}/builder/trades`);
  
  if (params.id) url.searchParams.set("id", params.id);
  if (params.maker_address) url.searchParams.set("maker_address", params.maker_address);
  if (params.market) url.searchParams.set("market", params.market);
  if (params.asset_id) url.searchParams.set("asset_id", params.asset_id);
  if (params.before) url.searchParams.set("before", params.before);
  if (params.after) url.searchParams.set("after", params.after);
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const requestPath = url.pathname + url.search;
  const headers = await createBuilderAuthHeaders("GET", requestPath);

  console.log("Fetching builder trades from:", url.toString());
  console.log("Using address:", BUILDER_ADDRESS.slice(0, 10) + "...");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Builder trades error:", response.status, errorText);
    // Return empty result instead of throwing for auth errors
    if (response.status === 401) {
      console.log("Auth failed - credentials may be invalid or not yet approved by Polymarket");
      return {
        trades: [],
        next_cursor: "",
        limit: params.limit || 100,
        count: 0
      };
    }
    throw new Error(`Failed to fetch builder trades: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Get builder statistics (aggregated from trades)
async function getBuilderStats(): Promise<BuilderStats> {
  const allTrades: BuilderTrade[] = [];
  let cursor: string | undefined;
  
  // Fetch all trades (paginated)
  do {
    const params: TradeParams = { limit: 100 };
    if (cursor) params.after = cursor;
    
    const response = await getBuilderTrades(params);
    allTrades.push(...response.trades);
    cursor = response.next_cursor || undefined;
  } while (cursor);

  // Calculate stats
  const uniqueMarkets = new Set(allTrades.map(t => t.market));
  const uniqueUsers = new Set(allTrades.map(t => t.owner));
  
  let totalVolumeUsdc = 0;
  let totalFeesUsdc = 0;
  
  for (const trade of allTrades) {
    totalVolumeUsdc += parseFloat(trade.sizeUsdc || "0");
    totalFeesUsdc += parseFloat(trade.feeUsdc || "0");
  }

  return {
    totalTrades: allTrades.length,
    totalVolumeUsdc: totalVolumeUsdc.toFixed(2),
    totalFeesUsdc: totalFeesUsdc.toFixed(2),
    uniqueMarkets: uniqueMarkets.size,
    uniqueUsers: uniqueUsers.size,
  };
}

// Revoke current builder API key
async function revokeBuilderApiKey(): Promise<{ success: boolean }> {
  const requestPath = "/builder/api-key";
  const headers = await createBuilderAuthHeaders("DELETE", requestPath);

  const response = await fetch(`${CLOB_API_URL}${requestPath}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to revoke builder API key: ${response.status} - ${errorText}`);
  }

  return { success: true };
}

// Get markets - use Gamma API for better filtering of active markets
async function getMarketsWithBuilder(limit = 100, offset = 0): Promise<unknown> {
  // Use Gamma API for better market discovery
  const GAMMA_API_URL = "https://gamma-api.polymarket.com";
  const url = new URL(`${GAMMA_API_URL}/markets`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("order", "volume24hr"); // Sort by volume for popular markets
  url.searchParams.set("ascending", "false"); // Most active first

  console.log("Fetching markets from Gamma API:", url.toString());

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Markets fetch error:", response.status, errorText);
    // Fall back to CLOB API if Gamma fails
    console.log("Falling back to CLOB API...");
    return await getMarketsFromClob(limit, offset);
  }

  const data = await response.json();
  console.log("Fetched markets from Gamma:", Array.isArray(data) ? data.length : 'object response');
  return data;
}

// Fallback to CLOB API for markets
async function getMarketsFromClob(limit = 100, offset = 0): Promise<unknown> {
  const url = new URL(`${CLOB_API_URL}/markets`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch markets: ${response.statusText}`);
  }

  return await response.json();
}

// Get order book for a specific token
async function getOrderBook(tokenId: string): Promise<unknown> {
  const url = new URL(`${CLOB_API_URL}/book`);
  url.searchParams.set("token_id", tokenId);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order book: ${response.statusText}`);
  }

  return await response.json();
}

// Get price history for a token
async function getPriceHistory(tokenId: string, interval = "1d"): Promise<unknown> {
  const url = new URL(`${CLOB_API_URL}/prices-history`);
  url.searchParams.set("market", tokenId);
  url.searchParams.set("interval", interval);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch price history: ${response.statusText}`);
  }

  return await response.json();
}

// Get last trade price for a token
async function getLastTradePrice(tokenId: string): Promise<unknown> {
  const url = new URL(`${CLOB_API_URL}/last-trade-price`);
  url.searchParams.set("token_id", tokenId);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch last trade price: ${response.statusText}`);
  }

  return await response.json();
}

// Get tick size for a token
async function getTickSize(tokenId: string): Promise<unknown> {
  const url = new URL(`${CLOB_API_URL}/tick-size`);
  url.searchParams.set("token_id", tokenId);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tick size: ${response.statusText}`);
  }

  return await response.json();
}

// Get neg risk status
async function getNegRisk(tokenId: string): Promise<unknown> {
  const url = new URL(`${CLOB_API_URL}/neg-risk`);
  url.searchParams.set("token_id", tokenId);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch neg risk: ${response.statusText}`);
  }

  return await response.json();
}

// Health check for builder API connection
async function healthCheck(): Promise<{
  connected: boolean;
  builderApiConfigured: boolean;
  chainId: number;
  endpoint: string;
}> {
  const builderApiConfigured = !!(BUILDER_ADDRESS && BUILDER_API_KEY && BUILDER_SECRET && BUILDER_PASSPHRASE);
  
  let connected = false;
  try {
    const response = await fetch(`${CLOB_API_URL}/time`, {
      headers: { "Accept": "application/json" },
    });
    connected = response.ok;
  } catch {
    connected = false;
  }

  return {
    connected,
    builderApiConfigured,
    chainId: CHAIN_ID,
    endpoint: CLOB_API_URL,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();

    let data;

    switch (action) {
      // Builder-specific methods
      case "getBuilderTrades":
        data = await getBuilderTrades(params);
        break;
      case "getBuilderStats":
        data = await getBuilderStats();
        break;
      case "revokeBuilderApiKey":
        data = await revokeBuilderApiKey();
        break;
      case "healthCheck":
        data = await healthCheck();
        break;

      // Market data methods
      case "getMarkets":
        data = await getMarketsWithBuilder(params?.limit, params?.offset);
        break;
      case "getOrderBook":
        data = await getOrderBook(params.tokenId);
        break;
      case "getPriceHistory":
        data = await getPriceHistory(params.tokenId, params.interval);
        break;
      case "getLastTradePrice":
        data = await getLastTradePrice(params.tokenId);
        break;
      case "getTickSize":
        data = await getTickSize(params.tokenId);
        break;
      case "getNegRisk":
        data = await getNegRisk(params.tokenId);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Builder API Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
