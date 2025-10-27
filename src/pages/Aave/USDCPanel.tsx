import { useState } from "react";
import { useUSDCBalance, useApproveUSDC } from "@/hooks/useUSDC";
import { AAVE_POOL_ADDRESS } from "@/config/aave";

export default function USDCPanel() {
  const { balance, isLoading: loadingBalance } = useUSDCBalance();
  const { approve, isApproving } = useApproveUSDC();
  const [amount, setAmount] = useState<string>("5");

  const handleApprove = async () => {
    try {
      const txHash = await approve(AAVE_POOL_ADDRESS, parseFloat(amount));
      console.log("Approval tx:", txHash);
      alert("Approval successful!");
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Approval failed");
    }
  };

  return (
    <div className="text-gray-500 border p-4 rounded-md bg-white">
      <h3>USDC (Sepolia)</h3>
      <p>Balance: {loadingBalance ? "Loading..." : `${balance} USDC`}</p>

      <div className="my-3 flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to approve"
          className="border p-2 rounded-md"
        />
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isApproving ? "Approving..." : "Approve USDC to Aave"}
        </button>
      </div>
    </div>
  );
}
