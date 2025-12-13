import { useState, useEffect } from "react";
import { useUSDCBalance, useApproveUSDC } from "@/hooks/useUSDC";
import { useAaveDeposit } from "@/hooks/useAaveDeposit";
import { AAVE_POOL_ADDRESS } from "@/config/aave";
import { BICONOMY_CONFIG } from "@/config/biconomy";
import { useSmartAccount } from "@/hooks/useSmartAccount";

export default function AaveDepositPanel() {
  const { balance } = useUSDCBalance();
  const { approve, isApproving } = useApproveUSDC();
  const [usePaymaster, setUsePaymaster] = useState<boolean>(!!BICONOMY_CONFIG?.paymasterUrl);
  const {
    depositUSDC: deposit,
    isDepositing,
    depositStatus,
    txHash,
  } = useAaveDeposit({ forcePaymaster: usePaymaster });
  const { smartAccountAddress } = useSmartAccount();
  const [amount, setAmount] = useState<string>("10");
  const [nativeBalance, setNativeBalance] = useState<number | null>(null);
  const [poolAddress, setPoolAddress] = useState<string>(AAVE_POOL_ADDRESS);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!smartAccountAddress) return setNativeBalance(null);
      try {
        const res = await fetch("https://ethereum-sepolia-rpc.publicnode.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [smartAccountAddress, "latest"],
          }),
        });
        const j = await res.json();
        const hex = j?.result;
        const bal = hex ? Number(BigInt(hex)) / 1e18 : 0;
        if (mounted) setNativeBalance(bal);
      } catch (e) {
        console.warn("Failed to fetch native balance:", e);
        if (mounted) setNativeBalance(null);
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [smartAccountAddress]);

  async function handleApproveAndDeposit() {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    try {
      // Step 1: Approve USDC to Aave Pool
      await approve(poolAddress as `0x${string}`, numAmount);
      console.log("USDC approved to Aave Pool.");

      // Step 2: Deposit into Aave
      await deposit(numAmount, { poolAddress: poolAddress as `0x${string}` });
      console.log("Deposited USDC into Aave.");
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  }

  return (
    <div className="text-gray-500 border p-4 rounded-md bg-white">
      <h3>Deposit USDC into Aave (Sepolia)</h3>
      <p>USDC Balance: {balance} USDC</p>
      <p>
        Smart Account:
        {smartAccountAddress ? (
          <span className="font-mono ml-2">{smartAccountAddress}</span>
        ) : (
          <span className="text-sm text-gray-400">(not created)</span>
        )}
      </p>
      <p>
        Native balance: {nativeBalance === null ? "Checking..." : `${nativeBalance} ETH`}
        {nativeBalance === 0 && (
          <span className="text-red-600 ml-2">
            (Fund this smart account or enable paymaster)
            <button
              onClick={() => window.open("https://faucet.sepolia.dev/", "_blank")}
              className="ml-2 text-xs px-2 py-1 bg-yellow-200 rounded"
            >
              Open Sepolia Faucet
            </button>
          </span>
        )}
      </p>
      <div className="my-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm min-w-28">Aave Pool Address</label>
          <input
            type="text"
            value={poolAddress}
            onChange={(e) => setPoolAddress(e.target.value)}
            className="border p-2 rounded-md flex-1 font-mono"
            placeholder="0x... (Sepolia Pool)"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={usePaymaster} onChange={(e) => setUsePaymaster(e.target.checked)} />
          Use Paymaster (sponsored)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to deposit"
            min="0"
            step="0.01"
            className="border p-2 rounded-md"
          />
          <button
            onClick={handleApproveAndDeposit}
            disabled={isApproving || isDepositing || parseFloat(amount) > balance || nativeBalance === 0}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isApproving ? "Approving..." : isDepositing ? "Depositing..." : "Approve & Deposit to Aave"}
          </button>
        </div>
      </div>

      {depositStatus && (
        <div className="mt-2 text-sm">
          <strong>Status:</strong>
          <span className="ml-2 text-red-700">{depositStatus}</span>
        </div>
      )}

      {txHash && (
        <div className="mt-2 text-sm">
          <span className="font-mono">{txHash}</span>
          <button
            onClick={() => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank")}
            className="ml-2 text-xs px-2 py-1 bg-gray-200 rounded"
          >
            View on Explorer
          </button>
        </div>
      )}
    </div>
  );
}
