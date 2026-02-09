

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLOB_API_URL = "https://clob.polymarket.com";
const GAMMA_API_URL = "https://gamma-api.polymarket.com";

interface ClobMarketsParams {
  limit?: number;
  offset?: number;
  active?: boolean;
}

interface GammaMarketsParams {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  tag_slug?: string;
  _q?: string;
}

interface PriceHistoryParams {
  tokenId: string;
  interval?: string; // 1m, 5m, 15m, 1h, 4h, 1d
  fidelity?: number;
}

interface OrderBookParams {
  tokenId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
      case "getGammaMarkets":
        data = await getGammaMarkets(params as GammaMarketsParams);
        break;
      case "getNegRisk":
        data = await getNegRisk(params as { tokenId: string });
        break;
      case "getMarketInfo":
        data = await getMarketInfo(params as { tokenId: string });
        break;
      case "getFeeRate":
        data = await getFeeRate(params as { tokenId: string });
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("CLOB/Gamma API Error:", errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Upstream request failed (${response.status} ${response.statusText}) for ${url}${
        body ? `: ${body.slice(0, 500)}` : ""
      }`
    );
  }

  return await response.json();
}

async function getMarkets(params: ClobMarketsParams = {}) {
  const url = new URL(`${CLOB_API_URL}/markets`);

  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.offset) url.searchParams.set("offset", String(params.offset));
  if (params.active !== undefined)
    url.searchParams.set("active", String(params.active));

  return await fetchJson(url.toString());
}

async function getSimplifiedMarkets(params: ClobMarketsParams = {}) {
  const url = new URL(`${CLOB_API_URL}/simplified-markets`);

  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.offset) url.searchParams.set("offset", String(params.offset));

  return await fetchJson(url.toString());
}

async function getPriceHistory(params: PriceHistoryParams) {
  if (!params.tokenId) {
    throw new Error("tokenId is required");
  }

  const url = new URL(`${CLOB_API_URL}/prices-history`);
  url.searchParams.set("market", params.tokenId);
  if (params.interval) url.searchParams.set("interval", params.interval);
  if (params.fidelity) url.searchParams.set("fidelity", String(params.fidelity));

  return await fetchJson(url.toString());
}

async function getOrderBook(params: OrderBookParams) {
  if (!params.tokenId) {
    throw new Error("tokenId is required");
  }

  const url = new URL(`${CLOB_API_URL}/book`);
  url.searchParams.set("token_id", params.tokenId);

  return await fetchJson(url.toString());
}

async function getLastTradePrice(params: OrderBookParams) {
  if (!params.tokenId) {
    throw new Error("tokenId is required");
  }

  const url = new URL(`${CLOB_API_URL}/last-trade-price`);
  url.searchParams.set("token_id", params.tokenId);

  return await fetchJson(url.toString());
}

async function getGammaMarkets(params: GammaMarketsParams = {}) {
  const url = new URL(`${GAMMA_API_URL}/markets`);

  if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined)
    url.searchParams.set("offset", String(params.offset));

  if (params.active !== undefined)
    url.searchParams.set("active", String(params.active));
  if (params.closed !== undefined)
    url.searchParams.set("closed", String(params.closed));

  if (params.tag_slug) url.searchParams.set("tag_slug", params.tag_slug);
  if (params._q) url.searchParams.set("_q", params._q);

  return await fetchJson(url.toString());
}

async function getNegRisk(params: { tokenId: string }): Promise<{ neg_risk: boolean }> {
  if (!params.tokenId) throw new Error("tokenId is required");
  const url = `${GAMMA_API_URL}/markets?clob_token_ids=${params.tokenId}`;
  console.log("[getNegRisk] Querying Gamma:", url);
  const data = await fetchJson(url);
  const negRisk = Array.isArray(data) && data.length > 0 && data[0].neg_risk === true;
  console.log("[getNegRisk] tokenId:", params.tokenId, "neg_risk:", negRisk);
  return { neg_risk: negRisk };
}

async function getMarketInfo(params: { tokenId: string }): Promise<{ neg_risk: boolean; fee_rate_bps: number }> {
  if (!params.tokenId) throw new Error("tokenId is required");

  // Fetch from Gamma API (includes neg_risk and maker_base_fee)
  const gammaUrl = `${GAMMA_API_URL}/markets?clob_token_ids=${params.tokenId}`;
  console.log("[getMarketInfo] Querying Gamma:", gammaUrl);
  const gammaData = await fetchJson(gammaUrl);
  const market = Array.isArray(gammaData) && gammaData.length > 0 ? gammaData[0] : null;

  const negRisk = market?.neg_risk === true;

  // Also fetch from CLOB API for fee info
  let feeRateBps = 0;
  try {
    const clobUrl = `${CLOB_API_URL}/markets/${params.tokenId}`;
    console.log("[getMarketInfo] Querying CLOB:", clobUrl);
    const clobData = await fetchJson(clobUrl);
    // The CLOB market response may include maker_base_fee or fee_rate_bps
    feeRateBps = clobData?.maker_base_fee ?? clobData?.fee_rate_bps ?? 0;
    console.log("[getMarketInfo] CLOB fee data:", JSON.stringify({
      maker_base_fee: clobData?.maker_base_fee,
      fee_rate_bps: clobData?.fee_rate_bps,
      taker_base_fee: clobData?.taker_base_fee,
    }));
  } catch (e) {
    console.warn("[getMarketInfo] CLOB fee fetch failed:", e);
  }

  console.log("[getMarketInfo] Result: neg_risk=", negRisk, "fee_rate_bps=", feeRateBps);
  return { neg_risk: negRisk, fee_rate_bps: feeRateBps };
}

async function getFeeRate(params: { tokenId: string }): Promise<{ base_fee: number }> {
  if (!params.tokenId) throw new Error("tokenId is required");
  const url = `${CLOB_API_URL}/fee-rate?token_id=${params.tokenId}`;
  console.log("[getFeeRate] Querying CLOB:", url);
  const data = await fetchJson(url);
  console.log("[getFeeRate] Result:", JSON.stringify(data));
  return { base_fee: data?.base_fee ?? 0 };
}

