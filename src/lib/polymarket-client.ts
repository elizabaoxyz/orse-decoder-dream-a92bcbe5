// Polymarket CLOB Trading Client
// Direct viem EIP-712 signing — no SDK adapter layer
// NO builder secrets in frontend — uses remote signing server

import type { WalletClient } from "viem";
import { getCreate2Address, keccak256, encodeAbiParameters, zeroAddress, hashTypedData, recoverTypedDataAddress } from "viem";
import { ethers } from "ethers";
import { RelayClient, RelayerTxType } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { getBuilderHeaders } from "./elizabao-api";

// CLOB_API is now passed as a parameter — no hardcoded URL
const RELAYER_URL = "https://relayer-v2.polymarket.com";
const CHAIN_ID = 137;

// CTF Exchange contract addresses (Polygon Mainnet)
const CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E" as const;
const NEG_RISK_CTF_EXCHANGE = "0xC5d563A36AE78145C45a50134d48A1215220f80a" as const;

// =============================================================================
// Types
// =============================================================================

export interface ClobCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

export interface OrderParams {
  tokenId: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
  tickSize: string;
  negRisk: boolean;
}

export interface OrderResult {
  orderID?: string;
  status?: string;
  success: boolean;
  errorMsg?: string;
}

// =============================================================================
// HMAC-SHA256 Signing (L2 Auth) — uses Web Crypto API
// =============================================================================

async function hmacSign(secret: string, message: string): Promise<string> {
  // Polymarket API secrets are typically base64, but some stacks store/return hex.
  // If we treat a hex string as base64, atob() will "succeed" and produce the wrong key,
  // causing 401 Unauthorized. Detect and decode hex explicitly.
  const trimmed = secret.trim();
  const isHex = /^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0 && trimmed.length >= 32;

  let keyData: Uint8Array;
  if (isHex) {
    const hex = trimmed;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    keyData = bytes;
  } else {
    // Decode base64 secret (handle URL-safe base64)
    const normalized = secret.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    try {
      const binary = atob(padded);
      keyData = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    } catch {
      // Fallback: treat as raw text (last resort)
      keyData = new TextEncoder().encode(secret);
    }
  }

  const keyBuffer = new ArrayBuffer(keyData.length);
  new Uint8Array(keyBuffer).set(keyData);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  // Standard base64 → URL-safe base64 (keep = padding per Polymarket spec)
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
}

export async function generateL2Headers(
  creds: ClobCredentials,
  address: string,
  method: string,
  requestPath: string,
  body: string = "",
  funderAddress?: string,
  opts?: { timestamp?: string }
): Promise<Record<string, string>> {
  const timestamp = opts?.timestamp || Math.floor(Date.now() / 1000).toString();
  const message = timestamp + method.toUpperCase() + requestPath + body;
  const signature = await hmacSign(creds.secret, message);
  // For proxy/Safe wallets, use the funder address for POLY-ADDRESS
  const polyAddress = (funderAddress || address).toLowerCase();

  return {
    "POLY-ADDRESS": polyAddress,
    "POLY-SIGNATURE": signature,
    "POLY-TIMESTAMP": timestamp,
    "POLY-API-KEY": creds.apiKey,
    "POLY-PASSPHRASE": creds.passphrase,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function getClobServerTimeViaProxy(clobApiUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${clobApiUrl}/time`, { method: "GET" });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    const n = Math.floor(Number(text));
    if (!Number.isFinite(n) || n <= 0) return null;
    return String(n);
  } catch {
    return null;
  }
}

// =============================================================================
// L1 Auth — Create/Derive CLOB API Credentials using EIP-712
// =============================================================================

const CLOB_AUTH_DOMAIN = {
  name: "ClobAuthDomain" as const,
  version: "1" as const,
  chainId: CHAIN_ID,
} as const;

const CLOB_AUTH_TYPES = {
  ClobAuth: [
    { name: "address", type: "address" },
    { name: "timestamp", type: "string" },
    { name: "nonce", type: "uint256" },
    { name: "message", type: "string" },
  ],
} as const;

async function callClobAuth(action: string, params: Record<string, unknown>): Promise<any> {
  // Use VPS API for clob-auth to avoid Supabase auth/JWT requirements on live.
  // `clobApiUrl` is not available here, so we rely on the default live VPS origin.
  const res = await fetch("https://api.elizabao.xyz/clob-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`clob-auth http ${res.status}: ${text || res.statusText}`);
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text;
  }
}

async function getClobServerTime(_clobApiUrl: string): Promise<number> {
  try {
    const data = await callClobAuth("time", {});
    const num = Number(typeof data === "string" ? data : JSON.stringify(data));
    if (Number.isFinite(num) && num > 0) return Math.floor(num);
    return Math.floor(Date.now() / 1000);
  } catch {
    return Math.floor(Date.now() / 1000);
  }
}

export async function createOrDeriveClobCredentials(
  walletClient: WalletClient,
  signerAddress: `0x${string}`,
  clobApiUrl: string = "https://api.elizabao.xyz",
  funderAddress?: `0x${string}`
): Promise<ClobCredentials> {
  // For proxy/Safe wallets, the CLOB associates the API key with the FUNDER address.
  // The signer (EOA) signs the message, but the address field uses the funder.
  const credentialAddress = funderAddress || signerAddress;
  console.log("[createOrDeriveClobCredentials] signer:", signerAddress, "credentialAddress:", credentialAddress);
  const timestamp = await getClobServerTime(clobApiUrl);
  const nonce = 0;

  const signature = await walletClient.signTypedData({
    account: signerAddress,
    domain: CLOB_AUTH_DOMAIN,
    types: CLOB_AUTH_TYPES,
    primaryType: "ClobAuth",
    message: {
      address: credentialAddress,
      timestamp: timestamp.toString(),
      nonce: BigInt(nonce),
      message: "This message attests that I control the given wallet",
    },
  });

  // Route through edge function — no CORS issues
  let data: any;
  try {
    data = await callClobAuth("create", {
      poly_address: credentialAddress.toLowerCase(),
      poly_signature: signature,
      poly_timestamp: timestamp.toString(),
      poly_nonce: nonce.toString(),
      payload: {
        address: credentialAddress.toLowerCase(),
        timestamp: timestamp.toString(),
        nonce: nonce.toString(),
        signature,
      },
    });
  } catch (e) {
    console.log("[CLOB] Create failed, trying derive...", e);
    data = await callClobAuth("derive", {
      poly_address: credentialAddress.toLowerCase(),
      poly_signature: signature,
      poly_timestamp: timestamp.toString(),
      poly_nonce: nonce.toString(),
    });
  }

  // Handle error responses from CLOB
  if (data?.error) {
    // If create returned error, try derive
    if (!data.apiKey) {
      console.log("[CLOB] Create returned error, trying derive...", data.error);
      data = await callClobAuth("derive", {
        poly_address: credentialAddress.toLowerCase(),
        poly_signature: signature,
        poly_timestamp: timestamp.toString(),
        poly_nonce: nonce.toString(),
      });
    }
  }

  if (!data?.apiKey || !data?.secret || !data?.passphrase) {
    throw new Error(`CLOB auth response missing credentials: ${JSON.stringify(data)}`);
  }

  console.log(`[createOrDeriveClobCredentials] credentialAddress=${credentialAddress} apiKey=…${data.apiKey.slice(-6)}`);

  return {
    apiKey: data.apiKey,
    secret: data.secret,
    passphrase: data.passphrase,
  };
}

/**
 * Force-reset CLOB API credentials by deleting old key and creating a new one
 * with a fresh random nonce. This ensures we never mix old/new credentials.
 */
export async function resetClobCredentials(
  walletClient: WalletClient,
  signerAddress: `0x${string}`,
  clobApiUrl: string = "https://api.elizabao.xyz",
  funderAddress?: `0x${string}`
): Promise<ClobCredentials> {
  const credentialAddress = funderAddress || signerAddress;
  console.log(`[resetClobCredentials] Resetting creds for credentialAddress=${credentialAddress} signer=${signerAddress}`);
  const timestamp = await getClobServerTime(clobApiUrl);

  // Try to delete the existing API key first (best-effort, via edge function)
  try {
    const delNonce = 0;
    const delSig = await walletClient.signTypedData({
      account: signerAddress,
      domain: CLOB_AUTH_DOMAIN,
      types: CLOB_AUTH_TYPES,
      primaryType: "ClobAuth",
      message: {
        address: credentialAddress,
        timestamp: timestamp.toString(),
        nonce: BigInt(delNonce),
        message: "This message attests that I control the given wallet",
      },
    });
    const delResult = await callClobAuth("delete", {
      poly_address: credentialAddress.toLowerCase(),
      poly_signature: delSig,
      poly_timestamp: timestamp.toString(),
      poly_nonce: delNonce.toString(),
    });
    console.log(`[resetClobCredentials] DELETE old key result:`, delResult);
  } catch (e) {
    console.warn("[resetClobCredentials] DELETE failed (non-fatal):", e);
  }

  // Create a fresh key with a new random nonce
  const freshTimestamp = await getClobServerTime(clobApiUrl);
  const newNonce = Math.floor(Math.random() * 1_000_000);

  const signature = await walletClient.signTypedData({
    account: signerAddress,
    domain: CLOB_AUTH_DOMAIN,
    types: CLOB_AUTH_TYPES,
    primaryType: "ClobAuth",
    message: {
      address: credentialAddress,
      timestamp: freshTimestamp.toString(),
      nonce: BigInt(newNonce),
      message: "This message attests that I control the given wallet",
    },
  });

  const data = await callClobAuth("create", {
    poly_address: credentialAddress.toLowerCase(),
    poly_signature: signature,
    poly_timestamp: freshTimestamp.toString(),
    poly_nonce: newNonce.toString(),
    payload: {
      address: credentialAddress.toLowerCase(),
      timestamp: freshTimestamp.toString(),
      nonce: newNonce.toString(),
      signature,
    },
  });

  if (!data?.apiKey || !data?.secret || !data?.passphrase) {
    throw new Error(`CLOB reset response missing credentials: ${JSON.stringify(data)}`);
  }

  console.log(`[resetClobCredentials] NEW creds: credentialAddress=${credentialAddress} apiKey=…${data.apiKey.slice(-6)}`);

  return {
    apiKey: data.apiKey,
    secret: data.secret,
    passphrase: data.passphrase,
  };
}

// =============================================================================
// EIP-712 Order Signing — direct viem signTypedData (no SDK adapter)
// =============================================================================

const PROTOCOL_NAME = "Polymarket CTF Exchange";
const PROTOCOL_VERSION = "1";

const ORDER_TYPES = {
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

const SIG_TYPE_EOA = 0;
const SIG_TYPE_POLY_GNOSIS_SAFE = 2;

function getExchangeAddress(negRisk: boolean): string {
  return negRisk ? NEG_RISK_CTF_EXCHANGE : CTF_EXCHANGE;
}

function generateSalt(): bigint {
  return BigInt(Math.round(Math.random() * Date.now()));
}

function calculateAmounts(
  side: "BUY" | "SELL",
  size: number,
  price: number,
  tickSize: string
): { makerAmount: bigint; takerAmount: bigint } {
  const DECIMALS = 6;
  const tick = parseFloat(tickSize);
  const roundedPrice = Math.round(price / tick) * tick;
  if (side === "BUY") {
    const usdcAmount = size * roundedPrice;
    return {
      makerAmount: BigInt(Math.round(usdcAmount * 10 ** DECIMALS)),
      takerAmount: BigInt(Math.round(size * 10 ** DECIMALS)),
    };
  } else {
    const usdcAmount = size * roundedPrice;
    return {
      makerAmount: BigInt(Math.round(size * 10 ** DECIMALS)),
      takerAmount: BigInt(Math.round(usdcAmount * 10 ** DECIMALS)),
    };
  }
}

async function fetchGammaMarketForToken(tokenId: string, clobApiUrl: string): Promise<any | null> {
  try {
    // Use VPS proxy (same-origin) to avoid CORS and avoid Supabase edge 401s on live.
    const url = new URL(`${clobApiUrl}/gamma/markets`);
    url.searchParams.set("clob_token_ids", tokenId);
    const res = await fetch(url.toString(), { method: "GET", headers: { accept: "application/json" } });
    if (!res.ok) {
      console.warn("[fetchGammaMarketForToken] HTTP", res.status);
      return null;
    }
    const data = await res.json().catch(() => null);
    // Gamma may return an array OR an object wrapper depending on proxy/version.
    const arr =
      Array.isArray(data) ? data :
      Array.isArray((data as any)?.data) ? (data as any).data :
      Array.isArray((data as any)?.markets) ? (data as any).markets :
      Array.isArray((data as any)?.data?.markets) ? (data as any).data.markets :
      null;
    return Array.isArray(arr) && arr.length ? arr[0] : null;
  } catch {
    return null;
  }
}

async function fetchNegRiskViaVps(tokenId: string, clobApiUrl: string): Promise<boolean | null> {
  try {
    const url = new URL(`${clobApiUrl}/neg-risk`);
    url.searchParams.set("token_id", tokenId);
    const res = await fetch(url.toString(), { method: "GET", headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const v = (data as any)?.neg_risk ?? (data as any)?.negRisk;
    if (typeof v === "boolean") return v;
    return null;
  } catch {
    return null;
  }
}

async function fetchFeeRateViaVps(tokenId: string, clobApiUrl: string): Promise<number | null> {
  try {
    const url = new URL(`${clobApiUrl}/fee-rate`);
    url.searchParams.set("token_id", tokenId);
    const res = await fetch(url.toString(), { method: "GET", headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const n = Number((data as any)?.base_fee ?? (data as any)?.baseFee ?? (data as any)?.fee_rate_bps ?? NaN);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

// Fetch negRisk primarily via VPS Gamma proxy (Supabase edge often 401s in prod).
async function fetchNegRisk(tokenId: string, clobApiUrl: string = ""): Promise<boolean> {
  if (clobApiUrl) {
    const vps = await fetchNegRiskViaVps(tokenId, clobApiUrl);
    if (typeof vps === "boolean") {
      console.log("[fetchNegRisk] tokenId:", tokenId, "neg_risk:", vps, "(vps)");
      return vps;
    }
  }

  const m = clobApiUrl ? await fetchGammaMarketForToken(tokenId, clobApiUrl) : null;
  if (m && m.neg_risk === true) {
    console.log("[fetchNegRisk] tokenId:", tokenId, "neg_risk:", true, "(gamma proxy)");
    return true;
  }
  if (m && m.neg_risk === false) {
    console.log("[fetchNegRisk] tokenId:", tokenId, "neg_risk:", false, "(gamma proxy)");
    return false;
  }

  // Fallback: Supabase edge function (works in local dev)
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("polymarket-clob", {
      body: { action: "getNegRisk", params: { tokenId } },
    });
    if (error) {
      console.warn("[fetchNegRisk] Edge function error:", error);
      return false;
    }
    const negRisk = data?.data?.neg_risk === true;
    console.log("[fetchNegRisk] tokenId:", tokenId, "neg_risk:", negRisk, "(edge)");
    return negRisk;
  } catch (e) {
    console.warn("[fetchNegRisk] Failed:", e);
    return false;
  }
}

// Fetch fee rate bps primarily from Gamma (maker_base_fee), fallback to CLOB fee-rate via edge.
async function fetchFeeRateBps(tokenId: string, clobApiUrl: string = ""): Promise<number> {
  if (clobApiUrl) {
    const vps = await fetchFeeRateViaVps(tokenId, clobApiUrl);
    if (typeof vps === "number") {
      console.log("[fetchFeeRateBps] tokenId:", tokenId, "fee_bps:", vps, "(vps)");
      return vps;
    }
  }

  const m = clobApiUrl ? await fetchGammaMarketForToken(tokenId, clobApiUrl) : null;
  const gammaFee = Number(m?.maker_base_fee ?? m?.fee_rate_bps ?? m?.makerBaseFee ?? NaN);
  if (Number.isFinite(gammaFee) && gammaFee >= 0) {
    console.log("[fetchFeeRateBps] tokenId:", tokenId, "fee_bps:", gammaFee, "(gamma proxy)");
    return gammaFee;
  }

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("polymarket-clob", {
      body: { action: "getFeeRate", params: { tokenId } },
    });
    if (error) {
      console.warn("[fetchFeeRateBps] Edge function error:", error);
      return 0;
    }
    const baseFee = Number(data?.data?.base_fee ?? 0);
    console.log("[fetchFeeRateBps] tokenId:", tokenId, "base_fee:", baseFee, "(edge)");
    return Number.isFinite(baseFee) ? baseFee : 0;
  } catch (e) {
    console.warn("[fetchFeeRateBps] Failed:", e);
    return 0;
  }
}

export async function createAndSignOrder(
  walletClient: WalletClient,
  signerAddress: `0x${string}`,
  funderAddress: `0x${string}`,
  params: OrderParams,
  clobApiUrl: string = "https://api.elizabao.xyz"
) {
  const { makerAmount, takerAmount } = calculateAmounts(
    params.side,
    params.size,
    params.price,
    params.tickSize
  );

  const sigType = funderAddress.toLowerCase() !== signerAddress.toLowerCase()
    ? SIG_TYPE_POLY_GNOSIS_SAFE
    : SIG_TYPE_EOA;

  const sideNum = params.side === "BUY" ? 0 : 1;

  // Fetch negRisk from VPS /neg-risk endpoint
  const fetchedNegRisk = await fetchNegRisk(params.tokenId, clobApiUrl);
  const negRisk = params.negRisk || fetchedNegRisk;
  const fetchedFeeRate = await fetchFeeRateBps(params.tokenId, clobApiUrl);
  const feeRateBps = BigInt(fetchedFeeRate);
  const contractAddress = getExchangeAddress(negRisk) as `0x${string}`;

  console.log("[createAndSignOrder] negRisk:", negRisk, "verifyingContract:", contractAddress, "feeRateBps:", String(feeRateBps));

  const salt = generateSalt();

  const domain = {
    name: PROTOCOL_NAME,
    version: PROTOCOL_VERSION,
    chainId: CHAIN_ID,
    verifyingContract: contractAddress,
  };

  const message = {
    salt,
    maker: funderAddress as `0x${string}`,
    signer: signerAddress as `0x${string}`,
    taker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    tokenId: BigInt(params.tokenId),
    makerAmount,
    takerAmount,
    expiration: 0n,
    nonce: 0n,
    feeRateBps,
    side: sideNum,
    signatureType: sigType,
  };

  // Compute hash for diagnostics
  const orderHash = hashTypedData({
    domain,
    types: ORDER_TYPES,
    primaryType: "Order",
    message,
  });

  console.log("[createAndSignOrder] Order hash:", orderHash);
  console.log("[createAndSignOrder] Signer:", signerAddress, "Maker:", funderAddress);
  console.log("[createAndSignOrder] Message:", JSON.stringify({
    salt: String(salt),
    tokenId: params.tokenId,
    makerAmount: String(makerAmount),
    takerAmount: String(takerAmount),
    feeRateBps: String(feeRateBps),
    side: sideNum,
    signatureType: sigType,
  }));

  // Sign with standard EIP-712 signTypedData
  const signature = await walletClient.signTypedData({
    account: signerAddress,
    domain,
    types: ORDER_TYPES,
    primaryType: "Order",
    message,
  });

  console.log("[createAndSignOrder] signTypedData v=0x" + signature.slice(130));

  // Local signature verification
  try {
    const recoveredAddress = await recoverTypedDataAddress({
      domain,
      types: ORDER_TYPES,
      primaryType: "Order",
      message,
      signature,
    });
    const match = recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
    console.log("[createAndSignOrder] Local verify: recovered=", recoveredAddress, "signer=", signerAddress, "match=", match);
  } catch (e) {
    console.warn("[createAndSignOrder] Local verify failed:", e);
  }

  return {
    order: {
      salt: Number(salt),
      maker: funderAddress,
      signer: signerAddress,
      taker: "0x0000000000000000000000000000000000000000",
      tokenId: params.tokenId,
      makerAmount: String(makerAmount),
      takerAmount: String(takerAmount),
      expiration: "0",
      nonce: "0",
      feeRateBps: String(feeRateBps),
      side: params.side,
      signatureType: sigType,
      signature,
    },
    orderType: "GTC",
    // Pass hash + signing details to edge function for server-side verification
    _debug: {
      orderHash,
      domain: JSON.stringify(domain),
      message: JSON.stringify(message, (_, v) => typeof v === "bigint" ? v.toString() : v),
    },
  };
}

// =============================================================================
// Place Order on CLOB (with builder attribution)
// =============================================================================

export async function placeOrder(
  creds: ClobCredentials,
  signerAddress: `0x${string}`,
  walletClient: WalletClient,
  funderAddress: `0x${string}`,
  params: OrderParams,
  privyAccessToken: string,
  clobApiUrl: string = "https://api.elizabao.xyz"
): Promise<OrderResult> {
  // 1. Create and sign the order
  const { order, orderType, _debug } = await createAndSignOrder(
    walletClient,
    signerAddress,
    funderAddress,
    params,
    clobApiUrl
  );

  // Include _debug hash ONLY for edge-function verification.
  const orderPayloadWithDebug = { deferExec: false, order, owner: creds.apiKey, orderType, _debug };
  const bodyStrWithDebug = JSON.stringify(orderPayloadWithDebug);

  // Clean payload for direct CLOB/VPS submission (CLOB may reject unknown top-level fields like _debug).
  const orderPayloadClean = { deferExec: false, order, owner: creds.apiKey, orderType };
  const bodyStrClean = JSON.stringify(orderPayloadClean);

  // 3. Debug logging (no secrets)
  const akTail = creds.apiKey.slice(-6);
  console.log(
    `[placeOrder] cleanBodyLen=${bodyStrClean.length} debugBodyLen=${bodyStrWithDebug.length} apiKey=…${akTail} signer=${signerAddress}`
  );

  // 4) Preferred path: Supabase Edge Function (bypasses CORS/Cloudflare, server-side HMAC)
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke("clob-order", {
      body: {
        bodyStr: bodyStrWithDebug,
        creds: {
          apiKey: creds.apiKey,
          secret: creds.secret,
          passphrase: creds.passphrase,
        },
        signerAddress,
        makerAddress: funderAddress,
      },
    });

    if (edgeError) {
      throw edgeError;
    }

    const responseText = typeof edgeData === "string" ? edgeData : JSON.stringify(edgeData);
    console.log("[placeOrder] Edge response:", responseText);

    const data = typeof edgeData === "object" ? edgeData : JSON.parse(responseText);
    if (data?.error) {
      return { success: false, errorMsg: `Order failed: ${data.error}` };
    }

    return {
      success: true,
      orderID: data.orderID || data.id,
      status: data.status,
      errorMsg: data.error || data.errorMsg,
    };
  } catch (edgeErr: any) {
    // Common on live if Supabase env vars are missing/misconfigured.
    const msg = edgeErr?.message || String(edgeErr);
    console.warn("[placeOrder] Edge function failed, falling back to VPS proxy:", msg);
  }

  // 5) Fallback path: call VPS proxy directly (browser HMAC + builder headers)
  try {
    const requestPath = "/order";
    const method = "POST";

    let builderHeaders: Record<string, string> = {};
    try {
      builderHeaders = await getBuilderHeaders(privyAccessToken, method, requestPath, bodyStrClean);
    } catch (e: any) {
      console.warn("[placeOrder] Builder headers unavailable (non-fatal):", e?.message || String(e));
    }

    const serverTs = await getClobServerTimeViaProxy(clobApiUrl);

    const url = `${clobApiUrl}${requestPath}`;

    const trySubmit = async (polyAddress: `0x${string}`, includeProxy: boolean) => {
      const l2 = await generateL2Headers(
        creds,
        signerAddress,
        method,
        requestPath,
        bodyStrClean,
        /* funderAddress (used for POLY-ADDRESS) */ polyAddress,
        serverTs ? { timestamp: serverTs } : undefined
      );
      const headers: Record<string, string> = { ...l2, ...builderHeaders };
      if (includeProxy && funderAddress.toLowerCase() !== signerAddress.toLowerCase()) {
        headers["POLY-PROXY-ADDRESS"] = funderAddress.toLowerCase();
      }
      console.log("[placeOrder] VPS submit:", url, "polyAddress=", polyAddress, "headers=", Object.keys(headers).join(", "));
      const res = await fetch(url, { method, headers, body: bodyStrClean });
      const text = await res.text().catch(() => "");
      console.log("[placeOrder] VPS response:", res.status, text.slice(0, 300));
      return { res, text };
    };

    // Attempt 1: assume API key is bound to the funder (Safe)
    let { res, text } = await trySubmit(funderAddress, /* includeProxy */ true);

    // If API key is actually bound to the signer EOA, retry with POLY-ADDRESS=EOA and POLY-PROXY-ADDRESS=Safe.
    if (!res.ok && res.status === 401 && text.includes("Unauthorized/Invalid api key")) {
      console.warn("[placeOrder] VPS got 401 invalid key with funder POLY-ADDRESS; retrying with signer POLY-ADDRESS + proxy header");
      ({ res, text } = await trySubmit(signerAddress, /* includeProxy */ true));
    }

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || `HTTP ${res.status}` };
    }

    if (!res.ok || data?.error) {
      return { success: false, errorMsg: `Order failed: ${data?.error || text || `HTTP ${res.status}`}` };
    }

    return {
      success: true,
      orderID: data.orderID || data.id,
      status: data.status,
      errorMsg: data.error || data.errorMsg,
    };
  } catch (e: any) {
    return { success: false, errorMsg: e?.message || String(e) };
  }
}

// =============================================================================
// CLOB balance/allowance via VPS proxy (no Supabase edge dependency)
// =============================================================================

export async function fetchBalanceAllowanceViaVps(
  creds: ClobCredentials,
  signerAddress: `0x${string}`,
  clobApiUrl: string,
  funderAddress?: `0x${string}`
): Promise<{ balance: number; allowance: number } | null> {
  try {
    const signingPath = "/balance-allowance";
    const url = new URL(`${clobApiUrl}${signingPath}`);
    url.searchParams.set("asset_type", "COLLATERAL");

    const serverTs = await getClobServerTimeViaProxy(clobApiUrl);
    const method = "GET";

    const tryFetch = async (polyAddress: `0x${string}`, includeProxy: boolean) => {
      const headers = await generateL2Headers(
        creds,
        signerAddress,
        method,
        signingPath,
        "",
        /* funderAddress (used for POLY-ADDRESS) */ polyAddress,
        serverTs ? { timestamp: serverTs } : undefined
      );
      const h: Record<string, string> = { ...headers };
      if (includeProxy && funderAddress && funderAddress.toLowerCase() !== signerAddress.toLowerCase()) {
        h["POLY-PROXY-ADDRESS"] = funderAddress.toLowerCase();
      }
      const res = await fetch(url.toString(), { method, headers: h });
      const text = await res.text().catch(() => "");
      return { res, text };
    };

    const preferred = (funderAddress || signerAddress) as `0x${string}`;
    let { res, text } = await tryFetch(preferred, /* includeProxy */ true);
    if (!res.ok && res.status === 401 && text.includes("Unauthorized/Invalid api key")) {
      // Retry with signer-bound key
      ({ res, text } = await tryFetch(signerAddress, /* includeProxy */ true));
    }
    if (!res.ok) return null;

    const data = text ? JSON.parse(text) : {};

    const bal = Number(data?.balance ?? 0);
    const allow = Number(data?.allowance ?? 0);
    return {
      balance: Number.isFinite(bal) ? bal : 0,
      allowance: Number.isFinite(allow) ? allow : 0,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// Relayer — Gasless Safe Wallet Operations
// =============================================================================

async function getRelayerHeaders(
  privyAccessToken: string,
  method: string,
  path: string,
  body: string = ""
): Promise<Record<string, string>> {
  // Get builder auth headers from remote signer for relayer requests
  const builderHeaders = await getBuilderHeaders(
    privyAccessToken,
    method,
    path,
    body
  );
  return {
    ...builderHeaders,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// Constants from SDK
const SAFE_FACTORY = "0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b" as const;
const SAFE_INIT_CODE_HASH = "0x2bce2127ff07fb632d16c8347c4ebf501f4841168bed00d9e6ef715ddb6fcecf" as const;

function deriveSafeAddress(ownerAddress: string): string {
  const salt = keccak256(
    encodeAbiParameters([{ name: "address", type: "address" }], [ownerAddress as `0x${string}`])
  );
  return getCreate2Address({ bytecodeHash: SAFE_INIT_CODE_HASH, from: SAFE_FACTORY, salt });
}

export async function deploySafeWallet(
  privyAccessToken: string,
  ownerAddress: string,
  eip1193Provider: any, // EIP-1193 provider from Privy (already on Polygon 137)
  signerUrl: string = "https://sign.elizabao.xyz/sign"
): Promise<{ success: boolean; proxyAddress?: string; transactionHash?: string; error?: string }> {
  try {
    const expectedSafe = deriveSafeAddress(ownerAddress);
    console.log("[deploySafe] Expected Safe:", expectedSafe);

    // 1. Check if already deployed
    const deployedRes = await fetch(`${RELAYER_URL}/deployed?address=${expectedSafe}`);
    const deployedData = await deployedRes.json();
    if (deployedData.deployed) {
      console.log("[deploySafe] Already deployed");
      return { success: true, proxyAddress: expectedSafe, error: undefined };
    }

    // 2. Wrap EIP-1193 provider in ethers v5 JsonRpcSigner
    console.log("[deploySafe] Creating ethers Web3Provider + signer...");
    const web3Provider = new ethers.providers.Web3Provider(eip1193Provider);
    const signer = web3Provider.getSigner();
    const signerAddr = await signer.getAddress();
    console.log("[deploySafe] Signer address:", signerAddr);

    // 3. Build BuilderConfig with remote signing (uses Privy access token)
    const builderConfig = new BuilderConfig({
      remoteBuilderConfig: { url: signerUrl, token: privyAccessToken },
    });

    // 4. Create RelayClient with ethers signer + builder config
    const client = new RelayClient(
      RELAYER_URL,
      CHAIN_ID,
      signer,
      builderConfig,
      RelayerTxType.SAFE,
    );

    // 5. Deploy via SDK (handles EIP-712 signing internally through ethers)
    console.log("[deploySafe] Calling client.deploy()...");
    const response = await client.deploy();
    console.log("[deploySafe] Deploy response received");

    // 6. Wait for confirmation using SDK's built-in polling
    if (response?.transactionID) {
      console.log("[deploySafe] Waiting for tx confirmation:", response.transactionID);
      const confirmed = await client.pollUntilState(
        response.transactionID,
        ["STATE_MINED", "STATE_CONFIRMED"],
        "STATE_FAILED",
        30,
        2000,
      );
      if (confirmed) {
        return { success: true, proxyAddress: expectedSafe, transactionHash: confirmed.transactionHash };
      }
      return { success: false, error: "Transaction failed or timed out" };
    }

    return { success: true, proxyAddress: expectedSafe };
  } catch (err: any) {
    // Safe-stringify to avoid circular reference errors
    const msg = err?.message ?? String(err);
    console.error("[deploySafe] Error:", msg);

    // If the SDK threw but the deploy actually went through, check on-chain
    try {
      const expectedSafe = deriveSafeAddress(ownerAddress);
      const checkRes = await fetch(`${RELAYER_URL}/deployed?address=${expectedSafe}`);
      const checkData = await checkRes.json();
      if (checkData.deployed) {
        console.log("[deploySafe] Deploy succeeded despite SDK error");
        return { success: true, proxyAddress: expectedSafe };
      }
    } catch { /* ignore check error */ }

    return { success: false, error: msg };
  }
}

// =============================================================================
// Balance & Positions
// =============================================================================

export async function getClobBalance(
  creds: ClobCredentials,
  address: string,
  clobApiUrl: string = "https://api.elizabao.xyz"
): Promise<string> {
  try {
    const path = "/balance-allowance?asset_type=0";
    const headers = await generateL2Headers(creds, address, "GET", path);
    const res = await fetch(`${clobApiUrl}${path}`, { method: "GET", headers });

    if (!res.ok) return "0";
    const data = await res.json();
    return String(data?.balance ?? data?.availableBalance ?? "0");
  } catch {
    return "0";
  }
}

export async function getOpenOrders(
  creds: ClobCredentials,
  address: string,
  clobApiUrl: string = "https://api.elizabao.xyz"
): Promise<unknown[]> {
  try {
    const path = "/orders";
    const headers = await generateL2Headers(creds, address, "GET", path);
    const res = await fetch(`${clobApiUrl}${path}`, { method: "GET", headers });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
