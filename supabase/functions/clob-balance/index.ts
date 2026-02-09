import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CLOB_URL = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, x-poly-address, x-poly-api-key, x-poly-signature, x-poly-timestamp, x-poly-passphrase",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Extract POLY headers from custom x-poly-* headers (browser-safe)
    const polyAddress = req.headers.get("x-poly-address") || "";
    const polyApiKey = req.headers.get("x-poly-api-key") || "";
    const polySignature = req.headers.get("x-poly-signature") || "";
    const polyTimestamp = req.headers.get("x-poly-timestamp") || "";
    const polyPassphrase = req.headers.get("x-poly-passphrase") || "";

    const url = new URL(req.url);
    const assetType = url.searchParams.get("asset_type") ?? "0";

    const clobPath = `/balance-allowance?asset_type=${assetType}`;
    const clobUrl = `${CLOB_URL}${clobPath}`;

    console.log("[clob-balance] Fetching:", clobUrl, "POLY-ADDRESS:", polyAddress, "API-KEY:", polyApiKey.slice(0, 8));

    const resp = await fetch(clobUrl, {
      method: "GET",
      headers: {
        "POLY-ADDRESS": polyAddress,
        "POLY-API-KEY": polyApiKey,
        "POLY-SIGNATURE": polySignature,
        "POLY-TIMESTAMP": polyTimestamp,
        "POLY-PASSPHRASE": polyPassphrase,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    const text = await resp.text();
    console.log("[clob-balance] Response:", resp.status, text);

    return new Response(text, {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[clob-balance] Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
