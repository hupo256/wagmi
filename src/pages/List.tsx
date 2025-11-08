import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { simpleStorageAbi } from "@abis/simpleStorageAbi"; // 合约对应的 ABI

// 这个是部署好的合约地址
const CONTRACT_ADDRESS = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";

export default function TestContract() {
  const { address, chainId } = useAccount();
  const { writeContract, isPending } = useWriteContract(); // 2️⃣ 发送交易（写入新值）
  const [newNumber, setNewNumber] = useState("");
  // 1️⃣ 读取余额（当前存储的值）
  const { data: currentValue, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: simpleStorageAbi,
    functionName: "retrieve",
  });

  function toStore() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: simpleStorageAbi,
      functionName: "store",
      args: [BigInt(newNumber)],
    });
  }

  function toRefresh() {
    refetch(); // 手动刷新
    setNewNumber("");
  }

  // 3️⃣ 监听事件
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: simpleStorageAbi,
    eventName: "ValueChanged",
    onLogs(logs) {
      console.log("✅ Event:", logs);
      toRefresh();
    },
  });

  return (
    <div className="text-sans max-w-4xl mx-auto p-8">
      <h2 className="mb-4 text-xl font-medium">wagmi 合约测试 ✅ </h2>

      <p className="font-medium">
        <strong>当前值:</strong> {currentValue?.toString() ?? "Loading..."}
      </p>

      <div className="mt-4 flex space-x-4">
        <input
          type="number"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-1 shadow-sm focus:outline-none focus:ring focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="输入新值"
        />
        <button
          className="mt-2 inline-flex items-center rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={toStore}
          disabled={isPending}
        >
          {isPending ? "发送中..." : "写入新值"}
        </button>

        <button
          className="mt-2 inline-flex items-center rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          onClick={toRefresh}
        >
          🔁 手动刷新
        </button>
      </div>

      <p className="mt-4 text-gray-600">打开控制台查看事件日志 🎯</p>
    </div>
  );
}
