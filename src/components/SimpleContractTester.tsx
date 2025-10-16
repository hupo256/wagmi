import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useWatchContractEvent,
} from "wagmi";
import { useMemo, useState } from "react";
import NetworkChecker from "./NetworkChecker";
import { sepABI } from "@abis/simpleStorageAbi";

// 示例：Sepolia 上的一个已知示例合约（仅作测试使用）
// 说明：如果该地址在当前 Sepolia 网络上不可用，请按注释中的方法替换为你自己的已部署合约地址。
const sepAddr = "0x4951256aE46e96B2899ecEBbC5B0744e1d9D9b57" as `0x${string}`;

const btnTex =
  "inline-flex items-center rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50 mr-2 mb-2";
const sectionStyle = "border border-gray-300 rounded-lg p-4 mb-6";

export default function SimpleContractTester() {
  const { address: curAddr, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const [inputValue, setInputValue] = useState("0");

  // 读取合约状态
  const {
    data: contractValue,
    isLoading: valueLoading,
    refetch,
  } = useReadContract({
    address: sepAddr,
    abi: sepABI,
    functionName: "getValue",
  });

  function todoContract(funKey: string, args?: boolean) {
    writeContract({
      address: sepAddr,
      abi: sepABI,
      functionName: funKey,
      ...(args ? { args: [BigInt(inputValue)] } : null),
    });
  }

  // 3️⃣ 监听事件
  useWatchContractEvent({
    address: sepAddr,
    abi: sepABI,
    eventName: "ValueChanged",
    onLogs(logs) {
      console.log("✅ Event:", logs);
      refetch();
      setInputValue("0");
    },
  });

  // 生成一个加载中组件, 带动画效果
  const LoadingMan = useMemo(
    () => <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500" />,
    [],
  );

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-8 font-sans">
        <h1 className="text-2xl font-bold mb-4">简单合约测试器</h1>
        <p className="text-gray-600">请先连接钱包以使用合约测试功能</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6">简单合约交互测试</h1>

      {/* 网络检查 */}
      <NetworkChecker />

      {/* 交易状态 */}
      <div className={sectionStyle}>
        <div className="flex gap-2 items-center">
          <h2 className="text-lg font-semibold">交易状态: </h2>
          <code className="text-gray-500">
            {isConfirming && "等待交易确认..."}
            {isConfirmed && "交易成功！"}
            {!isConfirming && !isConfirmed && "准备发送交易"}
          </code>
        </div>
        {hash && <p className="text-sm text-blue-600">交易哈希: {hash}</p>}
      </div>

      {/* 合约状态 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">合约状态</h2>
        <div className="flex gap-2 items-center pb-4">
          <p className="text-sm text-gray-600">当前值:</p>
          <code className="text-gray-500">
            {valueLoading || isConfirming ? LoadingMan : contractValue?.toString() || "0"}
          </code>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center rounded-md bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
        >
          刷新状态
        </button>
      </div>

      {/* 合约操作 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">合约操作</h2>

        {/* 设置值 */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">设置新值:</label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs mr-2"
            placeholder="输入数字"
          />
          <button
            onClick={() => todoContract("setValue", true)}
            className={btnTex}
            disabled={isPending || isConfirming}
          >
            设置值
          </button>
        </div>

        {/* 增加/减少 */}
        <div className="flex gap-2">
          <button onClick={() => todoContract("increment")} className={btnTex} disabled={isPending || isConfirming}>
            增加 (+1)
          </button>
          <button onClick={() => todoContract("decrement")} className={btnTex} disabled={isPending || isConfirming}>
            减少 (-1)
          </button>
        </div>
      </div>

      {/* 合约信息 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">合约信息</h2>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">合约地址:</span>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{sepAddr}</code>
          </p>
          <p>
            <span className="font-medium">网络:</span> Sepolia 测试网
          </p>
          <p>
            <span className="font-medium">您的地址:</span>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{curAddr}</code>
          </p>
        </div>
      </div>

      {/* 合约源码 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">合约源码 (Solidity)</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {`// SPDX-License-Identifier: MIT
            pragma solidity ^0.8.0;

            contract SimpleContract {
                uint256 private value;
                
                function getValue() public view returns (uint256) {
                    return value;
                }
                
                function setValue(uint256 _value) public {
                    value = _value;
                }
                
                function increment() public {
                    value += 1;
                }
                
                function decrement() public {
                    value -= 1;
                }
            }`}
        </pre>
        <p className="text-sm text-gray-600 mt-2">
          您可以使用 Remix IDE 部署这个合约到 Sepolia 测试网，然后更新上面的合约地址。
        </p>
      </div>
    </div>
  );
}
