import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, erc20Abi, type Address } from "viem";

export default function TransferButton({ to }: { to: Address }) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const sendTransfer = () => {
    writeContract({
      address: "0x...", // 你的合约地址
      abi: erc20Abi, // 合约 ABI
      // abi: [...],       // 合约 ABI
      functionName: "transfer",
      args: [to, parseEther("0.1")],
    });
  };

  return (
    <div>
      <button
        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
        onClick={sendTransfer}
        disabled={isPending}
      >
        {isPending ? "Confirming..." : "Send 0.1 ETH"}
      </button>
      {hash && <div>Tx: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <div>✅ Transaction confirmed!</div>}
    </div>
  );
}
