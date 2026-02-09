import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowDownUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SwapWidgetProps {
  /** Amount of native USDC available (human-readable, e.g. "10.50") */
  nativeUsdcBalance: string;
  /** User's EOA address */
  userAddress: string;
  /** Ethers-compatible provider from Privy */
  ethProvider: any;
  /** Callback after successful swap */
  onSwapComplete?: () => void;
}

type SwapStep = "idle" | "quoting" | "quoted" | "approving" | "swapping" | "done" | "error";

export default function SwapWidget({
  nativeUsdcBalance,
  userAddress,
  ethProvider,
  onSwapComplete,
}: SwapWidgetProps) {
  const [step, setStep] = useState<SwapStep>("idle");
  const [quote, setQuote] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balanceFloat = parseFloat(nativeUsdcBalance);
  // Convert to base units (6 decimals)
  const srcAmount = Math.floor(balanceFloat * 1e6).toString();

  const getQuote = useCallback(async () => {
    setStep("quoting");
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("paraswap-swap", {
        body: {
          action: "quote",
          amount: srcAmount,
          userAddress,
        },
      });

      if (fnError || data?.error) {
        throw new Error(data?.error || fnError?.message || "Quote failed");
      }

      setQuote(data);
      setStep("quoted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get quote");
      setStep("error");
    }
  }, [srcAmount, userAddress]);

  const executeSwap = useCallback(async () => {
    if (!quote?.priceRoute || !ethProvider) return;

    setStep("approving");
    setError(null);

    try {
      // First approve ParaSwap's TokenTransferProxy to spend native USDC
      const USDC_NATIVE = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
      const TOKEN_TRANSFER_PROXY = "0x216b4b4ba9f3e719726886d34a177484278bfcae"; // ParaSwap proxy on Polygon

      const erc20Abi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
      ];

      // Use ethProvider to get signer
      const { ethers } = await import("ethers");
      const provider = new ethers.providers.Web3Provider(ethProvider);
      const signer = provider.getSigner();

      // Check POL balance for gas
      const polBalance = await provider.getBalance(userAddress);
      if (polBalance.lt(ethers.utils.parseEther("0.01"))) {
        throw new Error(
          `Not enough POL for gas fees. You have ${parseFloat(ethers.utils.formatEther(polBalance)).toFixed(4)} POL. Send at least 0.05 POL to your EOA wallet (${userAddress.slice(0, 8)}…) to cover gas.`
        );
      }

      const usdcContract = new ethers.Contract(USDC_NATIVE, erc20Abi, signer);

      // Check current allowance
      const currentAllowance = await usdcContract.allowance(userAddress, TOKEN_TRANSFER_PROXY);
      const neededAmount = ethers.BigNumber.from(srcAmount);

      if (currentAllowance.lt(neededAmount)) {
        toast.info("Approving USDC for swap...");
        const approveTx = await usdcContract.approve(TOKEN_TRANSFER_PROXY, neededAmount);
        await approveTx.wait();
        toast.success("USDC approved!");
      }

      // Build the swap transaction
      setStep("swapping");
      toast.info("Building swap transaction...");

      const { data: txData, error: buildError } = await supabase.functions.invoke("paraswap-swap", {
        body: {
          action: "build",
          amount: srcAmount,
          userAddress,
          priceRoute: quote.priceRoute,
          slippage: 1,
        },
      });

      if (buildError || txData?.error) {
        throw new Error(txData?.error || buildError?.message || "Failed to build tx");
      }

      // Execute the swap transaction
      toast.info("Confirm the swap in your wallet...");
      const tx = await signer.sendTransaction({
        to: txData.to,
        data: txData.data,
        value: txData.value || "0",
        gasLimit: 500000,
      });

      toast.info("Swap submitted, waiting for confirmation...");
      const receipt = await tx.wait();

      setTxHash(receipt.transactionHash);
      setStep("done");
      toast.success("Swap complete! USDC → USDC.e");
      onSwapComplete?.();
    } catch (err: any) {
      console.error("[Swap] Error:", err);
      const msg = err?.message || "Swap failed";
      // User rejected
      if (msg.includes("user rejected") || msg.includes("ACTION_REJECTED")) {
        setError("Transaction rejected");
      } else {
        setError(msg);
      }
      setStep("error");
    }
  }, [quote, ethProvider, userAddress, srcAmount, onSwapComplete]);

  const reset = () => {
    setStep("idle");
    setQuote(null);
    setTxHash(null);
    setError(null);
  };

  if (balanceFloat <= 0) return null;

  const destAmount = quote?.destAmount
    ? (parseInt(quote.destAmount) / 1e6).toFixed(2)
    : null;

  return (
    <div className="mt-2 border border-primary/30 rounded-md p-3 bg-primary/5 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium">
        <ArrowDownUp className="w-3.5 h-3.5 text-primary" />
        <span>Swap USDC → USDC.e (Polymarket)</span>
      </div>

      {step === "idle" && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">
            Swap {balanceFloat.toFixed(2)} native USDC to USDC.e for Polymarket trading.
            Powered by ParaSwap.
          </p>
          <Button
            variant="terminal-primary"
            size="sm"
            className="w-full h-7 text-[11px]"
            onClick={getQuote}
          >
            Get Swap Quote
          </Button>
        </div>
      )}

      {step === "quoting" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Fetching quote...
        </div>
      )}

      {step === "quoted" && destAmount && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">You send</span>
            <span className="font-mono">{balanceFloat.toFixed(2)} USDC</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">You receive</span>
            <span className="font-mono text-green-500">{destAmount} USDC.e</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="terminal-primary"
              size="sm"
              className="flex-1 h-7 text-[11px]"
              onClick={executeSwap}
            >
              Confirm Swap
            </Button>
            <Button
              variant="terminal"
              size="sm"
              className="h-7 text-[11px]"
              onClick={reset}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {(step === "approving" || step === "swapping") && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          {step === "approving" ? "Approving USDC..." : "Executing swap..."}
        </div>
      )}

      {step === "done" && txHash && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-green-500">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Swap complete!
          </div>
          <a
            href={`https://polygonscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary underline"
          >
            View on Polygonscan
          </a>
          <Button variant="terminal" size="sm" className="w-full h-7 text-[11px]" onClick={reset}>
            Done
          </Button>
        </div>
      )}

      {step === "error" && error && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </div>
          <Button variant="terminal" size="sm" className="w-full h-7 text-[11px]" onClick={reset}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
