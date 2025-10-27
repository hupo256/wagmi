import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { erc20Abi, erc721Abi } from "viem";
import { useState } from "react";
import NetworkChecker from "./NetworkChecker";
import { USDC_ADDRESS } from "@/config/aave";

// Sepolia 测试网上的测试合约地址
const TEST_CONTRACTS = {
  // USDC 测试代币 (Sepolia)
  USDC: USDC_ADDRESS as `0x${string}`,

  // WETH 测试代币 (Sepolia)
  WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as `0x${string}`,

  // 一个简单的测试 ERC20 代币
  TEST_TOKEN: "0x2d3Bb2C6927a5c4B72f5187E9F3e37C62516aC28" as `0x${string}`,

  // 一个简单的计数器合约 (Sepolia)
  COUNTER: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`,

  // 一个简单的存储合约 (Sepolia)
  STORAGE: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as `0x${string}`,
};

// 简单的计数器合约 ABI
const COUNTER_ABI = [
  {
    inputs: [],
    name: "count",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
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
    type: "function",
    stateMutability: "nonpayable",
  },
] as const;

// 简单存储合约 ABI
const STORAGE_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "num", type: "uint256" }],
    name: "store",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "retrieve",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const codeTex = "text-gray-600 border border-gray-200 p-2 rounded mb-4 bg-gray-100";
const btnTex =
  "inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50 mr-2 mb-2";
const sectionStyle = "border border-gray-300 rounded-lg p-4 mb-6";

export default function ContractTester() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const [transferAmount, setTransferAmount] = useState("1");
  const [recipientAddress, setRecipientAddress] = useState("0x742d35Cc6634C0532925a3b8D4C9db4C0d1c4567");
  const [storageValue, setStorageValue] = useState("0");

  // ERC20 代币余额查询
  const { data: usdcBalance, isLoading: usdcLoading } = useReadContract({
    address: TEST_CONTRACTS.USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: wethBalance, isLoading: wethLoading } = useReadContract({
    address: TEST_CONTRACTS.WETH,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // 计数器合约查询
  const { data: counterValue, isLoading: counterLoading } = useReadContract({
    address: TEST_CONTRACTS.COUNTER,
    abi: COUNTER_ABI,
    functionName: "count",
  });

  // 存储合约查询
  const { data: storageData, isLoading: storageLoading } = useReadContract({
    address: TEST_CONTRACTS.STORAGE,
    abi: STORAGE_ABI,
    functionName: "retrieve",
  });

  // ERC20 代币转账
  const handleTransfer = (tokenAddress: `0x${string}`, tokenName: string) => {
    const amount = BigInt(parseFloat(transferAmount) * 10 ** 18); // 假设 18 位小数
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipientAddress as `0x${string}`, amount],
    });
  };

  // 计数器操作
  const handleIncrement = () => {
    writeContract({
      address: TEST_CONTRACTS.COUNTER,
      abi: COUNTER_ABI,
      functionName: "increment",
    });
  };

  const handleDecrement = () => {
    writeContract({
      address: TEST_CONTRACTS.COUNTER,
      abi: COUNTER_ABI,
      functionName: "decrement",
    });
  };

  // 存储合约操作
  const handleStore = () => {
    writeContract({
      address: TEST_CONTRACTS.STORAGE,
      abi: STORAGE_ABI,
      functionName: "store",
      args: [BigInt(storageValue)],
    });
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-8 font-sans">
        <h1 className="text-2xl font-bold mb-4">合约测试器</h1>
        <p className="text-gray-600">请先连接钱包以使用合约测试功能</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6">Sepolia 测试网合约交互</h1>

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

      {/* ERC20 代币余额 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">ERC20 代币余额</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">USDC 余额:</p>
            <p className={codeTex}>{usdcLoading ? "加载中..." : `${usdcBalance?.toString() || "0"} wei`}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">WETH 余额:</p>
            <p className={codeTex}>{wethLoading ? "加载中..." : `${wethBalance?.toString() || "0"} wei`}</p>
          </div>
        </div>
      </div>

      {/* ERC20 代币转账 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">ERC20 代币转账</h2>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">转账金额:</label>
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs"
            placeholder="输入转账金额"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">接收地址:</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full max-w-md"
            placeholder="输入接收地址"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTransfer(TEST_CONTRACTS.USDC, "USDC")}
            className={btnTex}
            disabled={isConfirming}
          >
            转账 USDC
          </button>
          <button
            onClick={() => handleTransfer(TEST_CONTRACTS.WETH, "WETH")}
            className={btnTex}
            disabled={isConfirming}
          >
            转账 WETH
          </button>
        </div>
      </div>

      {/* 计数器合约 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">计数器合约</h2>
        <p className="text-sm text-gray-600 mb-2">当前计数值:</p>
        <p className={codeTex}>{counterLoading ? "加载中..." : counterValue?.toString() || "0"}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={handleIncrement} className={btnTex} disabled={isConfirming}>
            增加 (+1)
          </button>
          <button onClick={handleDecrement} className={btnTex} disabled={isConfirming}>
            减少 (-1)
          </button>
        </div>
      </div>

      {/* 存储合约 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">存储合约</h2>
        <p className="text-sm text-gray-600 mb-2">当前存储值:</p>
        <p className={codeTex}>{storageLoading ? "加载中..." : storageData?.toString() || "0"}</p>
        <div className="mt-4">
          <label className="block text-sm text-gray-600 mb-2">要存储的值:</label>
          <input
            type="number"
            value={storageValue}
            onChange={(e) => setStorageValue(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs mr-2"
            placeholder="输入要存储的数字"
          />
          <button onClick={handleStore} className={btnTex} disabled={isConfirming}>
            存储值
          </button>
        </div>
      </div>

      {/* 合约地址信息 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">测试合约地址</h2>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">USDC:</span>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{TEST_CONTRACTS.USDC}</code>
          </p>
          <p>
            <span className="font-medium">WETH:</span>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{TEST_CONTRACTS.WETH}</code>
          </p>
          <p>
            <span className="font-medium">计数器:</span>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{TEST_CONTRACTS.COUNTER}</code>
          </p>
          <p>
            <span className="font-medium">存储:</span>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{TEST_CONTRACTS.STORAGE}</code>
          </p>
        </div>
      </div>

      {/* 获取测试代币 */}
      <div className={sectionStyle}>
        <h2 className="text-lg font-semibold mb-2">获取测试代币</h2>
        <p className="text-sm text-gray-600 mb-2">在 Sepolia 测试网上，您可以通过以下方式获取测试代币：</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            •{" "}
            <a
              href="https://sepoliafaucet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Sepolia Faucet
            </a>{" "}
            - 获取 ETH
          </li>
          <li>
            •{" "}
            <a
              href="https://faucet.quicknode.com/ethereum/sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              QuickNode Faucet
            </a>{" "}
            - 获取 ETH
          </li>
          <li>
            •{" "}
            <a
              href="https://www.alchemy.com/faucets/ethereum-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Alchemy Faucet
            </a>{" "}
            - 获取 ETH
          </li>
        </ul>
      </div>
    </div>
  );
}
