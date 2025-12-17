import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { useAaveDeposit } from "@/hooks/useAaveDeposit";
import { useUSDCBalance } from "@/hooks/useUSDC";

export default function App() {
  const { isConnected } = useAccount();
  const { eoaAddress, smartAccountAddress, loading } = useSmartAccount();
  const { depositUSDC, isDepositing, txHash, depositStatus } = useAaveDeposit({ forcePaymaster: false });
  const { balance: eoaUsdcBalance } = useUSDCBalance();
  const { balance: smartUsdcBalance } = useUSDCBalance(smartAccountAddress || undefined);
  const { data: smartEthBalance } = useBalance({
    address: smartAccountAddress as `0x${string}` | undefined,
    query: { enabled: !!smartAccountAddress },
  });
  const [amount, setAmount] = useState("1.2");
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!depositStatus) return;
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${depositStatus}`]);
  }, [depositStatus]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🏦 DeFi + AA: Aave Deposit</h1>

      {!isConnected && <p className="text-gray-700">🔌 Connect wallet via RainbowKit</p>}
      {loading && <p className="text-gray-700">⏳ Creating Smart Account...</p>}

      {isConnected && (
        <div className="space-y-1">
          <p className="text-gray-800">
            <strong>EOA:</strong> {eoaAddress}
          </p>
          <p className="text-gray-800">
            <strong>Smart Account:</strong> {smartAccountAddress}
          </p>

          <p className="text-gray-800">
            <strong>EOA USDC Balance:</strong> {eoaUsdcBalance}
          </p>
          <p className="text-gray-800">
            <strong>Smart Account USDC Balance:</strong> {smartUsdcBalance}
          </p>
          <p className="text-gray-800">
            <strong>Smart Account ETH Balance:</strong>{" "}
            {smartEthBalance ? `${formatEther(smartEthBalance.value)} ETH` : "Loading..."}
          </p>

          <div className="flex items-center gap-2 pt-4">
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

          {depositStatus && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Status:</strong> {depositStatus}
              </p>
            </div>
          )}

          {logs.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md max-h-80 overflow-y-auto">
              <p className="text-sm font-medium text-blue-800 mb-2">Operation Logs:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {logs.map((log, index) => (
                  <li key={index}>{log}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="p-4 text-sm text-gray-400 border rounded mt-6">
        <p className="font-medium">💡 Prerequisites:</p>
        <ul className="mt-2 space-y-2">
          <li>
            1. Get test USDC from{" "}
            <a
              href="https://faucet.circle.com/"
              target="_blank"
              className="text-blue-500/70 hover:text-blue-600 underline"
            >
              Circle Faucet
            </a>
          </li>
          <li>
            2. Ensure you're on <strong>Sepolia</strong>{" "}
          </li>
          <li>3. No ETH needed — gas paid by Paymaster!</li>
        </ul>
      </div>
    </div>
  );
}
