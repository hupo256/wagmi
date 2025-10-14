import { useReadContract } from "wagmi";
import { erc20Abi, type Address } from "viem";

export function TokenBalance({ tokenAddress, address }: { tokenAddress: Address; address: Address }) {
  const { data, isLoading, error } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Balance: {data?.toString()}</div>;
}
