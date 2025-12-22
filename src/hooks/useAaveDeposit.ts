// src/hooks/useAaveDeposit.ts - 超简化版
import { useState } from "react";
import { encodeFunctionData, parseAbi, parseUnits } from "viem";
import { useSmartAccountClient } from "./useSmartAccountClient";
import { useAccount } from "wagmi";
import { AAVE_POOL_ADDRESS, USDC_ADDRESS } from "@/config/biconomy";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useAaveDeposit() {
  const { address } = useAccount();
  const { getSmartAccountClient, getSmartAccountAddress } = useSmartAccountClient();

  const [isDepositing, setIsDepositing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<string>("");

  const depositUSDC = async (amount: number) => {
    if (!address) {
      setDepositStatus("❌ Wallet not connected");
      return;
    }

    try {
      setIsDepositing(true);
      setTxHash(null);

      setDepositStatus("Starting deposit...");
      await sleep(500);

      // 1. 获取 Smart Account
      setDepositStatus("Checking USDC balance...");
      const smartAccount = await getSmartAccountClient();
      const smartAccountAddress = await getSmartAccountAddress();

      console.log("Smart Account:", smartAccountAddress);
      await sleep(500);

      const amountInWei = parseUnits(amount.toString(), 6);

      // 2. Approve USDC (单独交易)
      setDepositStatus("Step 1/2: Approving USDC...");

      try {
        const approveTx = {
          to: USDC_ADDRESS,
          data: encodeFunctionData({
            abi: parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]),
            functionName: "approve",
            args: [AAVE_POOL_ADDRESS, amountInWei],
          }),
        };

        console.log("Sending approve...", approveTx);

        // 最简单的发送方式
        const approveResponse = await smartAccount.sendTransaction(approveTx);
        console.log("Approve response:", approveResponse);

        setDepositStatus("Waiting for approve confirmation...");

        // 等待确认
        const approveReceipt = await approveResponse.wait();
        console.log("Approve confirmed:", approveReceipt);

        setDepositStatus("✅ USDC approved");
        await sleep(2000);
      } catch (approveErr: any) {
        console.error("Approve error:", approveErr);
        throw new Error(`Approve failed: ${approveErr.message}`);
      }

      // 3. Deposit to Aave (单独交易)
      setDepositStatus("Step 2/2: Depositing to Aave...");

      try {
        const depositTx = {
          to: AAVE_POOL_ADDRESS,
          data: encodeFunctionData({
            abi: parseAbi(["function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"]),
            functionName: "supply",
            args: [USDC_ADDRESS, amountInWei, smartAccountAddress, 0],
          }),
        };

        console.log("Sending deposit...", depositTx);

        const depositResponse = await smartAccount.sendTransaction(depositTx);
        console.log("Deposit response:", depositResponse);

        setDepositStatus("Waiting for deposit confirmation...");

        const depositReceipt = await depositResponse.wait();
        console.log("Deposit confirmed:", depositReceipt);

        // 提取交易哈希
        const hash = depositReceipt?.transactionHash || depositReceipt?.hash;

        if (hash) {
          setTxHash(hash);
          setDepositStatus(`✅ Deposit successful! Tx: ${hash.slice(0, 10)}...`);
        } else {
          setDepositStatus("✅ Deposit completed");
        }

        return hash;
      } catch (depositErr: any) {
        console.error("Deposit error:", depositErr);
        throw new Error(`Deposit failed: ${depositErr.message}`);
      }
    } catch (error: any) {
      console.error("Transaction failed:", error);

      let errorMsg = error.message || "Transaction failed";

      if (errorMsg.includes("callGasLimit")) {
        errorMsg = `❌ Gas estimation failed. This usually means:

1. 🔄 Try downgrading SDK: pnpm remove @biconomy/account && pnpm add @biconomy/account@4.1.0
2. ⏳ Wait 5 minutes for rate limits to reset
3. 🔑 Get your own Biconomy API key from dashboard.biconomy.io
4. 💰 Ensure Smart Account has enough ETH for gas`;
      }

      setDepositStatus(errorMsg);
      throw error;
    } finally {
      setIsDepositing(false);
    }
  };

  return {
    depositUSDC,
    isDepositing,
    txHash,
    depositStatus,
  };
}
