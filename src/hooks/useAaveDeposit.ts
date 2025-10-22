// hooks/useAaveDeposit.ts
import { useAccount } from "wagmi";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";

// Aave V3 Pool (Sepolia)
export const AAVE_POOL_ADDRESS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

// USDC (Sepolia) — needed for asset parameter
export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// Aave Pool ABI — 只需 deposit 函数
const aavePoolAbi = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useAaveDeposit() {
  const { address } = useAccount();
  const { writeContractAsync, isPending, data: txHash } = useWriteContract();

  /**
   * Deposit USDC into Aave
   * @param amount - amount in human-readable number (e.g., 100 for 100 USDC)
   */
  const deposit = async (amount: number) => {
    if (!address) throw new Error("Wallet not connected");

    // USDC has 6 decimals
    const amountInWei = BigInt(Math.floor(amount * 1e6));

    return await writeContractAsync({
      address: AAVE_POOL_ADDRESS,
      abi: aavePoolAbi,
      functionName: "deposit",
      args: [
        USDC_ADDRESS, // asset
        amountInWei, // amount
        address, // onBehalfOf (usually yourself)
        0, // referralCode (0 if none)
      ],
    });
  };

  return {
    deposit,
    isDepositing: isPending,
    depositTxHash: txHash,
  };
}
