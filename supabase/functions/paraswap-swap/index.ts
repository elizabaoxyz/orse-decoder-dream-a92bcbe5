import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PARASWAP_API = "https://api.paraswap.io";
const POLYGON_CHAIN_ID = 137;

// Native USDC on Polygon
const USDC_NATIVE = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
// USDC.e (bridged) on Polygon — used by Polymarket
const USDC_E = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, amount, userAddress, slippage, priceRoute } = body;

    if (!action || !userAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: action, userAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "quote") {
      // Get price quote from ParaSwap
      // USDC native has 6 decimals, USDC.e has 6 decimals
      const srcAmount = amount; // Already in smallest unit (wei/base units)

      const url = `${PARASWAP_API}/prices?srcToken=${USDC_NATIVE}&destToken=${USDC_E}&amount=${srcAmount}&srcDecimals=6&destDecimals=6&side=SELL&network=${POLYGON_CHAIN_ID}`;
      
      console.log("[ParaSwap] Fetching quote:", url);
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("[ParaSwap] Quote error:", data);
        return new Response(
          JSON.stringify({ error: data.error || "Failed to get quote" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[ParaSwap] Quote received:", JSON.stringify(data.priceRoute?.destAmount));

      return new Response(
        JSON.stringify({
          srcAmount: data.priceRoute?.srcAmount,
          destAmount: data.priceRoute?.destAmount,
          priceRoute: data.priceRoute,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "build") {
      // Build the swap transaction
      if (!priceRoute) {
        return new Response(
          JSON.stringify({ error: "Missing priceRoute for build" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const slippagePercent = slippage || 1; // 1% default

      const buildUrl = `${PARASWAP_API}/transactions/${POLYGON_CHAIN_ID}`;
      console.log("[ParaSwap] Building tx for user:", userAddress);

      const buildRes = await fetch(buildUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          srcToken: USDC_NATIVE,
          destToken: USDC_E,
          srcAmount: priceRoute.srcAmount,
          destAmount: priceRoute.destAmount,
          priceRoute: priceRoute,
          userAddress,
          txOrigin: userAddress,
          receiver: userAddress,
          slippage: slippagePercent * 100, // ParaSwap expects basis points
        }),
      });

      const txData = await buildRes.json();

      if (!buildRes.ok || txData.error) {
        console.error("[ParaSwap] Build error:", txData);
        return new Response(
          JSON.stringify({ error: txData.error || "Failed to build transaction" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[ParaSwap] Tx built, to:", txData.to, "value:", txData.value);

      return new Response(
        JSON.stringify({
          to: txData.to,
          data: txData.data,
          value: txData.value,
          gasPrice: txData.gasPrice,
          chainId: txData.chainId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[ParaSwap] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
