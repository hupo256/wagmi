import { useAccount, useSignMessage } from "wagmi";
import { useState } from "react";

export default function Signature() {
  const { isConnected } = useAccount();
  const { signMessageAsync, isPending: isSignPending, error: signError } = useSignMessage();

  const [showSign, setShowSign] = useState("");
  const [message, setMessage] = useState("Hello from wagmi + viem");

  async function toSign() {
    const sig = await signMessageAsync({ message });
    setShowSign(sig);
  }

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">签名消息</h2>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full mb-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
      />
      <button
        disabled={!isConnected || isSignPending}
        onClick={toSign}
        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        签名
      </button>
      {/* 签名结果 展示文字内容自动换行 */}
      <div className="text-sm text-red-500 mt-2 break-words">{showSign ? showSign : signError?.message}</div>
    </section>
  );
}
