
// Hit CLOB directly — edge functions bypass Cloudflare
const CLOB_URL = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// ---------- HMAC-SHA256 helper (server-side, Deno crypto) ----------
async function buildHmacSignature(
  secret: string,
  timestamp: number,
  method: string,
  requestPath: string,
  body: string
): Promise<string> {
  const message = `${timestamp}${method}${requestPath}${body}`;

  // Decode base64url secret
  let normalized = secret.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4 !== 0) normalized += "=";
  const binary = atob(normalized);
  const keyBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) keyBytes[i] = binary.charCodeAt(i);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  // Convert to URL-safe base64 (preserve padding)
  const arr = new Uint8Array(sig);
  let b64 = "";
  for (let i = 0; i < arr.length; i++) b64 += String.fromCharCode(arr[i]);
  b64 = btoa(b64);
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Proxies order submission directly to clob.polymarket.com.
 * HMAC is computed server-side to avoid browser crypto inconsistencies.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { bodyStr, creds, signerAddress } = body;

    if (!bodyStr || !creds || !signerAddress) {
      return new Response(
        JSON.stringify({ error: "Missing bodyStr, creds, or signerAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute HMAC server-side
    const ts = Math.floor(Date.now() / 1000);
    const method = "POST";
    const requestPath = "/order";
    const hmacSig = await buildHmacSignature(creds.secret, ts, method, requestPath, bodyStr);

    // Build headers for upstream CLOB request
    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      POLY_ADDRESS: signerAddress,
      POLY_SIGNATURE: hmacSig,
      POLY_TIMESTAMP: String(ts),
      POLY_API_KEY: creds.apiKey,
      POLY_PASSPHRASE: creds.passphrase,
    };

    // Diagnostic logging
    console.log("[clob-order] Forwarding to:", `${CLOB_URL}/order`);
    console.log("[clob-order] Headers:", Object.keys(upstreamHeaders).join(", "));
    console.log("[clob-order] POLY_ADDRESS:", signerAddress);
    console.log("[clob-order] POLY_TIMESTAMP:", ts);
    console.log("[clob-order] HMAC msg preview:", `${ts}${method}${requestPath}${bodyStr.slice(0, 40)}...`);
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
