import {
  useConnect,
  useDisconnect,
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi } from "viem";

const codeTex = "text-gray-600 border border-gray-200 p-2 rounded mb-4 bg-gray-100";
const btnTex =
  "inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50";
export default function List() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  let transText = "should to transfer";
  isConfirming && (transText = "Waiting for confirmation...");
  isConfirmed && (transText = "Transfer successful!");

  const handleTransfer = (tokenAddress: `0x${string}`) => {
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: ["0xRecipientAddress", 1000000000000000000n], // 1 token (18 decimals)
    });
  };

  const { data: balance, isLoading } = useReadContract({
    address: "0x2d3Bb2C6927a5c4B72f5187E9F3e37C62516aC28",
    abi: erc20Abi,
    functionName: "balanceOf",
    args: ["0x742d35Cc6634C0532925a3b8D4C9db4C0d1c4567"],
  });

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">List</h1>
      <div className="mb-4">
        {isConnected && (
          <div className="mb-4">
            <p className={codeTex}>Connected: {address}</p>
            <button onClick={() => disconnect()} className={btnTex}>
              Disconnect
            </button>
          </div>
        )}
        {!isConnected && (
          <div className="flex gap-2">
            {connectors.map((connector) => (
              <button key={connector.id} onClick={() => connect({ connector })} className={btnTex}>
                Connect {connector.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className={codeTex}>{isLoading ? "Loading ..." : `Balance:${balance?.toString()}`}</p>
      </div>

      <div className="mb-4">
        <p className={codeTex}>{transText}</p>
        <button onClick={() => handleTransfer("0xqwrwefr2dfwe")} className={btnTex}>
          Transfer
        </button>
      </div>
    </div>
  );
}
