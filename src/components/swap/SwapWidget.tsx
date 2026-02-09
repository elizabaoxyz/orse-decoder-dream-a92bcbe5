import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { execSafeTransaction, encodeApprove } from "@/lib/safe-exec";
import { ethers } from "ethers";
import { toast } from "sonner";

// ParaSwap TokenTransferProxy on Polygon
const PARASWAP_PROXY = "0x216B4B4Ba9F3e719726886d34a177484278Bfcae";
// Native USDC on Polygon
const USDC_NATIVE = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

interface SwapWidgetProps {
  nativeUsdcBalance: string;
  safeAddress: string;
  userAddress: string;
  ethProvider: any;
  switchToPolygon: () => Promise<any>;
  onSwapComplete?: () => void;
}

type SwapState = "idle" | "quoting" | "quoted" | "approving" | "swapping" | "done" | "error";

export default function SwapWidget({
  nativeUsdcBalance,
  safeAddress,
  userAddress,
  ethProvider,
  switchToPolygon,
  onSwapComplete,
}: SwapWidgetProps) {
  const [state, setState] = useState<SwapState>("idle");
  const [quote, setQuote] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const balanceFloat = parseFloat(nativeUsdcBalance);
  if (balanceFloat <= 0) return null;

  const amountRaw = Math.floor(balanceFloat * 1e6).toString(); // 6 decimals

  const handleGetQuote = async () => {
    setState("quoting");
    setErrorMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("paraswap-swap", {
        body: { action: "quote", amount: amountRaw, userAddress: safeAddress },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Quote failed");
      setQuote(data);
      setState("quoted");
    } catch (e: any) {
      setErrorMsg(e.message);
      setState("error");
    }
  };

  const handleSwap = async () => {
    if (!quote?.priceRoute || !ethProvider) return;
    setErrorMsg("");

    try {
      // Step 1: Build swap tx via ParaSwap
      setState("approving");
      const provider = await switchToPolygon();

      // Approve USDC native → ParaSwap proxy via Safe
      const approveData = encodeApprove(PARASWAP_PROXY, ethers.constants.MaxUint256);
      await execSafeTransaction(provider, safeAddress, USDC_NATIVE, "0", approveData, userAddress);
      toast.success("USDC approved for swap");

      // Step 2: Build the swap transaction
      setState("swapping");
      const { data: txData, error: buildErr } = await supabase.functions.invoke("paraswap-swap", {
        body: {
          action: "build",
          userAddress: safeAddress,
          priceRoute: quote.priceRoute,
          slippage: 1,
        },
      });
      if (buildErr || txData?.error) throw new Error(txData?.error || buildErr?.message || "Build failed");

      // Step 3: Execute swap through Safe
      await execSafeTransaction(
        provider,
        safeAddress,
        txData.to,
        txData.value || "0",
        txData.data,
        userAddress,
      );

      setState("done");
      toast.success("Swap complete! USDC.e is now in your Trading Wallet");
      onSwapComplete?.();
    } catch (e: any) {
      console.error("[Swap] Error:", e);
      setErrorMsg(e.message || "Swap failed");
      setState("error");
    }
  };

  const destAmount = quote?.destAmount
    ? (parseFloat(quote.destAmount) / 1e6).toFixed(2)
    : null;

  const isLoading = state === "quoting" || state === "approving" || state === "swapping";

  return (
    <div className="mt-2 border border-accent/30 rounded-md p-3 bg-accent/5 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-medium">
        <AlertTriangle className="w-3.5 h-3.5 text-accent-foreground" />
        <span>Native USDC detected — swap to USDC.e</span>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        You have <strong>${balanceFloat.toFixed(2)}</strong> native USDC.
        Polymarket requires <strong>USDC.e (bridged)</strong>.
      </p>

      {/* Quote preview */}
      {state === "quoted" && destAmount && (
        <div className="bg-muted/30 rounded-md p-2.5 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">You send</span>
            <span className="font-mono">${balanceFloat.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-center">
            <ArrowDownUp className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">You receive</span>
            <span className="font-mono text-primary">${destAmount} USDC.e</span>
          </div>
          <p className="text-[9px] text-muted-foreground text-center mt-1">
            via ParaSwap · 1% max slippage
          </p>
        </div>
      )}

      {/* Done state */}
      {state === "done" && (
        <div className="flex items-center gap-2 text-xs text-primary">
          <CheckCircle2 className="w-4 h-4" />
          <span>Swap complete! Refresh balances to see updated amounts.</span>
        </div>
      )}

      {/* Error state */}
      {state === "error" && errorMsg && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2 text-[10px] text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Action buttons */}
      {state !== "done" && (
        <div className="space-y-1.5">
          {(state === "idle" || state === "error") && (
            <Button
              variant="terminal-primary"
              size="sm"
              className="w-full h-8 text-[11px] gap-1.5"
              onClick={handleGetQuote}
            >
              <ArrowDownUp className="w-3 h-3" />
              Get Swap Quote
            </Button>
          )}

          {state === "quoted" && (
            <Button
              variant="terminal-primary"
              size="sm"
              className="w-full h-8 text-[11px] gap-1.5"
              onClick={handleSwap}
            >
              <ArrowDownUp className="w-3 h-3" />
              Swap USDC → USDC.e
            </Button>
          )}

          {isLoading && (
            <Button variant="terminal-primary" size="sm" className="w-full h-8 text-[11px] gap-1.5" disabled>
              <Loader2 className="w-3 h-3 animate-spin" />
              {state === "quoting" && "Getting quote…"}
              {state === "approving" && "Approving USDC (signing in wallet)…"}
              {state === "swapping" && "Executing swap (signing in wallet)…"}
            </Button>
          )}
        </div>
      )}

      {/* Info toggle */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="text-[10px] text-primary hover:underline w-full text-left flex items-center gap-1"
      >
        <Info className="w-3 h-3" />
        {showInfo ? "Hide details" : "How does this work?"}
      </button>

      {showInfo && (
        <div className="text-[10px] text-muted-foreground space-y-1.5 border-t border-border/50 pt-2">
          <p>
            This executes a swap through your <strong>Trading Wallet (Safe)</strong> using ParaSwap.
            Your Personal Wallet signs the transaction, and the swap happens inside the Safe.
          </p>
          <p>
            <strong>Gas:</strong> Your Personal Wallet (EOA) pays gas in POL.
            Make sure it has enough POL for 2 transactions (approve + swap).
          </p>
          <p className="bg-muted/30 rounded p-1.5">
            💡 Next time, send <strong>USDC.e</strong> directly to avoid swapping.
            Contract: <code className="text-[9px] font-mono text-primary select-all">0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174</code>
          </p>
        </div>
      )}
    </div>
  );
}
