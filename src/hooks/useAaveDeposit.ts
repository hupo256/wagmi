import { useState } from "react";
import { encodeFunctionData, parseUnits } from "viem";
import { erc20Abi } from "viem";
import { AAVE_LENDING_POOL, USDC_ADDRESS, USDC_DECIMALS } from "@/config/aave";
import { useSmartAccount } from "./useSmartAccount";

export function useAaveDeposit() {
  const { smartAccount } = useSmartAccount();
  const [isDepositing, setIsDepositing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const depositUSDC = async (amount: number) => {
    if (!smartAccount) return;

    setIsDepositing(true);
    try {
      // 获取智能账户地址
      const smartAccountAddress = await smartAccount.getAccountAddress();
      const amountInWei = parseUnits(amount.toString(), USDC_DECIMALS);

      // Step 1: Approve USDC to Aave LendingPool
      const approveTx = {
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [AAVE_LENDING_POOL, amountInWei],
        }),
      };

      // Step 2: 准备 Deposit 参数
      const depositTx = {
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

      // 发送 approve 交易
      const approveOp = await smartAccount.sendTransaction(approveTx);
      await approveOp.wait();

      // 准备并发送 deposit 交易
      const depositOp = await smartAccount.sendTransaction({
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
          args: [USDC_ADDRESS, amountInWei, await smartAccount.getAccountAddress(), 0],
        }),
      });
      console.log("Deposit transactions:", { approveOp, depositOp });

      // 等待 deposit 完成并记录交易哈希
      const receipt = await depositOp.wait();
      console.log("Deposit receipt:", receipt);

      const txHash = depositOp.userOpHash;
      setTxHash(txHash);
      alert(`Deposit initiated! UserOp Hash: ${txHash}`);
    } catch (err) {
      console.error("Deposit failed:", err);
      alert("Deposit failed");
    } finally {
      setIsDepositing(false);
    }
  };

  return { depositUSDC, isDepositing, txHash };
}
