import {
  useConnect,
  useDisconnect,
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi, parseEther } from "viem";

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
    address: "0xd0d5e3db44de05e9f294bb0a3bEEaF030DE24Ada",
    abi: erc20Abi,
    functionName: "balanceOf",
    args: ["0xC04033F77D16197B936026adf58b97F2123b8828"],
  });

  const wethAddress = "0xd0d5e3db44de05e9f294bb0a3bEEaF030DE24Ada" as const;
  const wethAbi = [
    {
      type: "function",
      name: "deposit",
      stateMutability: "payable",
      inputs: [],
      outputs: [],
    },
  ] as const;

  const handleDeposit = async () => {
    if (!isConnected) return;
    writeContract({
      address: wethAddress,
      abi: wethAbi,
      functionName: "deposit",
      value: parseEther("0.01"),
    });
  };

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

      <div className="mb-4">
        <button disabled={!isConnected || isConfirming} onClick={handleDeposit} className={btnTex}>
          存入 0.01 ETH → WETH
        </button>
      </div>
    </div>
  );
}
