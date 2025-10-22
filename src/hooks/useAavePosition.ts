// hooks/useAavePosition.ts
import { useAccount } from "wagmi";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi } from "viem";

// Addresses (Sepolia)
export const AUSDC_ADDRESS = "0x039f775dAeA9331C9D9a07d555F8C82d55dA0E57";
export const AAVE_POOL_ADDRESS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// Aave Pool ABI — for withdraw
const aavePoolAbi = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// 1. Read aUSDC balance
export function useAUSDCBalance() {
  const { address } = useAccount();

  const {
    data: balance,
    isLoading,
    error,
  } = useReadContract({
    address: AUSDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    aUSDCBalance: balance ? Number(balance) / 1e6 : 0,
    isLoading,
    error,
  };
}

// 2. Withdraw USDC from Aave
export function useAaveWithdraw() {
  const { address } = useAccount();
  const { writeContractAsync, isPending, data: writeData } = useWriteContract();
  const { data: receiptData, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: writeData, // 使用写操作返回的 transaction hash
  });

  /**
   * Withdraw USDC from Aave
   * @param amount - human-readable amount (e.g., 50). Use Infinity to withdraw max.
   */
  const withdraw = async (amount: number | "max") => {
    if (!address) throw new Error("Wallet not connected");

    const amountInWei =
      amount === "max"
        ? BigInt(2 ** 256 - 1) // Max value for "withdraw all"
        : BigInt(Math.floor(amount * 1e6));

    return await writeContractAsync({
      address: AAVE_POOL_ADDRESS,
      abi: aavePoolAbi,
      functionName: "withdraw",
      args: [USDC_ADDRESS, amountInWei, address],
    });
  };

  return {
    withdraw,
    isWithdrawing: isPending,
    withdrawTxHash: writeData, // 正确获取交易哈希
    isConfirmed: receiptData?.status === "success",
    isConfirming,
  };
}
