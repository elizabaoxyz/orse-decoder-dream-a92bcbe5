// Hit CLOB directly — edge functions bypass Cloudflare
const CLOB_URL = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// ---------- SDK-exact HMAC helpers (copied from @polymarket/clob-client/dist/signing/hmac.js) ----------

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const sanitizedBase64 = base64
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/[^A-Za-z0-9+/=]/g, "");
  const binaryString = atob(sanitizedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function buildPolyHmacSignature(
  secret: string,
  timestamp: number,
  method: string,
  requestPath: string,
  body?: string
): Promise<string> {
  let message = timestamp + method + requestPath;
  if (body !== undefined) {
    message += body;
  }
  const keyData = base64ToArrayBuffer(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const messageBuffer = new TextEncoder().encode(message);
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageBuffer);
  const sig = arrayBufferToBase64(signatureBuffer);
  // URL-safe base64, keep "=" padding
  return sig.replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Proxies order submission directly to clob.polymarket.com.
 * Uses SDK-exact HMAC implementation for signature generation.
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

    // Use CLOB server time to avoid clock skew
    let timestamp: number;
    try {
      const timeRes = await fetch(`${CLOB_URL}/time`);
      const timeText = await timeRes.text();
      timestamp = Math.floor(Number(timeText.trim()));
    } catch {
      timestamp = Math.floor(Date.now() / 1000);
    }

    // SDK-exact HMAC: buildPolyHmacSignature(secret, ts, method, requestPath, body)
    const method = "POST";
    const requestPath = "/order";
    const hmacSig = await buildPolyHmacSignature(creds.secret, timestamp, method, requestPath, bodyStr);

    // SDK uses checksummed address from signer.getAddress() — pass through as-is
    const polyAddress = signerAddress;

    // Build headers — match SDK's createL2Headers exactly
    const upstreamHeaders: Record<string, string> = {
      POLY_ADDRESS: polyAddress,
      POLY_SIGNATURE: hmacSig,
      POLY_TIMESTAMP: `${timestamp}`,
      POLY_API_KEY: creds.apiKey,
      POLY_PASSPHRASE: creds.passphrase,
    };

    // Diagnostic logging
    console.log("[clob-order] Forwarding to:", `${CLOB_URL}/order`);
    console.log("[clob-order] POLY_ADDRESS:", polyAddress);
    console.log("[clob-order] POLY_TIMESTAMP:", timestamp);
    console.log("[clob-order] HMAC msg preview:", `${timestamp}POST/order${bodyStr.slice(0, 40)}...`);
    console.log("[clob-order] Body length:", bodyStr.length);

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
