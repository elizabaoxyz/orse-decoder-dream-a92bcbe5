

const CLOB_URL = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-poly-address, x-poly-api-key, x-poly-signature, x-poly-timestamp, x-poly-passphrase",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
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

    // Read asset_type from query params or POST body
    let assetType = "0";
    const url = new URL(req.url);
    if (url.searchParams.has("asset_type")) {
      assetType = url.searchParams.get("asset_type")!;
    } else if (req.method === "POST") {
      try {
        const body = await req.json();
        assetType = body.asset_type ?? "0";
      } catch { /* empty body is fine */ }
    }

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
