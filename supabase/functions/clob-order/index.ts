
// Hit CLOB directly — edge functions bypass Cloudflare
const CLOB_URL = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// ---------- HMAC-SHA256 helper (matches clob-balance exactly) ----------
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

/**
 * Proxies order submission directly to clob.polymarket.com.
 * HMAC computed server-side with CLOB server time to match clob-balance pattern.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { bodyStr, creds, signerAddress, makerAddress } = body;

    if (!bodyStr || !creds || !signerAddress) {
      return new Response(
        JSON.stringify({ error: "Missing bodyStr, creds, or signerAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use CLOB server time to avoid clock skew (same as clob-balance)
    let timestamp: string;
    try {
      const timeRes = await fetch(`${CLOB_URL}/time`);
      const timeText = await timeRes.text();
      timestamp = String(Math.floor(Number(timeText.trim())));
    } catch {
      timestamp = Math.floor(Date.now() / 1000).toString();
    }

    // Compute HMAC: timestamp + method + path + body
    const method = "POST";
    const requestPath = "/order";
    const hmacMessage = timestamp + method + requestPath + bodyStr;
    const hmacSig = await hmacSign(creds.secret, hmacMessage);

    // Lowercase address — matches clob-balance pattern
    const lowerAddress = signerAddress.toLowerCase();

    // Build headers for upstream CLOB request
    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      POLY_ADDRESS: lowerAddress,
      POLY_SIGNATURE: hmacSig,
      POLY_TIMESTAMP: timestamp,
      POLY_API_KEY: creds.apiKey,
      POLY_PASSPHRASE: creds.passphrase,
    };

    // Add proxy address for Safe-based orders (maker ≠ signer)
    if (makerAddress && makerAddress.toLowerCase() !== lowerAddress) {
      upstreamHeaders["POLY_PROXY_ADDRESS"] = makerAddress;
    }

    // Diagnostic logging
    console.log("[clob-order] Forwarding to:", `${CLOB_URL}/order`);
    console.log("[clob-order] Headers:", Object.keys(upstreamHeaders).join(", "));
    console.log("[clob-order] POLY_ADDRESS:", lowerAddress);
    console.log("[clob-order] POLY_PROXY_ADDRESS:", upstreamHeaders["POLY_PROXY_ADDRESS"] || "(not set)");
    console.log("[clob-order] POLY_TIMESTAMP:", timestamp);
    console.log("[clob-order] HMAC msg:", JSON.stringify(hmacMessage.slice(0, 80) + "..."));
    console.log("[clob-order] Full body:", bodyStr);

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
