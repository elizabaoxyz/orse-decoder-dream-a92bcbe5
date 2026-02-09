import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, AlertTriangle, ExternalLink, Info } from "lucide-react";

interface SwapWidgetProps {
  /** Amount of native USDC available (human-readable, e.g. "10.50") */
  nativeUsdcBalance: string;
  /** The Safe wallet address where native USDC is held */
  safeAddress: string;
  /** User's EOA address */
  userAddress: string;
}

export default function SwapWidget({
  nativeUsdcBalance,
  safeAddress,
  userAddress,
}: SwapWidgetProps) {
  const [showDetails, setShowDetails] = useState(false);
  const balanceFloat = parseFloat(nativeUsdcBalance);

  if (balanceFloat <= 0) return null;

  // QuickSwap URL pre-filled with USDC native → USDC.e pair
  const quickswapUrl = `https://quickswap.exchange/#/swap?inputCurrency=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359&outputCurrency=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`;

  // Safe app URL for the user's Safe on Polygon
  const safeAppUrl = `https://app.safe.global/home?safe=matic:${safeAddress}`;

  return (
    <div className="mt-2 border border-accent/30 rounded-md p-3 bg-accent/5 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-medium">
        <AlertTriangle className="w-3.5 h-3.5 text-accent-foreground" />
        <span>Native USDC detected — needs swap to USDC.e</span>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        You have <strong>${balanceFloat.toFixed(2)}</strong> native USDC in your Trading Wallet.
        Polymarket requires <strong>USDC.e (bridged)</strong>. You need to swap it.
      </p>

      {/* Primary action: Safe App swap */}
      <div className="space-y-1.5">
        <a href={safeAppUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="terminal-primary" size="sm" className="w-full h-8 text-[11px] gap-1.5">
            <ArrowDownUp className="w-3 h-3" />
            Open Safe App to Swap
            <ExternalLink className="w-3 h-3" />
          </Button>
        </a>
        <p className="text-[9px] text-muted-foreground text-center">
          Use the Safe Wallet app → Swap feature to convert USDC → USDC.e
        </p>
      </div>

      {/* Toggle details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-[10px] text-primary hover:underline w-full text-left flex items-center gap-1"
      >
        <Info className="w-3 h-3" />
        {showDetails ? "Hide details" : "Why can't I swap in-app?"}
      </button>

      {showDetails && (
        <div className="text-[10px] text-muted-foreground space-y-2 border-t border-border/50 pt-2">
          <p>
            Your USDC is inside a <strong>Safe (multi-sig) wallet</strong>. In-app swaps can only
            execute from your Personal Wallet (EOA), which doesn't hold this USDC.
          </p>
          <p className="font-medium">Options to swap:</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>
              <strong>Safe App (recommended)</strong> — Open your Safe on{" "}
              <a href={safeAppUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                app.safe.global
              </a>{" "}
              and use the built-in swap feature
            </li>
            <li>
              <strong>QuickSwap</strong> — If you transfer USDC to your Personal Wallet first, you can swap on{" "}
              <a href={quickswapUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                QuickSwap
              </a>
            </li>
          </ol>
          <div className="bg-muted/30 rounded p-2 mt-1">
            <p className="font-medium mb-1">💡 Next time:</p>
            <p>
              Send <strong>USDC.e (bridged)</strong> directly to your Trading Wallet to avoid this.
              USDC.e contract: <code className="text-[9px] font-mono text-primary break-all select-all">0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
