
const CLOB_URL = "https://clob.polymarket.com";
// Polygon USDC.e (PoS bridged) — the collateral token for Polymarket
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// HMAC-SHA256 signing
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
    const body = await req.json();
    const {
      apiKey,
      secret,
      passphrase,
      address,
      asset_type,
    } = body;

    if (!apiKey || !secret || !passphrase || !address) {
      return new Response(
        JSON.stringify({ error: "Missing credentials (apiKey, secret, passphrase, address)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // asset_type: if it's already a hex address use it, otherwise default to USDC
    const assetAddress = (typeof asset_type === "string" && asset_type.startsWith("0x"))
      ? asset_type
      : USDC_ADDRESS;

    const signingPath = "/balance-allowance";
    const queryString = `?asset_type=${assetAddress}`;
    const clobUrl = `${CLOB_URL}${signingPath}${queryString}`;

    // Use CLOB server time to avoid clock skew
    let timestamp: string;
    try {
      const timeRes = await fetch(`${CLOB_URL}/time`);
      const timeText = await timeRes.text();
      timestamp = String(Math.floor(Number(timeText.trim())));
    } catch {
      timestamp = Math.floor(Date.now() / 1000).toString();
    }

    // HMAC signs over just the path (no query string)
    const message = timestamp + "GET" + signingPath;
    const signature = await hmacSign(secret, message);
    const lowerAddress = address.toLowerCase();

    console.log("[clob-balance] Fetching:", clobUrl);
    console.log("[clob-balance] addr:", lowerAddress, "key:", apiKey.slice(0, 8), "asset:", assetAddress);
    console.log("[clob-balance] HMAC msg:", JSON.stringify(message));
    console.log("[clob-balance] sig:", signature.slice(0, 16), "ts:", timestamp);

    const resp = await fetch(clobUrl, {
      method: "GET",
      headers: {
        POLY_ADDRESS: lowerAddress,
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
