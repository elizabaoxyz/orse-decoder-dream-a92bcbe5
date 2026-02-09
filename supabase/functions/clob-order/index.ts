
// Hit CLOB directly — edge functions bypass Cloudflare (like clob-auth and clob-balance)
const CLOB_URL = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Proxies order submission directly to clob.polymarket.com.
 * Builder headers are EXCLUDED — the official SDK skips them if invalid,
 * and sending invalid builder auth causes "invalid signature" rejection.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { bodyStr, polyHeaders } = body;

    if (!bodyStr || !polyHeaders) {
      return new Response(
        JSON.stringify({ error: "Missing bodyStr or polyHeaders" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build headers for upstream CLOB request — user auth only, NO builder headers
    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    // Forward only POLY_* headers (user auth) — skip Content-Type/Accept duplicates
    for (const [key, value] of Object.entries(polyHeaders)) {
      if (typeof value === "string" && key.startsWith("POLY_")) {
        upstreamHeaders[key] = value;
      }
    }

    // Diagnostic logging
    const headerNames = Object.keys(upstreamHeaders);
    console.log("[clob-order] Forwarding to:", `${CLOB_URL}/order`);
    console.log("[clob-order] Headers:", headerNames.join(", "));
    console.log("[clob-order] Body (first 300):", bodyStr.slice(0, 300));
    console.log("[clob-order] POLY_ADDRESS:", upstreamHeaders["POLY_ADDRESS"]?.slice(0, 12) + "...");
    console.log("[clob-order] POLY_PROXY_ADDRESS:", upstreamHeaders["POLY_PROXY_ADDRESS"] || "(not set)");

    const resp = await fetch(`${CLOB_URL}/order`, {
      method: "POST",
      headers: upstreamHeaders,
      body: bodyStr,
    });

    const text = await resp.text();
    console.log("[clob-order] Response:", resp.status, text.slice(0, 500));

    return new Response(text, {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[clob-order] Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
