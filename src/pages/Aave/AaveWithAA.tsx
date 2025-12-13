import { useState } from "react";
import { useAccount } from "wagmi";
import { AAVE_POOL_ADDRESS, USDC_ADDRESS } from "@/config/aave";

// 传统 Wagmi Hooks
import { useUSDCBalance } from "@/hooks/useUSDC";
import { useAUSDCBalance } from "@/hooks/useAavePosition";
import { useAaveUSDCAPY } from "@/hooks/useAaveReserveData";

// AA Hooks
import { useSmartAccountClient } from "@/hooks/useSmartAccountClient";
// import { useWalletClient } from "wagmi";
import { encodeFunctionData, parseAbi } from "viem";

export default function AaveWithAA() {
  const { address } = useAccount();
  const { getSmartAccountClient } = useSmartAccountClient();

  // Data
  const { balance: usdcBalance } = useUSDCBalance();
  const { aUSDCBalance } = useAUSDCBalance();
  const { apy } = useAaveUSDCAPY();

  // UI State
  const [amount, setAmount] = useState<string>("5");
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

      console.log("smartAccount:", smartAccount);
      // 兼容不同版本的 Biconomy SDK：部分版本提供 getAccountAddress、部分提供 getAddress / getCounterFactualAddress
      let smartAccountAddress: string | undefined;
      if (typeof smartAccount.getAccountAddress === "function") {
        smartAccountAddress = await smartAccount.getAccountAddress();
      } else if (typeof smartAccount.getAddress === "function") {
        smartAccountAddress = await smartAccount.getAddress();
      } else if (typeof smartAccount.getCounterFactualAddress === "function") {
        smartAccountAddress = await smartAccount.getCounterFactualAddress();
      }
      console.log("Smart Account Address:", smartAccountAddress);

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
      // userOp receipt shape may vary between SDK versions. try common fields.
      const tx = (receipt as any)?.transactionHash ?? (receipt as any)?.userOpHash ?? (receipt as any)?.hash ?? null;
      if (tx) {
        setTxHash(tx);
      } else {
        console.warn("AA deposit receipt has no transaction hash:", receipt);
        setTxHash(null);
      }
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
    <div className="text-gray-500 border p-4 rounded-md bg-white">
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
        <p className="text-sm text-gray-600 pt-4">
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
      <div className="my-3 flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to deposit"
          className="border p-2 rounded-md"
          style={{ padding: "8px", marginRight: "8px", width: "120px" }}
        />
        <button
          onClick={handleDeposit}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
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
