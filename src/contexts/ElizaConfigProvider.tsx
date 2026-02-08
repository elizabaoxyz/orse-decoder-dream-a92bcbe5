import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { PrivyProvider, usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { createWalletClient, custom } from "viem";
import { polygon } from "viem/chains";
import type { WalletClient } from "viem";
import type { AppConfig } from "@/lib/elizabao-api";
import { fetchConfig } from "@/lib/elizabao-api";
import type { ClobCredentials } from "@/lib/polymarket-client";

// =============================================================================
// Config Context
// =============================================================================

interface ConfigContextValue {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: null,
  loading: true,
  error: null,
});

export const useAppConfig = () => useContext(ConfigContext);

// =============================================================================
// Trading Context (Privy auth state + wallet + credentials)
// =============================================================================

interface TradingContextValue {
  // Auth
  isAuthenticated: boolean;
  privyReady: boolean;
  walletsReady: boolean;
  userAddress: `0x${string}` | null;
  accessToken: string | null;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<string | null>;

  // Wallet
  walletClient: WalletClient | null;
  ethProvider: any; // raw EIP-1193 provider
  switchToPolygon: () => Promise<any>; // switch chain & return fresh provider
  walletReady: boolean;
  walletCreateError: string;
  retryCreateWallet: () => void;

  // Safe wallet
  safeAddress: string | null;
  setSafeAddress: (addr: string | null) => void;

  // CLOB credentials
  clobCredentials: ClobCredentials | null;
  setClobCredentials: (creds: ClobCredentials | null) => void;

  // Debug
  walletsCount: number;
  privyUserId: string | null;
}

const TradingContext = createContext<TradingContextValue>({
  isAuthenticated: false,
  privyReady: false,
  walletsReady: false,
  userAddress: null,
  accessToken: null,
  login: () => {},
  logout: () => {},
  refreshToken: async () => null,
  walletClient: null,
  ethProvider: null,
  switchToPolygon: async () => null,
  walletReady: false,
  walletCreateError: "",
  retryCreateWallet: () => {},
  safeAddress: null,
  setSafeAddress: () => {},
  clobCredentials: null,
  setClobCredentials: () => {},
  walletsCount: 0,
  privyUserId: null,
});

export const useTrading = () => useContext(TradingContext);

// =============================================================================
// Trading Provider (sits inside PrivyProvider)
// =============================================================================

function TradingProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, authenticated, ready: privyReady, getAccessToken, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet: privyCreateWallet } = useCreateWallet();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [ethProvider, setEthProvider] = useState<any>(null);
  const [walletReady, setWalletReady] = useState(false);
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null);
  const [walletCreateError, setWalletCreateError] = useState("");
  const walletCreateStartedRef = useRef(false);

  // Safe address & CLOB credentials — keyed by user address
  const [safeAddress, setSafeAddressState] = useState<string | null>(null);
  const [clobCredentials, setClobCredentialsState] = useState<ClobCredentials | null>(null);

  // Load user-specific data from localStorage when userAddress changes
  useEffect(() => {
    if (!userAddress) {
      setSafeAddressState(null);
      setClobCredentialsState(null);
      return;
    }
    try {
      const safe = localStorage.getItem(`elizabao_safe_${userAddress}`);
      setSafeAddressState(safe);
    } catch { setSafeAddressState(null); }
    try {
      const creds = localStorage.getItem(`elizabao_clob_${userAddress}`);
      setClobCredentialsState(creds ? JSON.parse(creds) : null);
    } catch { setClobCredentialsState(null); }
  }, [userAddress]);

  const setSafeAddress = useCallback((addr: string | null) => {
    setSafeAddressState(addr);
    if (!userAddress) return;
    if (addr) {
      localStorage.setItem(`elizabao_safe_${userAddress}`, addr);
    } else {
      localStorage.removeItem(`elizabao_safe_${userAddress}`);
    }
  }, [userAddress]);

  const setClobCredentials = useCallback((creds: ClobCredentials | null) => {
    setClobCredentialsState(creds);
    if (!userAddress) return;
    if (creds) {
      localStorage.setItem(`elizabao_clob_${userAddress}`, JSON.stringify(creds));
    } else {
      localStorage.removeItem(`elizabao_clob_${userAddress}`);
    }
  }, [userAddress]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getAccessToken();
      setAccessToken(token);
      return token;
    } catch {
      setAccessToken(null);
      return null;
    }
  }, [getAccessToken]);

  // Get access token on auth change
  useEffect(() => {
    if (authenticated) {
      refreshToken();
    } else {
      setAccessToken(null);
    }
  }, [authenticated, refreshToken]);

  // Auto-create embedded wallet if user is authenticated but has no wallet
  const doCreateWallet = useCallback(async () => {
    if (walletCreateStartedRef.current) return;
    walletCreateStartedRef.current = true;
    setWalletCreateError("");
    console.log("[TradingProvider] No wallet found, creating one...");
    try {
      const wallet = await privyCreateWallet();
      console.log("[TradingProvider] Embedded wallet created:", wallet.address);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setWalletCreateError(msg);
      console.error("[TradingProvider] createWallet failed:", e);
      walletCreateStartedRef.current = false; // allow retry
    }
  }, [privyCreateWallet]);

  useEffect(() => {
    if (!privyReady || !authenticated || !walletsReady) return;
    if (wallets.length > 0) return;
    if (walletCreateStartedRef.current) return;
    doCreateWallet();
  }, [privyReady, authenticated, walletsReady, wallets.length, doCreateWallet]);

  const retryCreateWallet = useCallback(() => {
    walletCreateStartedRef.current = false;
    doCreateWallet();
  }, [doCreateWallet]);

  // Set up wallet client from Privy embedded wallet
  useEffect(() => {
    async function setupWallet() {
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy"
      );

      if (!embeddedWallet) {
        setWalletClient(null);
        setWalletReady(false);
        setUserAddress(null);
        return;
      }

      try {
        // Switch to Polygon if needed
        await embeddedWallet.switchChain(137);
        const provider = await embeddedWallet.getEthereumProvider();

        const client = createWalletClient({
          chain: polygon,
          transport: custom(provider),
          account: embeddedWallet.address as `0x${string}`,
        });

        setWalletClient(client);
        setEthProvider(provider);
        setUserAddress(embeddedWallet.address as `0x${string}`);
        setWalletReady(true);
      } catch (err) {
        console.error("[TradingProvider] Wallet setup error:", err);
        setWalletClient(null);
        setWalletReady(false);
      }
    }

    if (authenticated && wallets.length > 0) {
      setupWallet();
    }
  }, [authenticated, wallets]);

  const switchToPolygon = useCallback(async () => {
    const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
    if (!embeddedWallet) throw new Error("No embedded wallet found");
    await embeddedWallet.switchChain(137);
    const provider = await embeddedWallet.getEthereumProvider();
    setEthProvider(provider);
    return provider;
  }, [wallets]);

  return (
    <TradingContext.Provider
      value={{
        isAuthenticated: authenticated,
        privyReady,
        walletsReady,
        userAddress,
        accessToken,
        login,
        logout,
        refreshToken,
        walletClient,
        ethProvider,
        switchToPolygon,
        walletReady: privyReady && authenticated && walletsReady && wallets.length > 0,
        walletCreateError,
        retryCreateWallet,
        safeAddress,
        setSafeAddress,
        clobCredentials,
        setClobCredentials,
        walletsCount: wallets.length,
        privyUserId: user?.id ?? null,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

// =============================================================================
// Main Config Provider (fetches config → renders PrivyProvider → TradingProvider)
// =============================================================================

export function ElizaConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig()
      .then((cfg) => {
        console.log("[ElizaConfigProvider] Raw config:", JSON.stringify(cfg));
        // Normalize: the API may return the field under different names
        const appId = cfg.privyAppId || (cfg as any).privy_app_id || (cfg as any).appId || "cmldzu68301iwl70cpcnj0xbf";
        const clientId = cfg.privyClientId || (cfg as any).privy_client_id || (cfg as any).clientId || undefined;
        const normalized: AppConfig = {
          privyAppId: appId,
          privyClientId: clientId,
          signerUrl: cfg.signerUrl || (cfg as any).signer_url || "https://sign.elizabao.xyz/sign",
          gammaApiUrl: cfg.gammaApiUrl || (cfg as any).gamma_api_url || "https://gamma-api.polymarket.com",
          // FORCE proxy — config API currently returns clob.polymarket.com which gets CORS-blocked in browser
          clobApiUrl: "https://api.elizabao.xyz",
          dataApiUrl: cfg.dataApiUrl || (cfg as any).data_api_url || "https://data-api.polymarket.com",
        };
        console.log("[ElizaConfigProvider] Using privyAppId:", normalized.privyAppId);
        setConfig(normalized);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[ElizaConfigProvider] Config fetch failed:", err);
        setConfig({
          privyAppId: "cmldzu68301iwl70cpcnj0xbf",
          signerUrl: "https://sign.elizabao.xyz/sign",
          gammaApiUrl: "https://gamma-api.polymarket.com",
          clobApiUrl: "https://api.elizabao.xyz",
          dataApiUrl: "https://data-api.polymarket.com",
        });
        setError(err instanceof Error ? err.message : "Config fetch failed");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading ElizaBAO...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Failed to load configuration</p>
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={{ config, loading, error }}>
      <PrivyProvider
        appId={config.privyAppId}
        {...(config.privyClientId ? { clientId: config.privyClientId } : {})}
        config={{
          loginMethods: ["email"],
          appearance: {
            theme: "dark",
            accentColor: "#f97316",
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          defaultChain: polygon,
          supportedChains: [polygon],
        }}
      >
        <TradingProvider>{children}</TradingProvider>
      </PrivyProvider>
    </ConfigContext.Provider>
  );
}
