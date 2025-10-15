// TestContract.tsx
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { parseEther } from "viem";
import { simpleStorageAbi } from "@abis/simpleStorageAbi"; // 把上面的 ABI 存为 abi.ts
// import { simpleStorageAbi } from "../abis/simpleStorageAbi"; // 把上面的 ABI 存为 abi.ts

const CONTRACT_ADDRESS = "0x6cee97953141d8437981f405a99c4fef39cb4b60";

export default function TestContract() {
  const { address } = useAccount();
  const [newNumber, setNewNumber] = useState("24");

  // 1️⃣ 读取余额（当前存储的值）
  const { data: currentValue, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: simpleStorageAbi,
    functionName: "retrieve",
  });

  console.log(currentValue);

  // 2️⃣ 发送交易（写入新值）
  const { writeContract, isPending } = useWriteContract();

  const handleStore = () => {
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
      console.log("✅ ValueChanged event received:", logs);
      logs.forEach((log) => {
        console.log(`New value: ${log.toString()} set by ${log.args.setter}`);
      });
      // 可选：自动刷新读取
      refetch();
    },
  });

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>🧪 wagmi 合约测试 ✅ ✅ </h2>

      <p>
        <strong>当前值:</strong> {currentValue?.toString() ?? "Loading..."}
      </p>

      <div style={{ marginTop: "16px" }}>
        <input type="number" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="输入新值" />
        <button onClick={handleStore} disabled={isPending} style={{ marginLeft: "8px" }}>
          {isPending ? "发送中..." : "写入新值"}
        </button>
      </div>

      <p style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>打开控制台查看事件日志 🎯</p>
    </div>
  );
}
