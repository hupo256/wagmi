import { useState } from "react";
import { useAccount } from "wagmi";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { useAaveDeposit } from "@/hooks/useAaveDeposit";

export default function App() {
  const { isConnected } = useAccount();
  const { eoaAddress, smartAccount, smartAccountAddress, loading } = useSmartAccount();
  const { depositUSDC, isDepositing, txHash } = useAaveDeposit();
  const [amount, setAmount] = useState("100");

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🏦 DeFi + AA: Aave Deposit Demo</h1>

      {!isConnected ? (
        <p className="text-gray-700">🔌 Connect wallet via RainbowKit</p>
      ) : loading ? (
        <p className="text-gray-700">⏳ Creating Smart Account...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-800">
            <strong>EOA:</strong> {eoaAddress}
          </p>
          <p className="text-gray-800">
            <strong>Smart Account:</strong> {smartAccountAddress}
          </p>

          <div className="mt-6 flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="USDC amount"
              className="p-2 border border-gray-300 rounded-md w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => depositUSDC(parseFloat(amount))}
              disabled={isDepositing}
              className={`px-4 py-2 rounded-md text-white ${
                isDepositing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
              }`}
            >
              {isDepositing ? "Depositing..." : "Deposit to Aave"}
            </button>
          </div>

          {txHash && <p className="mt-4 text-green-600">✅ UserOp: {txHash.substring(0, 10)}...</p>}

          <div className="mt-8 text-sm text-gray-600">
            <p className="font-medium">💡 Prerequisites:</p>
            <ul className="mt-2 space-y-2">
              <li>
                1. Get test USDC from{" "}
                <a
                  href="https://faucet.circle.com/"
                  target="_blank"
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  Circle Faucet
                </a>
              </li>
              <li>
                2. Ensure you're on <strong>Sepolia</strong>
              </li>
              <li>3. No ETH needed — gas paid by Paymaster!</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
