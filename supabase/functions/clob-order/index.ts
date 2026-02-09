
// Hit CLOB directly — edge functions bypass Cloudflare
const CLOB_URL = "https://clob.polymarket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// ---------- SDK-exact HMAC helpers ----------

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
  return sig.replace(/\+/g, "-").replace(/\//g, "_");
}

// ---------- EIP-712 hash verification (server-side) ----------

function keccak256(data: Uint8Array): Uint8Array {
  // Use SubtleCrypto for SHA-256 as fallback — but we need keccak256
  // Since Deno doesn't have native keccak256, we'll use a minimal implementation
  // Actually, let's import from npm
  throw new Error("Not implemented inline");
}

// For server-side EIP-712 hash verification, we'll use viem
async function verifyOrderSignature(
  orderData: Record<string, unknown>,
  signature: string,
  expectedSigner: string,
  clientHash: string
): Promise<{ match: boolean; serverHash: string; recoveredAddress: string; details: string }> {
  try {
    // Dynamic import viem for hash computation
    const { hashTypedData, recoverTypedDataAddress } = await import("npm:viem@2.45.1");

    const CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E";
    const NEG_RISK_CTF_EXCHANGE = "0xC5d563A36AE78145C45a50134d48A1215220f80a";

    // Determine contract from order
    // The order's signatureType and other fields are in the JSON
    const salt = BigInt(orderData.salt as string | number);
    const tokenId = BigInt(orderData.tokenId as string);
    const makerAmount = BigInt(orderData.makerAmount as string);
    const takerAmount = BigInt(orderData.takerAmount as string);
    const expiration = BigInt(orderData.expiration as string || "0");
    const nonce = BigInt(orderData.nonce as string || "0");
    const feeRateBps = BigInt(orderData.feeRateBps as string || "0");
    const side = (orderData.side === "BUY" || orderData.side === 0) ? 0 : 1;
    const signatureType = Number(orderData.signatureType);

    // Try both exchange addresses
    const exchanges = [CTF_EXCHANGE, NEG_RISK_CTF_EXCHANGE];
    
    for (const exchangeAddr of exchanges) {
      const domain = {
        name: "Polymarket CTF Exchange" as const,
        version: "1" as const,
        chainId: 137,
        verifyingContract: exchangeAddr as `0x${string}`,
      };

      const types = {
        Order: [
          { name: "salt", type: "uint256" },
          { name: "maker", type: "address" },
          { name: "signer", type: "address" },
          { name: "taker", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "makerAmount", type: "uint256" },
          { name: "takerAmount", type: "uint256" },
          { name: "expiration", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "feeRateBps", type: "uint256" },
          { name: "side", type: "uint8" },
          { name: "signatureType", type: "uint8" },
        ],
      } as const;

      const message = {
        salt,
        maker: (orderData.maker as string) as `0x${string}`,
        signer: (orderData.signer as string) as `0x${string}`,
        taker: (orderData.taker as string) as `0x${string}`,
        tokenId,
        makerAmount,
        takerAmount,
        expiration,
        nonce,
        feeRateBps,
        side,
        signatureType,
      };

      const serverHash = hashTypedData({
        domain,
        types,
        primaryType: "Order",
        message,
      });

      if (serverHash === clientHash || exchangeAddr === CTF_EXCHANGE) {
        // Try to recover the address
        try {
          const recovered = await recoverTypedDataAddress({
            domain,
            types,
            primaryType: "Order",
            message,
            signature: signature as `0x${string}`,
          });

          return {
            match: recovered.toLowerCase() === expectedSigner.toLowerCase(),
            serverHash,
            recoveredAddress: recovered,
            details: `exchange=${exchangeAddr} hashMatch=${serverHash === clientHash}`,
          };
        } catch (e) {
          return {
            match: false,
            serverHash,
            recoveredAddress: `ecrecover failed: ${e}`,
            details: `exchange=${exchangeAddr} hashMatch=${serverHash === clientHash}`,
          };
        }
      }
    }

    return {
      match: false,
      serverHash: "none",
      recoveredAddress: "none",
      details: "no exchange matched",
    };
  } catch (e) {
    return {
      match: false,
      serverHash: "error",
      recoveredAddress: "error",
      details: `verification error: ${e}`,
    };
  }
}

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

    // Parse order for server-side verification
    const parsedBody = JSON.parse(bodyStr);
    const orderData = parsedBody.order;
    const clientHash = parsedBody._debug?.orderHash || "none";

    // Server-side signature verification
    const verification = await verifyOrderSignature(
      orderData,
      orderData.signature,
      signerAddress,
      clientHash
    );

    console.log("[clob-order] SERVER-SIDE VERIFY:", JSON.stringify({
      clientHash: clientHash.slice(0, 18),
      serverHash: verification.serverHash.slice(0, 18),
      hashMatch: clientHash === verification.serverHash,
      sigMatch: verification.match,
      recovered: verification.recoveredAddress,
      expected: signerAddress,
      details: verification.details,
    }));

    // Strip _debug before forwarding to CLOB
    if (parsedBody._debug) {
      delete parsedBody._debug;
    }
    const cleanBodyStr = JSON.stringify(parsedBody);

    // Use CLOB server time
    let timestamp: number;
    try {
      const timeRes = await fetch(`${CLOB_URL}/time`);
      const timeText = await timeRes.text();
      timestamp = Math.floor(Number(timeText.trim()));
      console.log("[clob-order] Server time:", timestamp);
    } catch {
      timestamp = Math.floor(Date.now() / 1000);
    }

    const method = "POST";
    const requestPath = "/order";

    // Compute HMAC with clean body (no _debug)
    const hmacSig = await buildPolyHmacSignature(creds.secret, timestamp, method, requestPath, cleanBodyStr);

    // For Safe/proxy wallets, POLY_ADDRESS must be the maker/funder address (not signer)
    // The API key is associated with the maker address
    const polyAddress = (makerAddress && makerAddress.toLowerCase() !== signerAddress.toLowerCase())
      ? makerAddress
      : signerAddress;

    const upstreamHeaders: Record<string, string> = {
      "POLY-ADDRESS": polyAddress,
      "POLY-SIGNATURE": hmacSig,
      "POLY-TIMESTAMP": `${timestamp}`,
      "POLY-API-KEY": creds.apiKey,
      "POLY-PASSPHRASE": creds.passphrase,
      "Content-Type": "application/json",
    };

    // Add proxy address header when maker differs from signer (Safe wallet)
    if (makerAddress && makerAddress.toLowerCase() !== signerAddress.toLowerCase()) {
      upstreamHeaders["POLY-PROXY-ADDRESS"] = makerAddress;
    }

    console.log("[clob-order] POLY-ADDRESS:", polyAddress, "signer:", signerAddress, "maker:", makerAddress);

    console.log("[clob-order] Forwarding to:", `${CLOB_URL}/order`);
    console.log("[clob-order] Clean body:", cleanBodyStr.slice(0, 300));

    const resp = await fetch(`${CLOB_URL}/order`, {
      method: "POST",
      headers: upstreamHeaders,
      body: cleanBodyStr,
    });

    const text = await resp.text();
    console.log("[clob-order] CLOB response:", resp.status, text.slice(0, 500));

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
