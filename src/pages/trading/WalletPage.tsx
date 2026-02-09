import { useState, useEffect, useCallback } from "react";
import { useTrading, useAppConfig } from "@/contexts/ElizaConfigProvider";
import {
  createOrDeriveClobCredentials,
  resetClobCredentials,
  deploySafeWallet,
} from "@/lib/polymarket-client";
import { useOnChainBalances } from "@/hooks/useOnChainBalances";
import { useTokenApprovals } from "@/hooks/useTokenApprovals";
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
  ArrowRight,
  Coins,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import SwapWidget from "@/components/swap/SwapWidget";

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
  const [showDebug, setShowDebug] = useState(false);
  const { config, error: configError } = useAppConfig();

  const { eoaBalances, safeBalances, loading: onChainLoading, error: onChainError, fetchBalances } = useOnChainBalances();
  const { approvalStatus, checking: approvalsChecking, approving, error: approvalError, checkApprovals, approveAll } = useTokenApprovals();

  const [balanceData, setBalanceData] = useState<{ balance: string; allowance: string } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const clobApiUrl = config?.clobApiUrl || "https://api.elizabao.xyz";

  const fetchBalanceAllowance = useCallback(async () => {
    if (!clobCredentials || !userAddress) return;
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const { data, error } = await supabase.functions.invoke("clob-balance", {
        body: {
          apiKey: clobCredentials.apiKey,
          secret: clobCredentials.secret,
          passphrase: clobCredentials.passphrase,
          address: userAddress,
          asset_type: "0",
        },
      });
      if (error) setBalanceError(error.message);
      else if (data?.error) setBalanceError(data.error);
      else setBalanceData({ balance: data?.balance ?? "0", allowance: data?.allowance ?? "0" });
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setBalanceLoading(false);
    }
  }, [clobCredentials, userAddress, clobApiUrl]);

  useEffect(() => {
    if (clobCredentials && userAddress) fetchBalanceAllowance();
  }, [clobCredentials, userAddress, fetchBalanceAllowance]);

  useEffect(() => {
    if (userAddress) fetchBalances(userAddress, safeAddress || undefined);
  }, [userAddress, safeAddress, fetchBalances]);

  useEffect(() => {
    if (safeAddress) checkApprovals(safeAddress);
  }, [safeAddress, checkApprovals]);

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
    if (blockReason) { toast.error(blockReason); return; }
    if (!ethProvider) { toast.error("Wallet provider not ready"); return; }
    let token = accessToken;
    if (!token) token = await refreshToken();
    if (!token) { toast.error("Could not get access token. Please try logging in again."); return; }
    setDeploying(true);
    try {
      const freshProvider = await switchToPolygon();
      const result = await deploySafeWallet(token, userAddress!, freshProvider, config?.signerUrl);
      if (result.success && result.proxyAddress) {
        setSafeAddress(result.proxyAddress);
        toast.success("Trading wallet deployed!");
      } else toast.error(result.error || "Failed to deploy");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deployment failed");
    } finally { setDeploying(false); }
  };

  const handleInitCreds = async () => {
    if (!walletClient || !userAddress) { toast.error("Wallet not ready"); return; }
    setInitializingCreds(true);
    try {
      // For Safe wallets, create credentials associated with the Safe (funder) address
      const funder = safeAddress ? safeAddress as `0x${string}` : undefined;
      const creds = await createOrDeriveClobCredentials(walletClient, userAddress, clobApiUrl, funder);
      setClobCredentials(creds);
      toast.success("Trading credentials initialized!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initialize credentials");
    } finally { setInitializingCreds(false); }
  };

  // Compute total portfolio value
  const eoaUsdcTotal = eoaBalances ? parseFloat(eoaBalances.usdcTotal) : 0;
  const safeUsdcTotal = safeBalances ? parseFloat(safeBalances.usdcTotal) : 0;
  const exchangeBalance = balanceData ? parseFloat(balanceData.balance) : 0;
  const totalPortfolio = eoaUsdcTotal + safeUsdcTotal + exchangeBalance;

  // Setup progress
  const setupSteps = [
    { label: "Login", done: isAuthenticated },
    { label: "Wallet", done: walletReady },
    { label: "Trading Wallet", done: !!safeAddress },
    { label: "API Keys", done: !!clobCredentials },
    { label: "Approvals", done: !!approvalStatus?.allApproved },
  ];
  const completedSteps = setupSteps.filter((s) => s.done).length;
  const allSetupDone = completedSteps === setupSteps.length;

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6">
          Login with your email to get started with gasless trading on Polymarket.
        </p>
        <Button onClick={login} size="lg">Login with Email</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Portfolio Header ── */}
      <div className="border border-border rounded-lg p-5 bg-card/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Total Portfolio</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchBalances(userAddress || undefined, safeAddress || undefined);
              if (clobCredentials) fetchBalanceAllowance();
            }}
            disabled={onChainLoading || balanceLoading}
            className="h-7 px-2 gap-1"
          >
            {(onChainLoading || balanceLoading) ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            <span className="text-[10px]">Refresh</span>
          </Button>
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight">
          ${totalPortfolio.toFixed(2)}
        </div>
        <span className="text-xs text-muted-foreground">Polygon Network · USDC</span>
      </div>

      {/* ── Setup Progress ── */}
      {!allSetupDone && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-widest font-mono">Account Setup</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {completedSteps}/{setupSteps.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1 mb-4">
            {setupSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border ${
                  step.done
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground"
                }`}>
                  {step.done ? "✓" : i + 1}
                </div>
                {i < setupSteps.length - 1 && (
                  <div className={`w-4 h-px ${step.done ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Next action */}
          {!walletReady && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Setting up your embedded wallet…
            </p>
          )}
          {walletReady && !safeAddress && (
            <Button onClick={handleDeploySafe} disabled={deploying || !!getBlockingReason()} className="w-full" size="sm">
              {deploying && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Deploy Trading Wallet
            </Button>
          )}
          {safeAddress && !clobCredentials && (
            <Button onClick={handleInitCreds} disabled={initializingCreds || !walletReady} className="w-full" size="sm">
              {initializingCreds && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Initialize Trading API Keys
            </Button>
          )}
          {safeAddress && clobCredentials && !approvalStatus?.allApproved && (
            <Button
              onClick={async () => {
                if (!ethProvider) { toast.error("Wallet provider not ready"); return; }
                let token = accessToken;
                if (!token) token = await refreshToken();
                if (!token) { toast.error("Could not get access token"); return; }
                const freshProvider = await switchToPolygon();
                const result = await approveAll(freshProvider, userAddress!, token, config?.signerUrl, approvalStatus!);
                if (result.success) {
                  toast.success("Token approvals set!");
                  checkApprovals(safeAddress);
                } else toast.error(result.message || "Approval failed");
              }}
              disabled={approving || approvalsChecking || !ethProvider}
              className="w-full"
              size="sm"
            >
              {(approving || approvalsChecking) && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Approve Token Contracts
            </Button>
          )}
        </div>
      )}

      {/* ── Wallet Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Personal Wallet (EOA) */}
        <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-widest font-mono">Personal Wallet</span>
            </div>
            {walletReady && <Badge variant="outline" className="text-[9px] font-mono">EOA</Badge>}
          </div>

          {userAddress && (
            <CopyableAddress
              address={userAddress}
              label="Personal"
              onCopy={() => copyToClipboard(userAddress, "Personal")}
              copied={copied === "Personal"}
            />
          )}

          {eoaBalances && (
            <div className="space-y-1.5">
              <BalanceRow label="USDC" value={`$${eoaUsdcTotal.toFixed(2)}`} />
              <BalanceRow label="POL (gas)" value={`${parseFloat(eoaBalances.pol).toFixed(4)}`} muted />
              {parseFloat(eoaBalances.pol) < 0.01 && (
                <div className="flex items-start gap-1.5 text-[10px] text-destructive">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>Low POL — send POL to this address for gas fees</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-1 border-t border-border">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              This wallet signs transactions &amp; pays gas. Send POL here for gas.
            </p>
          </div>
        </div>

        {/* Trading Wallet (Safe) */}
        <div className={`border rounded-lg p-4 space-y-3 ${safeAddress ? "border-primary/40 bg-primary/5" : "border-border bg-card/50"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-widest font-mono">Trading Wallet</span>
            </div>
            {safeAddress && <Badge variant="outline" className="text-[9px] font-mono border-primary/40 text-primary">SAFE</Badge>}
          </div>

          {!safeAddress ? (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground mb-3">Deploy a trading wallet to start trading on Polymarket</p>
              <Button onClick={handleDeploySafe} disabled={deploying || !!getBlockingReason()} size="sm" className="w-full">
                {deploying && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Deploy Trading Wallet
              </Button>
            </div>
          ) : (
            <>
              <CopyableAddress
                address={safeAddress}
                label="Trading"
                onCopy={() => copyToClipboard(safeAddress, "Trading")}
                copied={copied === "Trading"}
              />

              {safeBalances && (
                <div className="space-y-1.5">
                  {parseFloat(safeBalances.usdcE) > 0 && (
                    <BalanceRow
                      label="USDC.e"
                      value={`$${parseFloat(safeBalances.usdcE).toFixed(2)}`}
                      badge="✅ Ready"
                      badgeVariant="success"
                    />
                  )}
                  {parseFloat(safeBalances.usdcNative) > 0 && (
                    <BalanceRow
                      label="USDC (native)"
                      value={`$${parseFloat(safeBalances.usdcNative).toFixed(2)}`}
                      badge="⚠️ Swap needed"
                      badgeVariant="warning"
                    />
                  )}
                  {safeUsdcTotal === 0 && (
                    <BalanceRow label="USDC" value="$0.00" muted />
                  )}
                  <BalanceRow label="POL" value={parseFloat(safeBalances.pol).toFixed(4)} muted />
                </div>
              )}

              {/* Inline Swap Widget */}
              {safeBalances && parseFloat(safeBalances.usdcNative) > 0 && userAddress && safeAddress && (
                <SwapWidget
                  nativeUsdcBalance={safeBalances.usdcNative}
                  safeAddress={safeAddress}
                  userAddress={userAddress}
                  ethProvider={ethProvider}
                  switchToPolygon={switchToPolygon}
                  onSwapComplete={() => fetchBalances(userAddress, safeAddress)}
                />
              )}

              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ArrowDown className="w-3 h-3" />
                  Deposit USDC.e (bridged) to trade:
                </p>
                <code className="text-[10px] font-mono text-primary break-all select-all block mt-1">
                  {safeAddress}
                </code>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Exchange Balance ── */}
      {clobCredentials && (
        <div className="border border-border rounded-lg p-4 bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-widest font-mono">Exchange Balance</span>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchBalanceAllowance} disabled={balanceLoading} className="h-6 px-2">
              {balanceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </Button>
          </div>

          {balanceError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2.5 text-xs text-destructive mb-2">
              {balanceError}
            </div>
          )}

          <div className="text-2xl font-bold font-mono mb-1">
            ${exchangeBalance.toFixed(2)}
          </div>
          <span className="text-[10px] text-muted-foreground">Deposited on Polymarket Exchange</span>

          {balanceData && (
            <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <span>Allowance</span>
              <span className="font-mono">${parseFloat(balanceData.allowance).toFixed(2)}</span>
            </div>
          )}

          {safeBalances && safeAddress && parseFloat(safeBalances.usdcE) > 0 && exchangeBalance === 0 && (
            <div className="mt-3 p-2.5 bg-primary/5 border border-primary/20 rounded-md">
              <p className="text-xs text-muted-foreground">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                You have <strong>${parseFloat(safeBalances.usdcE).toFixed(2)} USDC.e</strong> in your Trading Wallet but nothing deposited on the exchange yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Trading API ── */}
      {safeAddress && (
        <div className="border border-border rounded-lg p-4 bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-widest font-mono">Trading API</span>
            </div>
            {clobCredentials && (
              <Badge variant="outline" className="text-[9px] font-mono">
                Key: …{clobCredentials.apiKey.slice(-6)}
              </Badge>
            )}
          </div>

          {!clobCredentials ? (
            <Button onClick={handleInitCreds} disabled={initializingCreds || !walletReady} className="w-full" size="sm">
              {initializingCreds && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Initialize Trading API Keys
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button onClick={handleInitCreds} disabled={initializingCreds || resettingCreds || !walletReady} variant="outline" size="sm" className="flex-1">
                  {initializingCreds && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Re-derive
                </Button>
                <Button
                  onClick={async () => {
                    if (!walletClient || !userAddress) { toast.error("Wallet not ready"); return; }
                    setResettingCreds(true);
                    try {
                      const creds = await resetClobCredentials(walletClient, userAddress, clobApiUrl, safeAddress ? safeAddress as `0x${string}` : undefined);
                      setClobCredentials(creds);
                      toast.success("API keys reset!");
                      setTimeout(() => fetchBalanceAllowance(), 500);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Reset failed");
                    } finally { setResettingCreds(false); }
                  }}
                  disabled={resettingCreds || initializingCreds || !walletReady}
                  variant="destructive"
                  size="sm"
                >
                  {resettingCreds && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Reset Keys
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Signer: {userAddress?.slice(0, 8)}… · Stored locally
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Token Approvals ── */}
      {safeAddress && approvalStatus && (
        <div className="border border-border rounded-lg p-4 bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-widest font-mono">Contract Approvals</span>
            </div>
            <div className="flex items-center gap-1.5">
              {approvalStatus.allApproved ? (
                <Badge variant="outline" className="text-[9px] font-mono border-primary/40 text-primary">All Set</Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] font-mono">Pending</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => checkApprovals(safeAddress)} disabled={approvalsChecking} className="h-6 w-6 p-0">
                {approvalsChecking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <ApprovalRow label="USDC → CTF Contract" approved={approvalStatus.usdcToCTF} />
            <ApprovalRow label="USDC → CTF Exchange" approved={approvalStatus.usdcToExchange} />
            <ApprovalRow label="USDC → NegRisk Exchange" approved={approvalStatus.usdcToNegRiskExchange} />
            <ApprovalRow label="Tokens → CTF Exchange" approved={approvalStatus.ctfToExchange} />
            <ApprovalRow label="Tokens → NegRisk Exchange" approved={approvalStatus.ctfToNegRiskExchange} />
            <ApprovalRow label="Tokens → NegRisk Adapter" approved={approvalStatus.ctfToNegRiskAdapter} />
          </div>

          {!approvalStatus.allApproved && (
            <Button
              onClick={async () => {
                if (!ethProvider) { toast.error("Wallet provider not ready"); return; }
                let token = accessToken;
                if (!token) token = await refreshToken();
                if (!token) { toast.error("Could not get access token"); return; }
                const freshProvider = await switchToPolygon();
                const result = await approveAll(freshProvider, userAddress!, token, config?.signerUrl, approvalStatus);
                if (result.success) {
                  toast.success("Token approvals set!");
                  checkApprovals(safeAddress);
                } else toast.error(result.message || "Approval failed");
              }}
              disabled={approving || !ethProvider}
              className="w-full mt-3"
              size="sm"
            >
              {approving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Approve All Contracts
            </Button>
          )}
        </div>
      )}

      {/* ── Readiness Summary ── */}
      {allSetupDone && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Ready to Trade</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All systems are set up. You can now place orders on Polymarket.
          </p>
        </div>
      )}

      {/* ── Debug Panel (collapsible) ── */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full"
      >
        {showDebug ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Debug Info
      </button>
      {showDebug && (
        <div className="border border-border/50 rounded-lg p-3 text-[10px] font-mono text-muted-foreground/70 space-y-0.5">
          <p>privyReady: {String(privyReady)} · authenticated: {String(isAuthenticated)}</p>
          <p>walletsReady: {String(walletsReady)} · wallets: {walletsCount}</p>
          <p>EOA: {userAddress ?? "null"}</p>
          <p>Safe: {safeAddress ?? "null"}</p>
          <p>userId: {privyUserId ?? "null"}</p>
          <p>CLOB key: {clobCredentials ? `…${clobCredentials.apiKey.slice(-6)}` : "null"}</p>
          <p>accessToken: {accessToken ? "present" : "null"}</p>
          {walletCreateError && <p className="text-destructive">walletErr: {walletCreateError}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function CopyableAddress({
  address,
  label,
  onCopy,
  copied,
}: {
  address: string;
  label: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center gap-2 bg-muted/30 rounded-md px-2.5 py-1.5">
      <code className="text-[11px] font-mono text-foreground flex-1 truncate">
        {address}
      </code>
      <button onClick={onCopy} className="text-muted-foreground hover:text-foreground shrink-0">
        {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function BalanceRow({
  label,
  value,
  muted,
  badge,
  badgeVariant,
}: {
  label: string;
  value: string;
  muted?: boolean;
  badge?: string;
  badgeVariant?: "success" | "warning";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={muted ? "text-muted-foreground/60 text-xs" : "text-muted-foreground"}>{label}</span>
        {badge && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
            badgeVariant === "success"
              ? "bg-primary/10 text-primary"
              : "bg-accent/10 text-accent-foreground"
          }`}>
            {badge}
          </span>
        )}
      </div>
      <span className={`font-mono ${muted ? "text-muted-foreground/60 text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function ApprovalRow({ label, approved }: { label: string; approved: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      {approved ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-muted-foreground/40" />
      )}
    </div>
  );
}
