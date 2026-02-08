// ElizaBAO Backend API Client
// All calls to https://api.elizabao.xyz and https://sign.elizabao.xyz

const API_BASE = "https://api.elizabao.xyz";
const SIGNER_URL = "https://sign.elizabao.xyz/sign";

export interface AppConfig {
  privyAppId: string;
  privyClientId?: string;
  signerUrl: string;
  gammaApiUrl: string;
  clobApiUrl: string;
  dataApiUrl: string;
}

export interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomes: string; // JSON string
  outcomePrices: string; // JSON string
  clobTokenIds: string; // JSON string
  active: boolean;
  closed: boolean;
  endDate: string;
  volume: string;
  volume24hr: number;
  liquidity: string;
  description: string;
  image: string;
  icon: string;
  neg_risk: boolean;
  minimum_tick_size: string;
  tags?: { label: string; slug: string }[];
}

export interface OrderBookLevel {
  price: string;
  size: string;
}

export interface OrderBook {
  market: string;
  asset_id: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  hash: string;
  timestamp: string;
}

export interface BuilderVolume {
  builderId: string;
  builderName: string;
  volume: string;
  rank: number;
  activeUsers: number;
}

export interface LeaderboardEntry {
  rank: number;
  builderId: string;
  builderName: string;
  volume: string;
  activeUsers: number;
  trades: number;
}

// Fetch app config (Privy appId, API URLs, etc.)
export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
  const raw = await res.json();
  const cfg = raw?.config ?? raw;
  return cfg;
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// Fetch Gamma markets via proxy
export async function fetchGammaMarkets(params: {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  _q?: string;
  tag_slug?: string;
} = {}): Promise<GammaMarket[]> {
  const url = new URL(`${API_BASE}/gamma/markets`);
  if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined) url.searchParams.set("offset", String(params.offset));
  if (params.active !== undefined) url.searchParams.set("active", String(params.active));
  if (params.closed !== undefined) url.searchParams.set("closed", String(params.closed));
  if (params._q) url.searchParams.set("_q", params._q);
  if (params.tag_slug) url.searchParams.set("tag_slug", params.tag_slug);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Markets fetch failed: ${res.status}`);
  return res.json();
}

// Fetch orderbook for a specific token
export async function fetchOrderbook(tokenId: string): Promise<OrderBook> {
  const res = await fetch(`${API_BASE}/clob/orderbook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokenId }),
  });
  if (!res.ok) throw new Error(`Orderbook fetch failed: ${res.status}`);
  return res.json();
}

// Fetch builder volume stats
export async function fetchBuilderVolume(
  timePeriod: "DAY" | "WEEK" | "MONTH" | "ALL" = "MONTH"
): Promise<BuilderVolume[]> {
  const res = await fetch(`${API_BASE}/data/builders/volume?timePeriod=${timePeriod}`);
  if (!res.ok) throw new Error(`Builder volume fetch failed: ${res.status}`);
  return res.json();
}

// Fetch builder leaderboard
export async function fetchBuilderLeaderboard(params: {
  timePeriod?: "DAY" | "WEEK" | "MONTH" | "ALL";
  limit?: number;
  offset?: number;
} = {}): Promise<LeaderboardEntry[]> {
  const url = new URL(`${API_BASE}/data/builders/leaderboard`);
  url.searchParams.set("timePeriod", params.timePeriod || "MONTH");
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.offset) url.searchParams.set("offset", String(params.offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  return res.json();
}

// Get builder attribution headers from remote signing server
// This is the ONLY place builder secrets are used (server-side)
export async function getBuilderHeaders(
  accessToken: string,
  method: string,
  requestPath: string,
  body: string = ""
): Promise<Record<string, string>> {
  const res = await fetch(SIGNER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ method, requestPath, body }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Builder signing failed: ${res.status} ${errText}`);
  }

  return res.json();
}

// Parse JSON string fields from Gamma API safely
export function parseJsonField<T>(field: unknown): T[] {
  if (!field) return [];
  if (Array.isArray(field)) return field as T[];
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
