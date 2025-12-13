import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { erc20Abi } from "viem";
import { USDC_ADDRESS } from "@/config/aave";

// 读取 USDC 余额（单位：原始值，需除以 10^6）
export function useUSDCBalance(accountAddress?: string) {
  const { address } = useAccount();

  const targetAddress = accountAddress || address;

  const {
    data: balance,
    isLoading,
    error,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: targetAddress ? [targetAddress as `0x${string}`] : undefined,
    query: { enabled: !!targetAddress },
  });

  return {
    balance: balance ? Number(balance) / 1e6 : 0,
    isLoading,
    error,
  };
}

// 授权 USDC 给 spender（如 Aave LendingPool）
export function useApproveUSDC() {
  const { writeContractAsync } = useWriteContract();

  async function approve(spender: `0x${string}`, amount: number) {
    const amountInWei = BigInt(Math.floor(amount * 1e6)); // USDC decimals = 6
    return await writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amountInWei],
    });
  }

  return {
    approve,
    isApproving: false,
    txHash: undefined,
  };
}
