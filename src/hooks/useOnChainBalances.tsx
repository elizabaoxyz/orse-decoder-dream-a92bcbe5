import { useState, useCallback } from "react";
import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { polygon } from "viem/chains";

const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const;
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
  usdc: string;
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

  const fetchBalances = useCallback(async (eoaAddress?: string, safeAddress?: string) => {
    if (!eoaAddress && !safeAddress) return;
    setLoading(true);
    setError(null);

    for (let i = 0; i < RPC_URLS.length; i++) {
      try {
        const client = getClient(i);

        const fetchForAddress = async (addr: string): Promise<OnChainBalances> => {
          const [polBal, usdcBal] = await Promise.all([
            client.getBalance({ address: addr as `0x${string}` }),
            client.readContract({
              address: USDC_ADDRESS,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [addr as `0x${string}`],
            } as any),
          ]);
          return {
            pol: formatUnits(polBal, 18),
            usdc: formatUnits(usdcBal as bigint, 6),
          };
        };

        const [eoa, safe] = await Promise.all([
          eoaAddress ? fetchForAddress(eoaAddress) : Promise.resolve(null),
          safeAddress ? fetchForAddress(safeAddress) : Promise.resolve(null),
        ]);

        if (eoa) setEoaBalances(eoa);
        if (safe) setSafeBalances(safe);
        setLoading(false);
        return;
      } catch (e) {
        console.warn(`[OnChainBalances] RPC ${i} failed:`, e);
        if (i === RPC_URLS.length - 1) {
          setError(e instanceof Error ? e.message : "RPC failed");
        }
      }
    }
    setLoading(false);
  }, []);

  return { eoaBalances, safeBalances, loading, error, fetchBalances };
}
