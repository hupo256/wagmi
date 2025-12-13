import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";
export default function GetUSDCButton() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Sepolia 测试网的链 ID 是 11155111
  const isSepolia = chainId === sepolia.id;

  if (!isConnected) return null;
  if (!isSepolia) return null;
  const handleClick = () => {
    window.open("https://faucet.circle.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center px-4 py-2.5 text-sm bg-black text-white border-none rounded-lg cursor-pointer font-semibold shadow-md transition-colors hover:bg-neutral-800"
    >
      🚰 <span className="pl-2">Get Test USDC from Circle</span>
    </button>
  );
}
