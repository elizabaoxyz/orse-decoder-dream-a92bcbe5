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
  // Decode base64 secret (handle URL-safe base64)
  const normalized = secret.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  let keyData: Uint8Array;
  try {
    const binary = atob(padded);
    keyData = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    keyData = new TextEncoder().encode(secret);
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
  body: string = ""
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = timestamp + method.toUpperCase() + requestPath + body;
  const signature = await hmacSign(creds.secret, message);

  return {
    "POLY-ADDRESS": address,
    "POLY-SIGNATURE": signature,
    "POLY-TIMESTAMP": timestamp,
    "POLY-API-KEY": creds.apiKey,
    "POLY-PASSPHRASE": creds.passphrase,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
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

async function getClobServerTime(clobApiUrl: string): Promise<number> {
  try {
    const res = await fetch(`${clobApiUrl}/time`);
    const text = await res.text();
    const num = Number(text.trim());
    if (Number.isFinite(num) && num > 0) return Math.floor(num);
    const json = JSON.parse(text);
    if (typeof json === "number") return Math.floor(json);
    return Math.floor(Date.now() / 1000);
  } catch {
    return Math.floor(Date.now() / 1000);
  }
}

export async function createOrDeriveClobCredentials(
  walletClient: WalletClient,
  address: `0x${string}`,
  clobApiUrl: string = "https://api.elizabao.xyz"
): Promise<ClobCredentials> {
  console.log("[createOrDeriveClobCredentials] Using CLOB base URL:", clobApiUrl);
  const timestamp = await getClobServerTime(clobApiUrl);
  const nonce = 0;

  const signature = await walletClient.signTypedData({
    account: address,
    domain: CLOB_AUTH_DOMAIN,
    types: CLOB_AUTH_TYPES,
    primaryType: "ClobAuth",
    message: {
      address: address,
      timestamp: timestamp.toString(),
      nonce: BigInt(nonce),
      message: "This message attests that I control the given wallet",
    },
  });

  const l1Headers: Record<string, string> = {
    "Content-Type": "application/json",
    POLY_ADDRESS: address.toLowerCase(),
    POLY_SIGNATURE: signature,
    POLY_TIMESTAMP: timestamp.toString(),
    POLY_NONCE: nonce.toString(),
  };

  // Try create first
  let res = await fetch(`${clobApiUrl}/auth/api-key`, {
    method: "POST",
    headers: l1Headers,
    body: JSON.stringify({
      address: address.toLowerCase(),
      timestamp: timestamp.toString(),
      nonce: nonce.toString(),
      signature,
    }),
  });

  // If already exists (409) or bad request (400), try derive
  if (!res.ok && (res.status === 409 || res.status === 400 || res.status === 401)) {
    console.log("[CLOB] Create failed, trying derive...");
    res = await fetch(`${clobApiUrl}/auth/derive-api-key`, {
      method: "GET",
      headers: l1Headers,
    });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`CLOB auth failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(`CLOB auth error: ${data.error}`);
  if (!data.apiKey || !data.secret || !data.passphrase) {
    throw new Error("CLOB auth response missing credentials");
  }

  console.log(`[createOrDeriveClobCredentials] signer=${address} apiKey=…${data.apiKey.slice(-6)}`);

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
  address: `0x${string}`,
  clobApiUrl: string = "https://api.elizabao.xyz"
): Promise<ClobCredentials> {
  console.log(`[resetClobCredentials] Resetting creds for signer=${address}`);
  const timestamp = await getClobServerTime(clobApiUrl);

  // Try to delete the existing API key first (best-effort)
  try {
    const delNonce = 0;
    const delSig = await walletClient.signTypedData({
      account: address,
      domain: CLOB_AUTH_DOMAIN,
      types: CLOB_AUTH_TYPES,
      primaryType: "ClobAuth",
      message: {
        address: address,
        timestamp: timestamp.toString(),
        nonce: BigInt(delNonce),
        message: "This message attests that I control the given wallet",
      },
    });
    const delHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      POLY_ADDRESS: address.toLowerCase(),
      POLY_SIGNATURE: delSig,
      POLY_TIMESTAMP: timestamp.toString(),
      POLY_NONCE: delNonce.toString(),
    };
    const delRes = await fetch(`${clobApiUrl}/auth/api-key`, {
      method: "DELETE",
      headers: delHeaders,
    });
    console.log(`[resetClobCredentials] DELETE old key: ${delRes.status}`);
  } catch (e) {
    console.warn("[resetClobCredentials] DELETE failed (non-fatal):", e);
  }

  // Create a fresh key with a new random nonce
  const freshTimestamp = await getClobServerTime(clobApiUrl);
  const newNonce = Math.floor(Math.random() * 1_000_000);

  const signature = await walletClient.signTypedData({
    account: address,
    domain: CLOB_AUTH_DOMAIN,
    types: CLOB_AUTH_TYPES,
    primaryType: "ClobAuth",
    message: {
      address: address,
      timestamp: freshTimestamp.toString(),
      nonce: BigInt(newNonce),
      message: "This message attests that I control the given wallet",
    },
  });

  const l1Headers: Record<string, string> = {
    "Content-Type": "application/json",
    POLY_ADDRESS: address.toLowerCase(),
    POLY_SIGNATURE: signature,
    POLY_TIMESTAMP: freshTimestamp.toString(),
    POLY_NONCE: newNonce.toString(),
  };

  const res = await fetch(`${clobApiUrl}/auth/api-key`, {
    method: "POST",
    headers: l1Headers,
    body: JSON.stringify({
      address: address.toLowerCase(),
      timestamp: freshTimestamp.toString(),
      nonce: newNonce.toString(),
      signature,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`CLOB reset failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.apiKey || !data.secret || !data.passphrase) {
    throw new Error("CLOB reset response missing credentials");
  }

  console.log(`[resetClobCredentials] NEW creds: signer=${address} apiKey=…${data.apiKey.slice(-6)}`);

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

// Fetch negRisk from VPS /neg-risk endpoint
async function fetchNegRisk(tokenId: string, clobApiUrl: string = "https://api.elizabao.xyz"): Promise<boolean> {
  try {
    const res = await fetch(`${clobApiUrl}/neg-risk?token_id=${encodeURIComponent(tokenId)}`);
    if (!res.ok) {
      console.warn("[fetchNegRisk] HTTP", res.status);
      return false;
    }
    const json = await res.json();
    const negRisk = json.neg_risk === true;
    console.log("[fetchNegRisk] tokenId:", tokenId, "neg_risk:", negRisk);
    return negRisk;
  } catch (e) {
    console.warn("[fetchNegRisk] Failed:", e);
    return false;
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
  const feeRateBps = 0n;
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

  // Sign directly with viem — no adapter layer
  const signature = await walletClient.signTypedData({
    account: signerAddress,
    domain,
    types: ORDER_TYPES,
    primaryType: "Order",
    message,
  });

  // Do NOT adjust v byte — CLOB server uses standard ecrecover (v=27/28)
  // The signatureType field tells the on-chain contract how to verify, not the CLOB server

  // Local signature verification — recover signer and compare
  try {
    const recoveredAddress = await recoverTypedDataAddress({
      domain,
      types: ORDER_TYPES,
      primaryType: "Order",
      message,
      signature,
    });
    const signerMatch = recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
    console.log("[createAndSignOrder] Local verify: recovered=", recoveredAddress, "signer=", signerAddress, "match=", signerMatch);
    if (!signerMatch) {
      console.error("[createAndSignOrder] ⚠️ SIGNATURE MISMATCH — recovered address does not match signer!");
    }
  } catch (e) {
    console.warn("[createAndSignOrder] Local verify failed:", e);
  }

  console.log("[createAndSignOrder] Signature (raw, no v adjust):", signature.slice(0, 20) + "...", "v=0x" + signature.slice(130));

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
  const { order, orderType } = await createAndSignOrder(
    walletClient,
    signerAddress,
    funderAddress,
    params,
    clobApiUrl
  );

  // order.salt is already a safe integer, order.side is already "BUY"/"SELL"
  const orderPayload = { order, orderType, owner: creds.apiKey };

  // 2. Serialize once — this exact string is used for HMAC AND fetch body
  const method = "POST";
  const requestPath = "/order";
  const bodyStr = JSON.stringify(orderPayload);
  const ts = Math.floor(Date.now() / 1000);

  // 3. Compute HMAC over (timestamp + method + path + body) using user secret
  const hmacMessage = String(ts) + method + requestPath + bodyStr;
  const sig = await hmacSign(creds.secret, hmacMessage);

  // 4. Build user L2 auth headers (all from same creds object)
  const l2Headers: Record<string, string> = {
    "POLY-ADDRESS": signerAddress,
    "POLY-SIGNATURE": sig,
    "POLY-TIMESTAMP": String(ts),
    "POLY-API-KEY": creds.apiKey,
    "POLY-PASSPHRASE": creds.passphrase,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // 5. Get builder attribution headers (non-auth only)
  let safeBuilderHeaders: Record<string, string> = {};
  try {
    const builderHeaders = await getBuilderHeaders(
      privyAccessToken,
      method,
      requestPath,
      bodyStr
    );
    for (const [key, value] of Object.entries(builderHeaders)) {
      if (key.startsWith("POLY_BUILDER") || key.startsWith("POLY-BUILDER")) {
        safeBuilderHeaders[key] = value;
      }
    }
  } catch (err) {
    console.warn("[placeOrder] Builder attribution failed:", err);
  }

  // 6. Merge — builder headers first, user L2 headers override
  const allHeaders = { ...safeBuilderHeaders, ...l2Headers };
  if (funderAddress.toLowerCase() !== signerAddress.toLowerCase()) {
    allHeaders["POLY-PROXY-ADDRESS"] = funderAddress;
  }

  // 7. Debug logging (no secrets)
  const akTail = creds.apiKey.slice(-6);
  console.log(`[placeOrder] path=${requestPath} method=${method} ts=${ts} bodyLen=${bodyStr.length} apiKey=…${akTail}`);
  console.log("[placeOrder] Headers:", Object.keys(allHeaders).join(", "));

  // 8. Submit — use exact same bodyStr
  const orderUrl = `${clobApiUrl}${requestPath}`;
  const res = await fetch(orderUrl, {
    method,
    headers: allHeaders,
    body: bodyStr,
  });

  const responseText = await res.text();
  console.log("[placeOrder] Response:", res.status, responseText);

  if (!res.ok) {
    return {
      success: false,
      errorMsg: `Order failed (${res.status}): ${responseText}`,
    };
  }

  const data = JSON.parse(responseText);
  return {
    success: !data.error,
    orderID: data.orderID || data.id,
    status: data.status,
    errorMsg: data.error || data.errorMsg,
  };
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
