// hooks/useAaveReserveData.ts
import { useReadContract } from "wagmi";

export const AAVE_POOL_ADDRESS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const aavePoolAbi = [
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveData",
    outputs: [
      {
        components: [
          { name: "unbacked", type: "uint256" },
          { name: "accruedToTreasuryScaled", type: "uint256" },
          { name: "totalAToken", type: "uint256" },
          { name: "totalStableDebt", type: "uint256" },
          { name: "totalVariableDebt", type: "uint256" },
          { name: "liquidityRate", type: "uint256" }, // ← 存款利率（liquidityRate）
          { name: "variableBorrowRate", type: "uint256" },
          { name: "stableBorrowRate", type: "uint256" },
          { name: "averageStableBorrowRate", type: "uint256" },
          { name: "liquidityIndex", type: "uint256" },
          { name: "variableBorrowIndex", type: "uint256" },
          { name: "lastUpdateTimestamp", type: "uint40" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useAaveUSDCAPY() {
  const { data, isLoading, error } = useReadContract({
    address: AAVE_POOL_ADDRESS,
    abi: aavePoolAbi,
    functionName: "getReserveData",
    args: [USDC_ADDRESS],
  });

  // liquidityRate 是 27 位小数（Ray），转换为百分比 APY
  const liquidityRate = data?.liquidityRate ? Number(data.liquidityRate) : 0;
  const apy = liquidityRate / 1e25; // Ray = 1e27, so /1e25 → %

  return {
    apy: apy / 100, // e.g., 0.032 → 3.2%
    isLoading,
    error,
  };
}
