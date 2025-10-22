// hooks/useUSDC.ts
import { useAccount } from "wagmi";
import { useReadContract, useWriteContract } from "wagmi";
import { erc20Abi } from "viem";

// Sepolia USDC 合约地址
export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// 读取 USDC 余额（单位：原始值，需除以 10^6）
export function useUSDCBalance() {
  const { address } = useAccount();

  const {
    data: balance,
    isLoading,
    error,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
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

  const approve = async (spender: `0x${string}`, amount: number) => {
    const amountInWei = BigInt(Math.floor(amount * 1e6)); // USDC decimals = 6
    return await writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amountInWei],
    });
  };

  return {
    approve,
    isApproving: false,
    txHash: undefined,
  };
}
