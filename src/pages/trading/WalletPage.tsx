import { useState } from "react";
import { useTrading } from "@/contexts/ElizaConfigProvider";
import {
  createOrDeriveClobCredentials,
  deploySafeWallet,
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
} from "lucide-react";
import { toast } from "sonner";

export default function WalletPage() {
  const {
    isAuthenticated,
    login,
    userAddress,
    accessToken,
    refreshToken,
    walletClient,
    walletReady,
    safeAddress,
    setSafeAddress,
    clobCredentials,
    setClobCredentials,
  } = useTrading();

  const [deploying, setDeploying] = useState(false);
  const [initializingCreds, setInitializingCreds] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${label} copied`);
  };

  const handleDeploySafe = async () => {
    if (!accessToken || !userAddress) {
      toast.error("Please login first");
      return;
    }

    setDeploying(true);
    try {
      // Refresh token to ensure it's fresh
      const token = await refreshToken();
      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const result = await deploySafeWallet(token, userAddress);
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
      const creds = await createOrDeriveClobCredentials(walletClient, userAddress);
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
          <Button
            onClick={handleDeploySafe}
            disabled={deploying || !accessToken}
            className="w-full mt-3"
          >
            {deploying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Deploy Safe Wallet
          </Button>
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

      {/* Trading Readiness Summary */}
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <h3 className="text-sm font-medium mb-3">Trading Readiness</h3>
        <div className="space-y-1.5">
          <ReadinessItem label="Logged in" ready={isAuthenticated} />
          <ReadinessItem label="Wallet ready" ready={walletReady} />
          <ReadinessItem label="Safe deployed" ready={!!safeAddress} />
          <ReadinessItem label="CLOB credentials" ready={!!clobCredentials} />
          <ReadinessItem label="Access token" ready={!!accessToken} />
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
