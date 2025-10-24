// components/AaveDepositPanel.tsx
import { useState } from "react";
import { useUSDCBalance, useApproveUSDC } from "@/hooks/useUSDC";
import { useAaveDeposit } from "@/hooks/useAaveDeposit";

const AAVE_POOL_ADDRESS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

export default function AaveDepositPanel() {
  const { balance } = useUSDCBalance();
  const { approve, isApproving } = useApproveUSDC();
  const { deposit, isDepositing } = useAaveDeposit();
  const [amount, setAmount] = useState<string>("10");

  const handleApproveAndDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Invalid amount");
      return;
    }

    try {
      // Step 1: Approve USDC to Aave Pool
      await approve(AAVE_POOL_ADDRESS, numAmount);

      // Step 2: Deposit into Aave
      await deposit(numAmount);

      alert("Deposit successful!");
    } catch (err) {
      console.error("Transaction failed:", err);
      alert("Transaction failed");
    }
  };

  return (
    <div className="text-gray-500 border p-4 rounded-md bg-white">
      <h3>Deposit USDC into Aave (Sepolia)</h3>
      <p>USDC Balance: {balance} USDC</p>
      <div className="my-3 flex gap-2">
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
          disabled={isApproving || isDepositing || parseFloat(amount) > balance}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isApproving ? "Approving..." : isDepositing ? "Depositing..." : "Approve & Deposit to Aave"}
        </button>
      </div>
    </div>
  );
}
