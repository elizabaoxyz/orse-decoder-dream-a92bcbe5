import { useState, useEffect, useCallback } from "react";
import { useTrading, useAppConfig } from "@/contexts/ElizaConfigProvider";
import {
  createOrDeriveClobCredentials,
  resetClobCredentials,
  deploySafeWallet,
  generateL2Headers,
} from "@/lib/polymarket-client";
import { useOnChainBalances } from "@/hooks/useOnChainBalances";
import { supabase } from "@/integrations/supabase/client";
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
  ArrowDown,
  Coins,
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
  const [resettingCreds, setResettingCreds] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { config, error: configError } = useAppConfig();

  // On-chain balances
  const { eoaBalances, safeBalances, loading: onChainLoading, error: onChainError, fetchBalances } = useOnChainBalances();

  // Balance / Allowance state (CLOB)
  const [balanceData, setBalanceData] = useState<{ balance: string; allowance: string } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const USDC_CONTRACT = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  const clobApiUrl = config?.clobApiUrl || "https://api.elizabao.xyz";

  const fetchBalanceAllowance = useCallback(async () => {
    if (!clobCredentials || !userAddress) return;
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      // Send raw creds to edge function — HMAC is computed server-side
      const { data, error } = await supabase.functions.invoke("clob-balance", {
        body: {
          apiKey: clobCredentials.apiKey,
          secret: clobCredentials.secret,
          passphrase: clobCredentials.passphrase,
          address: userAddress,
          asset_type: "0",
        },
      });

      console.log("[Balance] Edge function response:", data);

      if (error) {
        setBalanceError(error.message);
      } else if (data?.error) {
        setBalanceError(data.error);
      } else {
        setBalanceData({
          balance: data?.balance ?? "0",
          allowance: data?.allowance ?? "0",
        });
      }
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setBalanceLoading(false);
    }
  }, [clobCredentials, userAddress, clobApiUrl]);

  // Auto-fetch when credentials are ready
  useEffect(() => {
    if (clobCredentials && userAddress) {
      fetchBalanceAllowance();
    }
  }, [clobCredentials, userAddress, fetchBalanceAllowance]);

  // Auto-fetch on-chain balances
  useEffect(() => {
    if (userAddress) {
      fetchBalances(userAddress, safeAddress || undefined);
    }
  }, [userAddress, safeAddress, fetchBalances]);

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
              ? `Key: …${clobCredentials.apiKey.slice(-6)}`
              : "Not initialized"
          }
        />
        <StatusRow
          label="Signature Type"
          ok={!!safeAddress}
          detail={safeAddress ? "GNOSIS_SAFE (2)" : "EOA (0) — deploy Safe first"}
        />

        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleInitCreds}
            disabled={initializingCreds || resettingCreds || !walletReady}
            variant={clobCredentials ? "outline" : "default"}
            className="flex-1"
          >
            {initializingCreds && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            {clobCredentials
              ? "Re-derive Credentials"
              : "Initialize Trading Credentials"}
          </Button>

          {clobCredentials && (
            <Button
              onClick={async () => {
                if (!walletClient || !userAddress) {
                  toast.error("Wallet not ready");
                  return;
                }
                setResettingCreds(true);
                try {
                  const creds = await resetClobCredentials(
                    walletClient,
                    userAddress,
                    config?.clobApiUrl || "https://api.elizabao.xyz"
                  );
                  setClobCredentials(creds);
                  toast.success(`CLOB creds reset! Key: …${creds.apiKey.slice(-6)}`);
                  // Auto-refresh balance with new creds
                  setTimeout(() => fetchBalanceAllowance(), 500);
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "Reset failed"
                  );
                } finally {
                  setResettingCreds(false);
                }
              }}
              disabled={resettingCreds || initializingCreds || !walletReady}
              variant="destructive"
              size="default"
            >
              {resettingCreds && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Reset CLOB API Creds
            </Button>
          )}
        </div>

        {clobCredentials && (
          <p className="text-xs text-muted-foreground mt-2">
            Signer: {userAddress?.slice(0, 10)}… · Key: …{clobCredentials.apiKey.slice(-6)} · Stored locally.
          </p>
        )}
      </Section>

      {/* On-Chain Balances */}
      {(userAddress || safeAddress) && (
        <Section
          title="On-Chain Balances"
          icon={<Coins className="w-4 h-4 text-primary" />}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Polygon Network</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchBalances(userAddress || undefined, safeAddress || undefined)}
              disabled={onChainLoading}
              className="h-6 px-2"
            >
              {onChainLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </Button>
          </div>

          {onChainError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2.5 text-xs text-destructive mb-2">
              {onChainError}
            </div>
          )}

          {/* EOA Wallet */}
          {eoaBalances && userAddress && (
            <div className="space-y-1 mb-3">
              <p className="text-xs font-medium text-muted-foreground">Embedded Wallet (EOA)</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">USDC</span>
                <span className="font-mono">{parseFloat(eoaBalances.usdc).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">POL</span>
                <span className="font-mono">{parseFloat(eoaBalances.pol).toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Safe Wallet */}
          {safeBalances && safeAddress && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Trading Wallet (Safe)</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">USDC</span>
                <span className={`font-mono ${parseFloat(safeBalances.usdc) > 0 ? "text-green-500" : ""}`}>
                  {parseFloat(safeBalances.usdc).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">POL</span>
                <span className="font-mono">{parseFloat(safeBalances.pol).toFixed(4)}</span>
              </div>
            </div>
          )}

          {safeAddress && (
            <div className="mt-3 p-2.5 bg-muted/30 rounded-md">
              <p className="text-[10px] text-muted-foreground mb-1">
                <ArrowDown className="w-3 h-3 inline mr-1" />
                Deposit USDC to your Trading Wallet:
              </p>
              <code className="text-[10px] font-mono text-foreground break-all select-all">
                {safeAddress}
              </code>
            </div>
          )}
        </Section>
      )}

      {/* CLOB Balance / Allowance */}
      {clobCredentials && (
        <Section
          title="Exchange Balance"
          icon={<DollarSign className="w-4 h-4 text-primary" />}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Polymarket CLOB (deposited USDC)</span>
            <Button variant="ghost" size="sm" onClick={fetchBalanceAllowance} disabled={balanceLoading} className="h-6 px-2">
              {balanceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </Button>
          </div>

          {balanceError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2.5 text-xs text-destructive mb-2">
              {balanceError}
            </div>
          )}

          {balanceData && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deposited Balance</span>
                <span className="font-mono">{parseFloat(balanceData.balance).toFixed(2)} USDC</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Allowance</span>
                <span className="font-mono">{parseFloat(balanceData.allowance).toFixed(2)} USDC</span>
              </div>
            </div>
          )}

          {safeBalances && safeAddress && parseFloat(safeBalances.usdc) > 0 && balanceData && parseFloat(balanceData.balance) === 0 && (
            <div className="mt-3 p-2.5 bg-accent/10 border border-accent/20 rounded-md">
              <p className="text-xs text-accent-foreground">
                ⚠️ You have <strong>{parseFloat(safeBalances.usdc).toFixed(2)} USDC</strong> in your Safe wallet but it hasn't been deposited into the Polymarket exchange yet. You need to approve & deposit via the Polymarket interface to trade.
              </p>
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
          <ReadinessItem label="USDC in Safe" ready={!!safeBalances && parseFloat(safeBalances.usdc) > 0} />
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
