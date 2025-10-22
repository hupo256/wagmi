// components/AaveFullPanel.tsx
import { useState } from "react";
import { useUSDCBalance, useApproveUSDC } from "@/hooks/useUSDC";
import { useAaveDeposit } from "@/hooks/useAaveDeposit";
import { useAUSDCBalance, useAaveWithdraw } from "@/hooks/useAavePosition";

const AAVE_POOL_ADDRESS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

export default function AaveFullPanel() {
  const { balance: usdcBalance } = useUSDCBalance();
  const { aUSDCBalance, isLoading: loadingAUSDC } = useAUSDCBalance();

  const { approve, isApproving } = useApproveUSDC();
  const { deposit, isDepositing } = useAaveDeposit();
  const { withdraw, isWithdrawing } = useAaveWithdraw();

  const [depositAmount, setDepositAmount] = useState<string>("10");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("10");

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0 || amt > usdcBalance) return;
    try {
      await approve(AAVE_POOL_ADDRESS, amt);
      await deposit(amt);
      alert("Deposit successful!");
    } catch (err) {
      console.error(err);
      alert("Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    if (withdrawAmount === "max") {
      await withdraw("max");
    } else {
      const amt = parseFloat(withdrawAmount);
      if (isNaN(amt) || amt <= 0) return;
      await withdraw(amt);
    }
    alert("Withdrawal initiated!");
  };

  return (
    <div className="text-gray-500 border p-4 rounded-md bg-white">
      <h3>Aave USDC Position (Sepolia)</h3>

      <p>USDC Balance: {usdcBalance.toFixed(2)} USDC</p>
      <p>aUSDC Balance: {loadingAUSDC ? "..." : aUSDCBalance.toFixed(2)} aUSDC</p>

      {/* Deposit */}
      <div className="my-3 flex gap-2">
        <input
          type="number"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="Deposit amount"
          className="border p-2 rounded-md"
        />

        <button
          onClick={handleDeposit}
          disabled={isApproving || isDepositing}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isApproving ? "Approving..." : isDepositing ? "Depositing..." : "Deposit"}
        </button>
      </div>

      {/* Withdraw */}
      <div className="my-3 flex gap-2">
        <input
          type="text"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Withdraw amount (or 'max')"
          className="border p-2 rounded-md"
        />
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isWithdrawing ? "Withdrawing..." : "Withdraw"}
        </button>
      </div>
    </div>
  );
}
