// pages/aave.tsx 或 components/AaveWithAA.tsx
import { useState } from "react";
import { useAccount } from "wagmi";

// 传统 Wagmi Hooks
import { useUSDCBalance } from "@/hooks/useUSDC";
import { useAUSDCBalance } from "@/hooks/useAavePosition";
import { useAaveUSDCAPY } from "@/hooks/useAaveReserveData";

// AA Hooks
import { useSmartAccountClient } from "@/hooks/useSmartAccountClient";
// import { useWalletClient } from "wagmi";
import { encodeFunctionData, parseAbi } from "viem";

// Addresses
const AAVE_POOL_ADDRESS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export default function AaveWithAA() {
  const { address } = useAccount();
  // const { walletClient } = useWalletClient();
  const { getSmartAccountClient } = useSmartAccountClient();

  // Data
  const { balance: usdcBalance } = useUSDCBalance();
  const { aUSDCBalance } = useAUSDCBalance();
  const { apy } = useAaveUSDCAPY();

  // UI State
  const [amount, setAmount] = useState<string>("10");
  const [mode, setMode] = useState<"eoa" | "aa">("aa"); // 默认 AA 模式
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Estimate interest
  const estimatedInterest = ((parseFloat(amount) || 0) * apy * 30) / 365;

  // === AA Deposit Function ===
  const depositViaAA = async (amt: number) => {
    if (!address) return;
    setIsProcessing(true);
    try {
      const smartAccount = await getSmartAccountClient();
      const amountInWei = BigInt(Math.floor(amt * 1e6));

      // Encode deposit call
      const depositCallData = encodeFunctionData({
        abi: parseAbi(["function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"]),
        functionName: "deposit",
        args: [USDC_ADDRESS, amountInWei, address, 0],
      });

      // ⚠️ 注意：AA 模式下，approve 和 deposit 可合并为 batch，但为简化先假设已 approve
      // 实际生产中建议：先检查 allowance，若不足则 batch approve + deposit

      const userOpResponse = await smartAccount.sendTransaction({
        to: AAVE_POOL_ADDRESS,
        data: depositCallData,
      });

      const receipt = await userOpResponse.wait();
      setTxHash(receipt.transactionHash);
      alert("Deposit via AA successful!");
    } catch (err) {
      console.error("AA Deposit failed:", err);
      alert("AA Deposit failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // === EOA Deposit (复用之前逻辑，此处简化) ===
  const depositViaEOA = async (amt: number) => {
    // 这里应调用你之前的 useApproveUSDC + useAaveDeposit
    // 为简洁，此处仅示意
    alert("EOA mode: please use previous implementation");
  };

  const handleDeposit = async () => {
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0 || numAmt > usdcBalance) {
      alert("Invalid amount");
      return;
    }

    if (mode === "aa") {
      await depositViaAA(numAmt);
    } else {
      await depositViaEOA(numAmt);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "2rem auto",
        padding: "1.5rem",
        border: "1px solid #eee",
        borderRadius: "12px",
      }}
    >
      <h2>🏦 Aave USDC Deposit (with AA)</h2>

      {/* Mode Toggle */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          <input type="radio" checked={mode === "eoa"} onChange={() => setMode("eoa")} /> EOA (MetaMask)
        </label>
        &nbsp;&nbsp;
        <label>
          <input type="radio" checked={mode === "aa"} onChange={() => setMode("aa")} /> AA (Biconomy Smart Account)
        </label>
        <p style={{ fontSize: "0.9em", color: "#666" }}>
          {mode === "aa" ? "✅ Gas abstracted — transaction may be paid in USDC" : "⛽ You pay ETH gas"}
        </p>
      </div>

      {/* Balances */}
      <p>
        USDC Balance: <strong>{usdcBalance.toFixed(2)}</strong> USDC
      </p>
      <p>
        aUSDC Balance: <strong>{aUSDCBalance.toFixed(2)}</strong> aUSDC
      </p>
      <p>
        Current APY: <strong>{(apy * 100).toFixed(2)}%</strong>
      </p>
      <p>
        Estimated interest (30 days): <strong>{estimatedInterest.toFixed(4)}</strong> USDC
      </p>

      {/* Input & Button */}
      <div style={{ marginTop: "1.5rem" }}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to deposit"
          style={{ padding: "8px", marginRight: "8px", width: "120px" }}
        />
        <button
          onClick={handleDeposit}
          disabled={isProcessing || !address}
          style={{
            padding: "8px 16px",
            backgroundColor: mode === "aa" ? "#6a5acd" : "#007aff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "Processing..." : `Deposit via ${mode.toUpperCase()}`}
        </button>
      </div>

      {/* Transaction Hash */}
      {txHash && (
        <p style={{ marginTop: "1rem", fontSize: "0.9em" }}>
          Tx:{" "}
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener">
            {txHash.slice(0, 8)}...{txHash.slice(-6)}
          </a>
        </p>
      )}
    </div>
  );
}
