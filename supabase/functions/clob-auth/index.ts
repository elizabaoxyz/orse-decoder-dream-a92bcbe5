
const CLOB_URL = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, poly_address, poly_signature, poly_timestamp, poly_nonce, payload } = body;

    // Time action doesn't need auth
    if (action === "time") {
      const timeRes = await fetch(`${CLOB_URL}/time`);
      const timeText = await timeRes.text();
      console.log(`[clob-auth] /time: ${timeRes.status} ${timeText.slice(0, 100)}`);
      return new Response(timeText, {
        status: timeRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!action || !poly_address || !poly_signature || !poly_timestamp) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // L1 headers use underscores per Polymarket spec
    const l1Headers: Record<string, string> = {
      "Content-Type": "application/json",
      "POLY_ADDRESS": poly_address,
      "POLY_SIGNATURE": poly_signature,
      "POLY_TIMESTAMP": poly_timestamp,
      "POLY_NONCE": String(poly_nonce ?? "0"),
    };

    let clobPath: string;
    let method: string;
    let fetchBody: string | undefined;

    switch (action) {
      case "create":
        clobPath = "/auth/api-key";
        method = "POST";
        fetchBody = JSON.stringify(payload ?? {});
        break;
      case "derive":
        clobPath = "/auth/derive-api-key";
        method = "GET";
        break;
      case "delete":
        clobPath = "/auth/api-key";
        method = "DELETE";
        fetchBody = payload ? JSON.stringify(payload) : undefined;
        break;
      // time is handled before validation
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const clobUrl = `${CLOB_URL}${clobPath}`;
    console.log(`[clob-auth] ${method} ${clobUrl} addr=${poly_address.slice(0, 10)}…`);

    const fetchOpts: RequestInit = { method, headers: l1Headers };
    if (fetchBody && method !== "GET") {
      fetchOpts.body = fetchBody;
    }

    const resp = await fetch(clobUrl, fetchOpts);
    const text = await resp.text();
    console.log(`[clob-auth] Response: ${resp.status} ${text.slice(0, 200)}`);

    return new Response(text, {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[clob-auth] Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
