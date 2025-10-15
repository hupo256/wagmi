// components/TokenBalance.tsx
import { useAccount, useReadContract, useConnect } from "wagmi";
// import { erc20ABI } from "../../abis/erc20ABI";
import { erc20Abi } from "viem";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Ethereum 主网 USDC

export default function List() {
  const { address, isConnected } = useAccount();
  const { isPending: isConnectPending, status: connectStatus } = useConnect();

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: decimals = 18n } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
  });

  console.log("decimals", decimals, balance);
  const formatted = balance ? Number(balance) / Math.pow(10, Number(decimals)) : 0;

  if (!isConnected) return <div className="mx-auto p-8 font-sans">请连接钱包</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <p className="text-gray-700 dark:text-gray-300"> USDC: {formatted}</p>

      <h1 className="text-2xl font-bold mb-4">Details</h1>
      <p className="text-gray-700 dark:text-gray-300">{address}</p>
      <p className="text-gray-700 dark:text-gray-300 uppercase">{connectStatus}</p>
      <p className="text-gray-700 dark:text-gray-300">{`${balance} -- ${decimals}`}</p>
    </div>
  );
}
