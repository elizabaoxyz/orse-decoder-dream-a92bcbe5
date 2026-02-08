import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
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
  userAddress: `0x${string}` | null;
  accessToken: string | null;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<string | null>;

  // Wallet
  walletClient: WalletClient | null;
  walletReady: boolean;

  // Safe wallet
  safeAddress: string | null;
  setSafeAddress: (addr: string | null) => void;

  // CLOB credentials
  clobCredentials: ClobCredentials | null;
  setClobCredentials: (creds: ClobCredentials | null) => void;
}

const TradingContext = createContext<TradingContextValue>({
  isAuthenticated: false,
  userAddress: null,
  accessToken: null,
  login: () => {},
  logout: () => {},
  refreshToken: async () => null,
  walletClient: null,
  walletReady: false,
  safeAddress: null,
  setSafeAddress: () => {},
  clobCredentials: null,
  setClobCredentials: () => {},
});

export const useTrading = () => useContext(TradingContext);

// =============================================================================
// Trading Provider (sits inside PrivyProvider)
// =============================================================================

function TradingProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, authenticated, getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [walletReady, setWalletReady] = useState(false);
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null);

  // Safe address from localStorage
  const [safeAddress, setSafeAddressState] = useState<string | null>(() => {
    try {
      return localStorage.getItem("elizabao_safe_address");
    } catch {
      return null;
    }
  });

  // CLOB credentials from localStorage
  const [clobCredentials, setClobCredentialsState] = useState<ClobCredentials | null>(() => {
    try {
      const stored = localStorage.getItem("elizabao_clob_creds");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setSafeAddress = useCallback((addr: string | null) => {
    setSafeAddressState(addr);
    if (addr) {
      localStorage.setItem("elizabao_safe_address", addr);
    } else {
      localStorage.removeItem("elizabao_safe_address");
    }
  }, []);

  const setClobCredentials = useCallback((creds: ClobCredentials | null) => {
    setClobCredentialsState(creds);
    if (creds) {
      localStorage.setItem("elizabao_clob_creds", JSON.stringify(creds));
    } else {
      localStorage.removeItem("elizabao_clob_creds");
    }
  }, []);

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

  return (
    <TradingContext.Provider
      value={{
        isAuthenticated: authenticated,
        userAddress,
        accessToken,
        login,
        logout,
        refreshToken,
        walletClient,
        walletReady,
        safeAddress,
        setSafeAddress,
        clobCredentials,
        setClobCredentials,
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
        const normalized: AppConfig = {
          privyAppId: appId,
          signerUrl: cfg.signerUrl || (cfg as any).signer_url || "https://sign.elizabao.xyz/sign",
          gammaApiUrl: cfg.gammaApiUrl || (cfg as any).gamma_api_url || "https://gamma-api.polymarket.com",
          clobApiUrl: cfg.clobApiUrl || (cfg as any).clob_api_url || "https://clob.polymarket.com",
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
          clobApiUrl: "https://clob.polymarket.com",
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
