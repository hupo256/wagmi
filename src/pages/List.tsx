// TestContract.tsx
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { simpleStorageAbi } from "@abis/simpleStorageAbi"; // 把上面的 ABI 存为 abi.ts

// const CONTRACT_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

export default function TestContract() {
  const { address } = useAccount();
  const [newNumber, setNewNumber] = useState("24");

  // 1️⃣ 读取余额（当前存储的值）
  const { data: currentValue, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: simpleStorageAbi,
    functionName: "retrieve",
  });

  // 2️⃣ 发送交易（写入新值）
  const { writeContract, isPending } = useWriteContract();

  const toStore = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: simpleStorageAbi,
      functionName: "store",
      args: [BigInt(newNumber)],
    });
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
      </div>

      <p style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>打开控制台查看事件日志 🎯</p>
    </div>
  );
}
