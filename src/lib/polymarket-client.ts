// Polymarket CLOB Trading Client
// Uses viem for EIP-712 signing, Web Crypto for HMAC
// NO builder secrets in frontend — uses remote signing server

import type { WalletClient } from "viem";
import { getBuilderHeaders } from "./elizabao-api";

const CLOB_API = "https://clob.polymarket.com";
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

  return btoa(String.fromCharCode(...new Uint8Array(sig)));
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

async function getClobServerTime(): Promise<number> {
  try {
    const res = await fetch(`${CLOB_API}/time`);
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
  address: `0x${string}`
): Promise<ClobCredentials> {
  const timestamp = await getClobServerTime();
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
  let res = await fetch(`${CLOB_API}/auth/api-key`, {
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
    res = await fetch(`${CLOB_API}/auth/derive-api-key`, {
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

  return {
    apiKey: data.apiKey,
    secret: data.secret,
    passphrase: data.passphrase,
  };
}

// =============================================================================
// EIP-712 Order Signing for CTF Exchange
// =============================================================================

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

function getExchangeDomain(negRisk: boolean) {
  return {
    name: "Polymarket CTF Exchange" as const,
    version: "1" as const,
    chainId: CHAIN_ID,
    verifyingContract: (negRisk ? NEG_RISK_CTF_EXCHANGE : CTF_EXCHANGE) as `0x${string}`,
  };
}

function generateSalt(): bigint {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return BigInt(
    "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
  );
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

export async function createAndSignOrder(
  walletClient: WalletClient,
  signerAddress: `0x${string}`,
  funderAddress: `0x${string}`,
  params: OrderParams
) {
  const salt = generateSalt();
  const { makerAmount, takerAmount } = calculateAmounts(
    params.side,
    params.size,
    params.price,
    params.tickSize
  );

  // signatureType: 0=EOA, 1=Magic, 2=GNOSIS_SAFE
  const signatureType = funderAddress.toLowerCase() !== signerAddress.toLowerCase() ? 2 : 0;

  const orderMessage = {
    salt,
    maker: funderAddress as `0x${string}`,
    signer: signerAddress as `0x${string}`,
    taker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    tokenId: BigInt(params.tokenId),
    makerAmount,
    takerAmount,
    expiration: 0n,
    nonce: 0n,
    feeRateBps: 0n,
    side: params.side === "BUY" ? 0 : 1,
    signatureType,
  };

  const domain = getExchangeDomain(params.negRisk);

  const signature = await walletClient.signTypedData({
    account: signerAddress,
    domain,
    types: ORDER_TYPES,
    primaryType: "Order",
    message: orderMessage,
  });

  return {
    order: {
      salt: salt.toString(),
      maker: funderAddress,
      signer: signerAddress,
      taker: "0x0000000000000000000000000000000000000000",
      tokenId: params.tokenId,
      makerAmount: makerAmount.toString(),
      takerAmount: takerAmount.toString(),
      expiration: "0",
      nonce: "0",
      feeRateBps: "0",
      side: params.side === "BUY" ? 0 : 1,
      signatureType,
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
  privyAccessToken: string
): Promise<OrderResult> {
  // 1. Create and sign the order
  const { order, orderType } = await createAndSignOrder(
    walletClient,
    signerAddress,
    funderAddress,
    params
  );

  const orderPayload = { order, orderType, owner: funderAddress };
  const requestPath = "/order";
  const bodyString = JSON.stringify(orderPayload);

  // 2. Generate L2 auth headers
  const l2Headers = await generateL2Headers(
    creds,
    signerAddress,
    "POST",
    requestPath,
    bodyString
  );

  // 3. Get builder attribution headers from remote signer
  let builderHeaders: Record<string, string> = {};
  try {
    builderHeaders = await getBuilderHeaders(
      privyAccessToken,
      "POST",
      requestPath,
      bodyString
    );
  } catch (err) {
    console.warn("[placeOrder] Builder attribution failed:", err);
  }

  // 4. Add proxy address for Safe wallet
  const allHeaders = { ...l2Headers, ...builderHeaders };
  if (funderAddress.toLowerCase() !== signerAddress.toLowerCase()) {
    allHeaders["POLY-PROXY-ADDRESS"] = funderAddress;
  }

  // 5. Submit order
  const res = await fetch(`${CLOB_API}${requestPath}`, {
    method: "POST",
    headers: allHeaders,
    body: bodyString,
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

export async function deploySafeWallet(
  privyAccessToken: string,
  ownerAddress: string,
  signerUrl?: string
): Promise<{ success: boolean; proxyAddress?: string; error?: string }> {
  try {
    const path = "/submit";
    const body = JSON.stringify({ owner: ownerAddress });

    // Get builder HMAC headers from remote signer
    const builderHeaders = await getBuilderHeaders(
      privyAccessToken,
      "POST",
      path,
      body
    );

    console.log("[deploySafe] POST", `${RELAYER_URL}${path}`);
    console.log("[deploySafe] Builder header keys:", Object.keys(builderHeaders));

    const res = await fetch(`${RELAYER_URL}${path}`, {
      method: "POST",
      headers: {
        ...builderHeaders,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
    });

    const responseText = await res.text();
    console.log("[deploySafe] Response:", res.status, responseText);

    if (!res.ok) {
      return { success: false, error: `Deploy failed (${res.status}): ${responseText}` };
    }

    const data = JSON.parse(responseText);
    return {
      success: true,
      proxyAddress: data.proxyAddress || data.address || data.safe,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// =============================================================================
// Balance & Positions
// =============================================================================

export async function getClobBalance(
  creds: ClobCredentials,
  address: string
): Promise<string> {
  try {
    const path = "/balance-allowance?asset_type=0";
    const headers = await generateL2Headers(creds, address, "GET", path);
    const res = await fetch(`${CLOB_API}${path}`, { method: "GET", headers });

    if (!res.ok) return "0";
    const data = await res.json();
    return String(data?.balance ?? data?.availableBalance ?? "0");
  } catch {
    return "0";
  }
}

export async function getOpenOrders(
  creds: ClobCredentials,
  address: string
): Promise<unknown[]> {
  try {
    const path = "/orders";
    const headers = await generateL2Headers(creds, address, "GET", path);
    const res = await fetch(`${CLOB_API}${path}`, { method: "GET", headers });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
