import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLOB_API_URL = "https://clob.polymarket.com";

interface ClobMarketsParams {
  limit?: number;
  offset?: number;
  active?: boolean;
}

interface PriceHistoryParams {
  tokenId: string;
  interval?: string; // 1m, 5m, 15m, 1h, 4h, 1d
  fidelity?: number;
}

interface OrderBookParams {
  tokenId: string;
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
      case "getMarkets":
        data = await getMarkets(params as ClobMarketsParams);
        break;
      case "getSimplifiedMarkets":
        data = await getSimplifiedMarkets(params as ClobMarketsParams);
        break;
      case "getPriceHistory":
        data = await getPriceHistory(params as PriceHistoryParams);
        break;
      case "getOrderBook":
        data = await getOrderBook(params as OrderBookParams);
        break;
      case "getLastTradePrice":
        data = await getLastTradePrice(params as OrderBookParams);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("CLOB API Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getMarkets(params: ClobMarketsParams = {}) {
  const url = new URL(`${CLOB_API_URL}/markets`);
  
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.offset) url.searchParams.set("offset", String(params.offset));
  if (params.active !== undefined) url.searchParams.set("active", String(params.active));

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch markets: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function getSimplifiedMarkets(params: ClobMarketsParams = {}) {
  const url = new URL(`${CLOB_API_URL}/simplified-markets`);
  
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.offset) url.searchParams.set("offset", String(params.offset));

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch simplified markets: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function getPriceHistory(params: PriceHistoryParams) {
  if (!params.tokenId) {
    throw new Error("tokenId is required");
  }

  const url = new URL(`${CLOB_API_URL}/prices-history`);
  url.searchParams.set("market", params.tokenId);
  if (params.interval) url.searchParams.set("interval", params.interval);
  if (params.fidelity) url.searchParams.set("fidelity", String(params.fidelity));

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch price history: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function getOrderBook(params: OrderBookParams) {
  if (!params.tokenId) {
    throw new Error("tokenId is required");
  }

  const url = new URL(`${CLOB_API_URL}/book`);
  url.searchParams.set("token_id", params.tokenId);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order book: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function getLastTradePrice(params: OrderBookParams) {
  if (!params.tokenId) {
    throw new Error("tokenId is required");
  }

  const url = new URL(`${CLOB_API_URL}/last-trade-price`);
  url.searchParams.set("token_id", params.tokenId);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch last trade price: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
