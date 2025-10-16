// TestContract.tsx
import { useState, useEffect } from "react";
import { useAccount, useBalance, useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { simpleStorageAbi, Abi } from "@abis/simpleStorageAbi"; // 把上面的 ABI 存为 abi.ts

// const CONTRACT_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const CONTRACT_ADDRESS = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";

export default function TestContract() {
  const { address, chainId } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [newNumber, setNewNumber] = useState("");
  const { data: balance } = useBalance({
    address,
    chainId: chainId as 31337 | undefined,
    query: { enabled: !!address },
  });

  // 1️⃣ 读取余额（当前存储的值）
  const { data: currentValue, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: simpleStorageAbi,
    functionName: "retrieve",
  });

  // 2️⃣ 发送交易（写入新值）

  useEffect(() => {
    if (currentValue !== undefined) {
      console.log("✅ currentValue:", currentValue);
    }
  }, [currentValue]);

  const toStore = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: simpleStorageAbi,
      functionName: "store",
      args: [BigInt(newNumber)],
    });
  };

  const handleManualRefresh = () => {
    refetch(); // 手动刷新
    console.log("✅ 手动刷新完成");
  };

  // 3️⃣ 监听事件
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: simpleStorageAbi,
    eventName: "ValueChanged",
    onLogs(logs) {
      console.log("✅ Event:", logs);
      refetch();
    },
  });

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2 className="mb-4">🧪 wagmi 合约测试 ✅ ✅ </h2>

      <p className="">
        <strong>当前值:</strong> {currentValue?.toString() ?? "Loading..."}
      </p>

      <div style={{ marginTop: "16px" }}>
        <input type="number" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="输入新值" />
        <button
          className="mt-2 inline-flex items-center rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={() => toStore()}
        >
          {isPending ? "发送中..." : "写入新值"}
        </button>

        <button onClick={handleManualRefresh} style={{ marginLeft: "8px" }}>
          🔁 手动刷新
        </button>
      </div>

      <p style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>打开控制台查看事件日志 🎯</p>
    </div>
  );
}
