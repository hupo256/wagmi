import { useState } from "react";
import { useSmartAccount } from "@/hooks/useSmartAccount";
import { useAccount } from "wagmi";

export default function App() {
  const { address } = useAccount();
  const { eoaAddress, smartAccountAddress, smartAccount, loading } = useSmartAccount();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTestTransaction = async () => {
    if (!smartAccount || !smartAccountAddress) {
      setError("Smart account or address not initialized");
      return;
    }

    // 验证地址格式
    if (!smartAccountAddress.startsWith("0x") || smartAccountAddress.length !== 42) {
      setError(`Invalid smart account address format: ${smartAccountAddress}`);
      return;
    }

    setSending(true);
    setError(null);
    try {
      // 发送 0 ETH 到自己（测试交易）
      const tx = await smartAccount.sendTransaction({
        transaction: {
          to: smartAccountAddress,
          value: 0n,
          data: "0x",
        },
      });

      console.log("UserOp hash:", tx);
      setTxHash(tx);
      alert(`Transaction sent! UserOp hash: ${tx}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Transaction failed:", errMsg, error);
      setError(errMsg);
      alert(`Transaction failed: ${errMsg}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>☕ Biconomy Smart Account Demo (Sepolia)</h1>

      {!address ? (
        <p>🔌 Please connect your wallet</p>
      ) : (
        <div>
          <p>
            <strong>EOA Address:</strong> {eoaAddress}
          </p>
          {loading ? (
            <p>⏳ Initializing Smart Account...</p>
          ) : smartAccountAddress ? (
            <>
              <p>
                <strong>Smart Account:</strong> {smartAccountAddress}
              </p>
              {error && <p style={{ color: "red", marginTop: "0.5rem" }}>❌ Error: {error}</p>}
              <button
                onClick={sendTestTransaction}
                disabled={sending}
                style={{
                  marginTop: "1rem",
                  padding: "8px 16px",
                  backgroundColor: sending ? "#ccc" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending..." : "Send Test Tx (0 ETH)"}
              </button>
              {txHash && <p style={{ marginTop: "1rem", color: "green" }}>✅ UserOp Hash: {txHash}</p>}
            </>
          ) : (
            <p>❌ Failed to create Smart Account</p>
          )}
        </div>
      )}

      <div style={{ marginTop: "2rem", fontSize: "0.9em", color: "#666" }}>
        <p>💡 This demo uses Biconomy AA with Paymaster (gasless).</p>
        <p>
          Make sure you're on <strong>Sepolia</strong> network.
        </p>
      </div>
    </div>
  );
}
