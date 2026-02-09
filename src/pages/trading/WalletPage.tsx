import { useState, useEffect, useCallback } from "react";
import { useTrading, useAppConfig } from "@/contexts/ElizaConfigProvider";
import {
  createOrDeriveClobCredentials,
  deploySafeWallet,
  generateL2Headers,
} from "@/lib/polymarket-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Wallet,
  Shield,
  Key,
  Copy,
  Check,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

export default function WalletPage() {
  const {
    isAuthenticated,
    privyReady,
    walletsReady,
    login,
    userAddress,
    accessToken,
    refreshToken,
    walletClient,
    ethProvider,
    switchToPolygon,
    walletReady,
    safeAddress,
    setSafeAddress,
    clobCredentials,
    setClobCredentials,
    walletCreateError,
    retryCreateWallet,
    walletsCount,
    privyUserId,
  } = useTrading();

  const [deploying, setDeploying] = useState(false);
  const [initializingCreds, setInitializingCreds] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { config, error: configError } = useAppConfig();

  // Balance / Allowance state
  const [balanceData, setBalanceData] = useState<{ balance: string; allowance: string } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const USDC_CONTRACT = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  const clobApiUrl = config?.clobApiUrl || "https://api.elizabao.xyz";

  const fetchBalanceAllowance = useCallback(async () => {
    if (!clobCredentials || !userAddress) return;
    const polyAddress = safeAddress || userAddress;
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const path = "/balance-allowance?asset_type=0";
      const headers = await generateL2Headers(clobCredentials, polyAddress, "GET", path);
      console.log("[Balance] POLY-ADDRESS:", polyAddress, "path:", path, "apiKey:", clobCredentials.apiKey.slice(0, 8));
      const res = await fetch(`${clobApiUrl}${path}`, { method: "GET", headers });
      const text = await res.text();
      console.log("[Balance] Response:", res.status, text);
      let json: any;
      try { json = JSON.parse(text); } catch { json = { error: text }; }
      if (!res.ok || json.error) {
        setBalanceError(json.error || `HTTP ${res.status}: ${text}`);
      } else {
        setBalanceData({
          balance: json.balance ?? "0",
          allowance: json.allowance ?? "0",
        });
      }
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setBalanceLoading(false);
    }
  }, [clobCredentials, userAddress, safeAddress, clobApiUrl]);

  // Auto-fetch when credentials are ready
  useEffect(() => {
    if (clobCredentials && userAddress) {
      fetchBalanceAllowance();
    }
  }, [clobCredentials, userAddress, fetchBalanceAllowance]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${label} copied`);
  };

  const getBlockingReason = (): string | null => {
    if (!privyReady) return "Waiting for Privy SDK…";
    if (!isAuthenticated) return "Please login first";
    if (!walletsReady) return "Waiting for wallets…";
    if (!userAddress) return "No embedded wallet found — creating one…";
    return null;
  };

  const handleDeploySafe = async () => {
    const blockReason = getBlockingReason();
    if (blockReason) {
      toast.error(blockReason);
      return;
    }

    if (!ethProvider) {
      toast.error("Wallet provider not ready");
      return;
    }

    // Token may not be populated yet — try refreshing it
    let token = accessToken;
    if (!token) {
      token = await refreshToken();
    }
    if (!token) {
      toast.error("Could not get access token. Please try logging in again.");
      return;
    }

    setDeploying(true);
    try {
      // Force switch to Polygon and get fresh provider
      console.log("[WalletPage] Switching to Polygon before deploy...");
      const freshProvider = await switchToPolygon();
      
      const result = await deploySafeWallet(
        token,
        userAddress!,
        freshProvider,
        config?.signerUrl
      );
      if (result.success && result.proxyAddress) {
        setSafeAddress(result.proxyAddress);
        toast.success("Safe wallet deployed!");
      } else {
        toast.error(result.error || "Failed to deploy Safe");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setDeploying(false);
    }
  };

  const handleInitCreds = async () => {
    if (!walletClient || !userAddress) {
      toast.error("Wallet not ready");
      return;
    }

    setInitializingCreds(true);
    try {
      const creds = await createOrDeriveClobCredentials(walletClient, userAddress, config?.clobApiUrl || "https://api.elizabao.xyz");
      setClobCredentials(creds);
      toast.success("Trading credentials initialized!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to initialize credentials"
      );
    } finally {
      setInitializingCreds(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6">
          Login with your email to get started with gasless trading on
          Polymarket.
        </p>
        <Button onClick={login} size="lg">
          Login with Email
        </Button>
      </div>
    );
  }



  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      {/* Debug Panel */}
      <div className="border border-yellow-500/50 rounded-lg p-3 bg-yellow-500/10 text-xs font-mono space-y-1">
        <p className="font-bold text-yellow-400 mb-2">🔍 Debug Panel</p>
        <p>privyReady: <span className={privyReady ? "text-green-400" : "text-red-400"}>{String(privyReady)}</span></p>
        <p>authenticated: <span className={isAuthenticated ? "text-green-400" : "text-red-400"}>{String(isAuthenticated)}</span></p>
        <p>walletsReady: <span className={walletsReady ? "text-green-400" : "text-red-400"}>{String(walletsReady)}</span></p>
        <p>wallets.length: <span className="text-blue-400">{walletsCount}</span></p>
        <p>userAddress: <span className="text-blue-400">{userAddress ?? "null"}</span></p>
        <p>user.id: <span className="text-blue-400">{privyUserId ?? "null"}</span></p>
        {walletCreateError && (
          <div className="mt-2">
            <p className="text-red-400 font-bold">❌ walletCreateError:</p>
            <p className="text-red-300 break-all">{walletCreateError}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={retryCreateWallet}>
              Retry Create Wallet
            </Button>
          </div>
        )}
      </div>

      {/* Status Banner */}
      <div className="border border-border rounded-lg p-3 bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <StatusChip label="Config" ok={!!config && !configError} />
        <StatusChip label="Privy" ok={isAuthenticated} />
        <StatusChip label="Safe" ok={!!safeAddress} />
        <StatusChip label="CLOB Creds" ok={!!clobCredentials} />
      </div>

      {/* Auth Status */}
      <Section
        title="Authentication"
        icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
      >
        <StatusRow label="Privy Login" ok={true} />
        <StatusRow label="Embedded Wallet" ok={walletReady} />
        {userAddress && (
          <AddressRow
            label="EOA Address"
            address={userAddress}
            onCopy={() => copyToClipboard(userAddress, "EOA")}
            copied={copied === "EOA"}
          />
        )}
        <StatusRow
          label="Access Token"
          ok={!!accessToken}
          detail={accessToken ? "Active" : "Missing — try refreshing"}
        />
      </Section>

      {/* Safe Wallet */}
      <Section
        title="Safe Wallet (Gasless)"
        icon={<Shield className="w-4 h-4 text-primary" />}
      >
        <StatusRow
          label="Safe Deployed"
          ok={!!safeAddress}
          detail={safeAddress ? undefined : "Deploy a Safe to trade gaslessly"}
        />
        {safeAddress && (
          <AddressRow
            label="Safe Address"
            address={safeAddress}
            onCopy={() => copyToClipboard(safeAddress, "Safe")}
            copied={copied === "Safe"}
          />
        )}
        {!safeAddress && (
          <>
            {getBlockingReason() && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {getBlockingReason()}
              </p>
            )}
            <Button
              onClick={handleDeploySafe}
              disabled={deploying || !!getBlockingReason()}
              className="w-full mt-3"
            >
              {deploying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Deploy Safe Wallet
            </Button>
          </>
        )}
      </Section>

      {/* Trading Credentials */}
      <Section
        title="Trading Credentials"
        icon={<Key className="w-4 h-4 text-primary" />}
      >
        <StatusRow
          label="CLOB API Key"
          ok={!!clobCredentials}
          detail={
            clobCredentials
              ? `Key: ${clobCredentials.apiKey.slice(0, 8)}...`
              : "Not initialized"
          }
        />
        <StatusRow
          label="Signature Type"
          ok={!!safeAddress}
          detail={safeAddress ? "GNOSIS_SAFE (2)" : "EOA (0) — deploy Safe first"}
        />

        <Button
          onClick={handleInitCreds}
          disabled={initializingCreds || !walletReady}
          variant={clobCredentials ? "outline" : "default"}
          className="w-full mt-3"
        >
          {initializingCreds && (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          )}
          {clobCredentials
            ? "Re-derive Credentials"
            : "Initialize Trading Credentials"}
        </Button>

        {clobCredentials && (
          <p className="text-xs text-muted-foreground mt-2">
            Credentials stored locally. They persist across sessions.
          </p>
        )}
      </Section>

      {/* Balance / Allowance */}
      {clobCredentials && (
        <Section
          title="Balance / Allowance"
          icon={<DollarSign className="w-4 h-4 text-primary" />}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">CLOB Collateral (USDC)</span>
            <Button variant="ghost" size="sm" onClick={fetchBalanceAllowance} disabled={balanceLoading} className="h-6 px-2">
              {balanceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </Button>
          </div>

          {balanceError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2.5 text-xs text-destructive mb-2">
              {balanceError}
              {safeAddress && (
                <p className="mt-1.5 font-mono text-[10px] opacity-80">
                  Deposit USDC ({USDC_CONTRACT.slice(0, 6)}…) to {safeAddress}
                </p>
              )}
            </div>
          )}

          {balanceData && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-mono">{parseFloat(balanceData.balance).toFixed(2)} USDC</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Allowance</span>
                <span className="font-mono">{parseFloat(balanceData.allowance).toFixed(2)} USDC</span>
              </div>
            </div>
          )}

          <div className="mt-2 space-y-1 text-[10px] text-muted-foreground/70">
            <div className="flex justify-between">
              <span>Proxy/Maker</span>
              <span className="font-mono">{(safeAddress || userAddress || "—").slice(0, 10)}…</span>
            </div>
            <div className="flex justify-between">
              <span>Signer</span>
              <span className="font-mono">{(userAddress || "—").slice(0, 10)}…</span>
            </div>
            <div className="flex justify-between">
              <span>USDC Token</span>
              <span className="font-mono">{USDC_CONTRACT.slice(0, 10)}…</span>
            </div>
          </div>
        </Section>
      )}

      {/* Trading Readiness Summary */}
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <h3 className="text-sm font-medium mb-3">Trading Readiness</h3>
        <div className="space-y-1.5">
          <ReadinessItem label="Logged in" ready={isAuthenticated} />
          <ReadinessItem label="Wallet ready" ready={walletReady} />
          <ReadinessItem label="Safe deployed" ready={!!safeAddress} />
          <ReadinessItem label="CLOB credentials" ready={!!clobCredentials} />
          <ReadinessItem label="Access token" ready={!!accessToken} />
          <ReadinessItem label="CLOB Balance" ready={!!balanceData && parseFloat(balanceData.balance) > 0} />
        </div>
        {isAuthenticated && walletReady && safeAddress && clobCredentials && accessToken && (
          <Badge className="mt-3 bg-green-500/10 text-green-500 border-green-500/20">
            ✅ Ready to Trade
          </Badge>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card/50">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {detail && (
          <span className="text-xs text-muted-foreground/80">{detail}</span>
        )}
        {ok ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground/40" />
        )}
      </div>
    </div>
  );
}

function AddressRow({
  label,
  address,
  onCopy,
  copied,
}: {
  label: string;
  address: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded">
          {address.slice(0, 6)}...{address.slice(-4)}
        </code>
        <button onClick={onCopy} className="text-muted-foreground hover:text-foreground">
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function ReadinessItem({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ready ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-muted-foreground/40" />
      )}
      <span className={ready ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

function StatusChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-muted-foreground/40" />
      )}
      <span className="text-muted-foreground">{label}</span>
      <span>{ok ? "✅" : "❌"}</span>
    </div>
  );
}
