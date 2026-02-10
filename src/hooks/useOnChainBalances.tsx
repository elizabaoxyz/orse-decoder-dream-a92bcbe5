import { useState, useCallback } from "react";
import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { polygon } from "viem/chains";

const USDC_E_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const; // USDC.e (bridged) — used by Polymarket
const USDC_NATIVE_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as const; // Native USDC
const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

const RPC_URLS = [
  "https://polygon-rpc.com",
  "https://rpc.ankr.com/polygon",
  "https://polygon.llamarpc.com",
];

export interface OnChainBalances {
  pol: string;
  usdcE: string;     // USDC.e (bridged) — Polymarket uses this
  usdcNative: string; // Native USDC
  usdcTotal: string;  // Combined for display
}

function getClient(rpcIndex = 0) {
  return createPublicClient({
    chain: polygon,
    transport: http(RPC_URLS[rpcIndex % RPC_URLS.length]),
  });
}

export function useOnChainBalances() {
  const [eoaBalances, setEoaBalances] = useState<OnChainBalances | null>(null);
  const [safeBalances, setSafeBalances] = useState<OnChainBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(
    async (
      eoaAddress?: string,
      safeAddress?: string
    ): Promise<{ eoa: OnChainBalances | null; safe: OnChainBalances | null } | null> => {
    if (!eoaAddress && !safeAddress) return null;
    setLoading(true);
    setError(null);

    for (let i = 0; i < RPC_URLS.length; i++) {
      try {
        const client = getClient(i);

        const fetchForAddress = async (addr: string): Promise<OnChainBalances> => {
          const [polBal, usdcEBal, usdcNativeBal] = await Promise.all([
            client.getBalance({ address: addr as `0x${string}` }),
            client.readContract({
              address: USDC_E_ADDRESS,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [addr as `0x${string}`],
            } as any),
            client.readContract({
              address: USDC_NATIVE_ADDRESS,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [addr as `0x${string}`],
            } as any),
          ]);
          const usdcE = formatUnits(usdcEBal as bigint, 6);
          const usdcNative = formatUnits(usdcNativeBal as bigint, 6);
          const usdcTotal = (parseFloat(usdcE) + parseFloat(usdcNative)).toString();
          return {
            pol: formatUnits(polBal, 18),
            usdcE,
            usdcNative,
            usdcTotal,
          };
        };

        const [eoa, safe] = await Promise.all([
          eoaAddress ? fetchForAddress(eoaAddress) : Promise.resolve(null),
          safeAddress ? fetchForAddress(safeAddress) : Promise.resolve(null),
        ]);

        if (eoa) setEoaBalances(eoa);
        if (safe) setSafeBalances(safe);
        setLoading(false);
        return { eoa, safe };
      } catch (e) {
        console.warn(`[OnChainBalances] RPC ${i} failed:`, e);
        if (i === RPC_URLS.length - 1) {
          setError(e instanceof Error ? e.message : "RPC failed");
        }
      }
    }
    setLoading(false);
    return null;
  }, []);

  return { eoaBalances, safeBalances, loading, error, fetchBalances };
}
