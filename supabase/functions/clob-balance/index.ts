
const CLOB_URL = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// HMAC-SHA256 signing (same logic as client but server-side for reliability)
async function hmacSign(secret: string, message: string): Promise<string> {
  const normalized = secret.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  let keyData: Uint8Array;
  try {
    const binary = atob(padded);
    keyData = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    keyData = new TextEncoder().encode(secret);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Accept credentials in request body (no custom headers needed)
    const body = await req.json();
    const {
      apiKey,
      secret,
      passphrase,
      address,
      asset_type = "0",
    } = body;

    if (!apiKey || !secret || !passphrase || !address) {
      return new Response(
        JSON.stringify({ error: "Missing credentials (apiKey, secret, passphrase, address)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // HMAC signs over just the path (no query string), per official SDK
    const signingPath = "/balance-allowance";
    const clobUrl = `${CLOB_URL}/balance-allowance`;

    // Use CLOB server time to avoid clock skew
    let timestamp: string;
    try {
      const timeRes = await fetch(`${CLOB_URL}/time`);
      const timeText = await timeRes.text();
      timestamp = String(Math.floor(Number(timeText.trim())));
    } catch {
      timestamp = Math.floor(Date.now() / 1000).toString();
    }

    const message = timestamp + "GET" + signingPath;
    const signature = await hmacSign(secret, message);

    console.log("[clob-balance] Fetching:", clobUrl);
    console.log("[clob-balance] addr:", address, "key:", apiKey.slice(0, 8));
    console.log("[clob-balance] HMAC msg:", JSON.stringify(message));
    console.log("[clob-balance] sig:", signature.slice(0, 16), "ts:", timestamp);

    const resp = await fetch(clobUrl, {
      method: "GET",
      headers: {
        POLY_ADDRESS: address,
        POLY_API_KEY: apiKey,
        POLY_SIGNATURE: signature,
        POLY_TIMESTAMP: timestamp,
        POLY_PASSPHRASE: passphrase,
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
