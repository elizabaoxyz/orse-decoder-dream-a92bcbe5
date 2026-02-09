import { useState, useCallback } from "react";
import { createPublicClient, http, encodeFunctionData, maxUint256, parseAbi } from "viem";
import { polygon } from "viem/chains";
import { ethers } from "ethers";
import { RelayClient, RelayerTxType } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";

// Contract addresses (Polygon Mainnet)
const ADDRESSES = {
  USDC_E: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const,
  CTF: "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045" as const,
  CTF_EXCHANGE: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E" as const,
  NEG_RISK_CTF_EXCHANGE: "0xC5d563A36AE78145C45a50134d48A1215220f80a" as const,
  NEG_RISK_ADAPTER: "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296" as const,
};

const RELAYER_URL = "https://relayer-v2.polymarket.com";
const CHAIN_ID = 137;

const RPC_URLS = [
  "https://polygon-rpc.com",
  "https://rpc.ankr.com/polygon",
  "https://polygon.llamarpc.com",
];

const ERC20_ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

const ERC1155_ABI = parseAbi([
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function setApprovalForAll(address operator, bool approved)",
]);

export interface ApprovalStatus {
  // ERC-20 USDC approvals
  usdcToCTF: boolean;
  usdcToExchange: boolean;
  usdcToNegRiskExchange: boolean;
  // ERC-1155 CTF token approvals
  ctfToExchange: boolean;
  ctfToNegRiskExchange: boolean;
  ctfToNegRiskAdapter: boolean;
  // Summary
  allApproved: boolean;
}

function getClient(rpcIndex = 0) {
  return createPublicClient({
    chain: polygon,
    transport: http(RPC_URLS[rpcIndex % RPC_URLS.length]),
  });
}

export function useTokenApprovals() {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkApprovals = useCallback(async (safeAddress: string) => {
    setChecking(true);
    setError(null);

    for (let i = 0; i < RPC_URLS.length; i++) {
      try {
        const client = getClient(i);
        const addr = safeAddress as `0x${string}`;

        // Check ERC-20 allowances (USDC → various spenders)
        const [allowCTF, allowExchange, allowNegRisk] = await Promise.all([
          client.readContract({
            address: ADDRESSES.USDC_E,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [addr, ADDRESSES.CTF],
          } as any),
          client.readContract({
            address: ADDRESSES.USDC_E,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [addr, ADDRESSES.CTF_EXCHANGE],
          } as any),
          client.readContract({
            address: ADDRESSES.USDC_E,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [addr, ADDRESSES.NEG_RISK_CTF_EXCHANGE],
          } as any),
        ]);

        // Check ERC-1155 approvals (CTF → operators)
        const [ctfExchange, ctfNegRisk, ctfAdapter] = await Promise.all([
          client.readContract({
            address: ADDRESSES.CTF,
            abi: ERC1155_ABI,
            functionName: "isApprovedForAll",
            args: [addr, ADDRESSES.CTF_EXCHANGE],
          } as any),
          client.readContract({
            address: ADDRESSES.CTF,
            abi: ERC1155_ABI,
            functionName: "isApprovedForAll",
            args: [addr, ADDRESSES.NEG_RISK_CTF_EXCHANGE],
          } as any),
          client.readContract({
            address: ADDRESSES.CTF,
            abi: ERC1155_ABI,
            functionName: "isApprovedForAll",
            args: [addr, ADDRESSES.NEG_RISK_ADAPTER],
          } as any),
        ]);

        const MIN_ALLOWANCE = BigInt(1e12); // > 1M USDC
        const usdcToCTF = (allowCTF as bigint) > MIN_ALLOWANCE;
        const usdcToExchange = (allowExchange as bigint) > MIN_ALLOWANCE;
        const usdcToNegRiskExchange = (allowNegRisk as bigint) > MIN_ALLOWANCE;

        const status: ApprovalStatus = {
          usdcToCTF,
          usdcToExchange,
          usdcToNegRiskExchange,
          ctfToExchange: ctfExchange as boolean,
          ctfToNegRiskExchange: ctfNegRisk as boolean,
          ctfToNegRiskAdapter: ctfAdapter as boolean,
          allApproved:
            usdcToCTF &&
            usdcToExchange &&
            usdcToNegRiskExchange &&
            (ctfExchange as boolean) &&
            (ctfNegRisk as boolean) &&
            (ctfAdapter as boolean),
        };

        console.log("[TokenApprovals] Status:", status);
        setApprovalStatus(status);
        setChecking(false);
        return status;
      } catch (e) {
        console.warn(`[TokenApprovals] RPC ${i} failed:`, e);
        if (i === RPC_URLS.length - 1) {
          setError(e instanceof Error ? e.message : "Failed to check approvals");
        }
      }
    }
    setChecking(false);
    return null;
  }, []);

  const approveAll = useCallback(
    async (
      eip1193Provider: any,
      ownerAddress: string,
      privyAccessToken: string,
      signerUrl: string = "https://sign.elizabao.xyz/sign",
      currentStatus?: ApprovalStatus | null
    ) => {
      setApproving(true);
      setError(null);

      try {
        // Build list of needed approval transactions
        const txs: { to: string; data: string; value: string }[] = [];
        const status = currentStatus || approvalStatus;

        // ERC-20 approvals (USDC → spenders)
        const erc20Approvals = [
          { spender: ADDRESSES.CTF, skip: status?.usdcToCTF, label: "USDC→CTF" },
          { spender: ADDRESSES.CTF_EXCHANGE, skip: status?.usdcToExchange, label: "USDC→Exchange" },
          { spender: ADDRESSES.NEG_RISK_CTF_EXCHANGE, skip: status?.usdcToNegRiskExchange, label: "USDC→NegRisk" },
        ];

        for (const { spender, skip, label } of erc20Approvals) {
          if (!skip) {
            console.log(`[TokenApprovals] Adding ERC-20 approval: ${label}`);
            txs.push({
              to: ADDRESSES.USDC_E,
              data: encodeFunctionData({
                abi: ERC20_ABI,
                functionName: "approve",
                args: [spender, maxUint256],
              }),
              value: "0",
            });
          }
        }

        // ERC-1155 approvals (CTF → operators)
        const erc1155Approvals = [
          { operator: ADDRESSES.CTF_EXCHANGE, skip: status?.ctfToExchange, label: "CTF→Exchange" },
          { operator: ADDRESSES.NEG_RISK_CTF_EXCHANGE, skip: status?.ctfToNegRiskExchange, label: "CTF→NegRisk" },
          { operator: ADDRESSES.NEG_RISK_ADAPTER, skip: status?.ctfToNegRiskAdapter, label: "CTF→Adapter" },
        ];

        for (const { operator, skip, label } of erc1155Approvals) {
          if (!skip) {
            console.log(`[TokenApprovals] Adding ERC-1155 approval: ${label}`);
            txs.push({
              to: ADDRESSES.CTF,
              data: encodeFunctionData({
                abi: ERC1155_ABI,
                functionName: "setApprovalForAll",
                args: [operator, true],
              }),
              value: "0",
            });
          }
        }

        if (txs.length === 0) {
          console.log("[TokenApprovals] All approvals already set!");
          setApproving(false);
          return { success: true, message: "All approvals already set" };
        }

        console.log(`[TokenApprovals] Submitting ${txs.length} approval txs via Relayer...`);

        // Create ethers v5 signer from EIP-1193 provider
        const web3Provider = new ethers.providers.Web3Provider(eip1193Provider);
        const signer = web3Provider.getSigner();

        // Build builder config with remote signing
        const builderConfig = new BuilderConfig({
          remoteBuilderConfig: { url: signerUrl, token: privyAccessToken },
        });

        // Create RelayClient
        const client = new RelayClient(
          RELAYER_URL,
          CHAIN_ID,
          signer,
          builderConfig,
          RelayerTxType.SAFE
        );

        // Execute all approvals in a batch
        const response = await client.execute(txs, "Set token approvals for Polymarket trading");
        console.log("[TokenApprovals] Execute response:", response);

        // Poll for confirmation
        if (response?.transactionID) {
          console.log("[TokenApprovals] Polling for confirmation:", response.transactionID);
          const confirmed = await client.pollUntilState(
            response.transactionID,
            ["STATE_MINED", "STATE_CONFIRMED"],
            "STATE_FAILED",
            30,
            2000
          );
          if (confirmed) {
            console.log("[TokenApprovals] Approvals confirmed:", confirmed.transactionHash);
            setApproving(false);
            return { success: true, txHash: confirmed.transactionHash };
          }
          setApproving(false);
          return { success: false, message: "Transaction failed or timed out" };
        }

        setApproving(false);
        return { success: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[TokenApprovals] Error:", msg);
        setError(msg);
        setApproving(false);
        return { success: false, message: msg };
      }
    },
    [approvalStatus]
  );

  return { approvalStatus, checking, approving, error, checkApprovals, approveAll };
}
