import { useAccount, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { useState } from "react";
import { useContractor } from "@store/index";
import { testAddr } from "@common/addressMan";

export default function Transaction() {
  const { isConnected } = useAccount();
  const { setIsRefresh } = useContractor();
  const { sendTransactionAsync, isPending: isTxPending, status: txStatus, error: txError } = useSendTransaction();

  const [to, setTo] = useState(testAddr);
  const [amount, setAmount] = useState("0.001");

  // 发交交易
  async function toSendTransaction() {
    if (!to) return alert("请输入收款地址");
    const param = { to: to as `0x${string}`, value: parseEther(amount) };
    sendTransactionAsync(param)
      .then((res) => {
        console.log(`已发送, 交易哈希: ${res}`);
        setIsRefresh(true);
      })
      .catch((err) => console.log(err));
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">发送交易 (原生 ETH)</h2>
      <div className="flex gap-2 mb-2">
        <input
          placeholder="收款地址 0x..."
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
        />
        <input
          placeholder="数量 (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      <button
        disabled={!isConnected || isTxPending}
        onClick={toSendTransaction}
        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        发送
      </button>
      <div className="text-sm mt-1 size-full md:size-auto">状态: {txStatus}</div>
      <div className="text-sm text-red-500 mt-1">{txError?.message}</div>
    </section>
  );
}
