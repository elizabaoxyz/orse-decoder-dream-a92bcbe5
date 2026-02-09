/**
 * Execute a transaction through a 1-of-1 Gnosis Safe wallet.
 * The caller (EOA) must be the sole owner of the Safe.
 */
import { ethers } from "ethers";

const SAFE_ABI = [
  "function nonce() view returns (uint256)",
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool)",
];

/**
 * Execute a single call through a Safe where msg.sender == owner (1/1 Safe).
 * Uses the "pre-approved by msg.sender" signature format: r=owner, s=0, v=1
 */
export async function execSafeTransaction(
  provider: ethers.providers.Web3Provider,
  safeAddress: string,
  to: string,
  value: string,
  data: string,
  ownerAddress: string,
): Promise<ethers.providers.TransactionReceipt> {
  const signer = provider.getSigner();
  const safe = new ethers.Contract(safeAddress, SAFE_ABI, signer);

  // For a 1/1 Safe, when msg.sender is the owner, use signature type 1:
  // r = owner address padded to 32 bytes, s = 0, v = 1
  const signature = ethers.utils.solidityPack(
    ["bytes32", "bytes32", "uint8"],
    [
      ethers.utils.hexZeroPad(ownerAddress, 32),
      ethers.constants.HashZero,
      1,
    ]
  );

  const tx = await safe.execTransaction(
    to,
    value,
    data,
    0, // operation: Call
    0, // safeTxGas
    0, // baseGas
    0, // gasPrice
    ethers.constants.AddressZero, // gasToken
    ethers.constants.AddressZero, // refundReceiver
    signature,
  );

  return tx.wait();
}

// ERC-20 approve calldata encoder
const ERC20_ABI = ["function approve(address spender, uint256 amount)"];

export function encodeApprove(spender: string, amount: ethers.BigNumberish): string {
  const iface = new ethers.utils.Interface(ERC20_ABI);
  return iface.encodeFunctionData("approve", [spender, amount]);
}
