import { useWalletClient, useAccount, useBalance } from "wagmi";
import { useState } from "react";
import { parseUnits } from "viem";
import { encodeFunctionData } from "viem";
import { createBiconomyAccount } from "../lib/biconomy-client";
import { AAVE_POOL_ADDRESS, AAVE_POOL_ABI, USDC_ADDRESS } from "../config/aave";

export default function Home() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS,
    chainId: 11155111,
  });

  const [isDepositing, setIsDepositing] = useState(false);
  const [status, setStatus] = useState("");

  const handleDeposit = async () => {
    if (!walletClient || !address) return;

    try {
      setIsDepositing(true);
      setStatus("Creating smart account...");

      // 添加 process polyfill
      if (typeof window !== "undefined" && typeof (window as any).process === "undefined") {
        (window as any).process = { env: {} };
      }

      // 1. 创建 Biconomy 智能账户
      const smartAccount = await createBiconomyAccount(walletClient);
      const userOpResponse = await smartAccount.sendTransaction({
        to: AAVE_POOL_ADDRESS,
        data: encodeFunctionData({
          abi: AAVE_POOL_ABI,
          functionName: "deposit",
          args: [USDC_ADDRESS, parseUnits("10", 6), address, 0], // 存 10 USDC
        }),
      });

      setStatus("Transaction sent. Waiting for confirmation...");
      const receipt = await userOpResponse.wait();
      console.log("UserOp receipt:", receipt);
      setStatus("✅ Deposit successful!");
    } catch (error) {
      console.error(error);
      setStatus("❌ Failed: " + (error as Error).message);
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">DeFi + Account Abstraction Demo</h1>

      {/* 账户和余额信息 */}
      <div className="space-y-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600 mb-2">
            Connected:
            <span className="ml-2 font-mono text-blue-600">{address}</span>
          </p>
          <p className="text-gray-600">
            USDC Balance:
            <span className="ml-2 font-medium text-green-600">{usdcBalance?.formatted || "0"} USDC</span>
          </p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mb-6">
        <button
          onClick={handleDeposit}
          disabled={!address || isDepositing}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors
            ${
              !address || isDepositing
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }`}
        >
          {isDepositing ? "Depositing..." : "Deposit 10 USDC to Aave (AA)"}
        </button>
      </div>

      {/* 状态信息 */}
      {status && (
        <div
          className={`p-4 rounded-lg ${
            status.includes("❌")
              ? "bg-red-50 text-red-700"
              : status.includes("✅")
                ? "bg-green-50 text-green-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {status}
        </div>
      )}
    </div>
  );
}
