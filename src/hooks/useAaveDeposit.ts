import { useState } from "react";
import { encodeFunctionData, parseUnits } from "viem";
import { erc20Abi } from "viem";
import { AAVE_LENDING_POOL, USDC_ADDRESS, USDC_DECIMALS } from "@/config/aave";
import { useSmartAccount } from "./useSmartAccount";
import type { Transaction } from "@biconomy/account";

export function useAaveDeposit() {
  const { smartAccount } = useSmartAccount();
  const [isDepositing, setIsDepositing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const depositUSDC = async (amount: number) => {
    if (!smartAccount) {
      console.error("Smart account not initialized");
      return;
    }

    setIsDepositing(true);
    try {
      // 获取智能账户地址
      const smartAccountAddress = await smartAccount.getAccountAddress();
      const amountInWei = parseUnits(amount.toString(), USDC_DECIMALS);

      // Step 1: 准备 Approve USDC 交易
      const approveTx: Transaction = {
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [AAVE_LENDING_POOL, amountInWei],
        }),
      };

      // Step 2: 准备 Deposit 交易
      const depositTx: Transaction = {
        to: AAVE_LENDING_POOL,
        data: encodeFunctionData({
          abi: [
            {
              inputs: [
                { name: "asset", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "onBehalfOf", type: "address" },
                { name: "referralCode", type: "uint16" },
              ],
              name: "deposit",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          functionName: "deposit",
          args: [USDC_ADDRESS, amountInWei, smartAccountAddress, 0],
        }),
      };

      // Step 3: 执行 approve 和 deposit 交易
      console.log("Building approve UserOp...");
      // 移除所有可选参数，使用最简配置
      const approvePartialUserOp = await smartAccount.buildUserOp([approveTx], {});

      console.log("Sending approve UserOp...");
      const approveUserOpResponse = await smartAccount.sendUserOp(approvePartialUserOp);
      console.log("Approve UserOp sent:", approveUserOpResponse);

      // 等待 approve 交易完成
      console.log("Waiting for approve transaction to confirm...");
      const receipt = await approveUserOpResponse.wait();
      console.log("Approve transaction confirmed:", receipt);

      // 发送 deposit 交易
      console.log("Building deposit UserOp...");
      const depositPartialUserOp = await smartAccount.buildUserOp([depositTx], {});

      console.log("Sending deposit UserOp...");
      const depositUserOpResponse = await smartAccount.sendUserOp(depositPartialUserOp);
      console.log("Deposit UserOp sent:", depositUserOpResponse);

      // 等待 deposit 交易完成
      console.log("Waiting for deposit transaction to confirm...");
      const depositReceipt = await depositUserOpResponse.wait();
      console.log("Deposit transaction confirmed:", depositReceipt);

      // 获取交易哈希
      const finalTxHash =
        depositReceipt.transactionHash ||
        (depositUserOpResponse as any).userOpHash ||
        JSON.stringify(depositUserOpResponse);

      setTxHash(finalTxHash);
      console.log("Final transaction hash:", finalTxHash);
      alert(`Deposit completed! Transaction Hash: ${finalTxHash}`);
    } catch (err) {
      console.error("Deposit failed:", err);
      alert("Deposit failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDepositing(false);
    }
  };

  return { depositUSDC, isDepositing, txHash };
}
