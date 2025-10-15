import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useState } from "react";
import NetworkChecker from "./NetworkChecker";
// import counterData from "../contracts/Counter.json";
import { Abi } from "viem";

// const SIMPLE_CONTRACT_ADDRESS = (counterData as { address: `0x${string}` }).address;
// const SIMPLE_CONTRACT_ABI = counterData.abi as Abi;

// 这是一个在 Sepolia 上已经部署的简单合约地址
const SIMPLE_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`;

// 也可以使用 Remix 或其他工具部署自己的合约
// const SIMPLE_CONTRACT_ADDRESS = "0x6cee97953141d8437981f405a99c4fef39cb4b60" as `0x${string}`;

// 简单合约的 ABI - 包含基本的读写功能
const SIMPLE_CONTRACT_ABI: Abi = [
  {
    inputs: [],
    name: "getValue",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_value", type: "uint256" }],
    name: "setValue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "increment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decrement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const codeTex = "text-gray-600 border border-gray-200 p-2 rounded mb-4 bg-gray-100";
const btnTex =
  "inline-flex items-center rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50 mr-2 mb-2";
const sectionStyle = "border border-gray-300 rounded-lg p-4 mb-6";

export default function SimpleContractTester() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const [inputValue, setInputValue] = useState("0");

  // 读取合约状态
  const {
    data: contractValue,
    isLoading: valueLoading,
    refetch,
  } = useReadContract({
    address: SIMPLE_CONTRACT_ADDRESS,
    abi: SIMPLE_CONTRACT_ABI,
    functionName: "getValue",
  });

  console.log("contractValue   =>", contractValue);

  // 设置值
  const handleSetValue = () => {
    writeContract({
      address: SIMPLE_CONTRACT_ADDRESS,
      abi: SIMPLE_CONTRACT_ABI,
      functionName: "setValue",
      args: [BigInt(inputValue)],
    });
  };

  // 增加
  const handleIncrement = () => {
    writeContract({
      address: SIMPLE_CONTRACT_ADDRESS,
      abi: SIMPLE_CONTRACT_ABI,
      functionName: "increment",
    });
  };

  // 减少
  const handleDecrement = () => {
    writeContract({
      address: SIMPLE_CONTRACT_ADDRESS,
      abi: SIMPLE_CONTRACT_ABI,
      functionName: "decrement",
    });
  };

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
        <h2 className="text-lg font-semibold mb-2">交易状态</h2>
        <p className={codeTex}>
          {isConfirming && "等待交易确认..."}
          {isConfirmed && "交易成功！"}
          {!isConfirming && !isConfirmed && "准备发送交易"}
        </p>
        {hash && <p className="text-sm text-blue-600">交易哈希: {hash}</p>}
      </div>

      {/* 合约状态 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">合约状态</h2>
        <p className="text-sm text-gray-600 mb-2">当前值:</p>
        <p className={codeTex}>{valueLoading ? "加载中..." : contractValue?.toString() || "0"}</p>
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
          <button onClick={handleSetValue} className={btnTex} disabled={isConfirming}>
            设置值
          </button>
        </div>

        {/* 增加/减少 */}
        <div className="flex gap-2">
          <button onClick={handleIncrement} className={btnTex} disabled={isConfirming}>
            增加 (+1)
          </button>
          <button onClick={handleDecrement} className={btnTex} disabled={isConfirming}>
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
            <code className="bg-gray-100 px-2 py-1 rounded">{SIMPLE_CONTRACT_ADDRESS}</code>
          </p>
          <p>
            <span className="font-medium">网络:</span> Sepolia 测试网
          </p>
          <p>
            <span className="font-medium">您的地址:</span>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{address}</code>
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
