import { useState } from "react";
import { encodeFunctionData, parseUnits } from "viem";
import { erc20Abi } from "viem";
import { AAVE_POOL_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from "@/config/aave";
import { useSmartAccount } from "./useSmartAccount";
import { BICONOMY_CONFIG } from "@/config/biconomy";
import type { Transaction } from "@biconomy/account";

export function useAaveDeposit(opts?: { forcePaymaster?: boolean }) {
  const { smartAccount } = useSmartAccount();
  const [isDepositing, setIsDepositing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const usePaymaster = opts?.forcePaymaster ?? !!BICONOMY_CONFIG?.paymasterUrl;

  const depositUSDC = async (amount: number) => {
    if (!smartAccount) return setDepositStatus("Smart account not initialized");

    setIsDepositing(true);
    setDepositStatus("Starting deposit...");

    try {
      const smartAccountAddress = await smartAccount.getAccountAddress();

      // Check USDC balance
      setDepositStatus("Checking USDC balance...");
      const usdcBalanceRes = await fetch("https://ethereum-sepolia-rpc.publicnode.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
            {
              to: USDC_ADDRESS,
              data: `0x70a08231000000000000000000000000${smartAccountAddress.slice(2)}`,
            },
            "latest",
          ],
        }),
      });
      const usdcBalanceJson = await usdcBalanceRes.json();
      const usdcBalanceHex = usdcBalanceJson?.result;
      const usdcBalance = usdcBalanceHex ? BigInt(usdcBalanceHex) : BigInt(0);
      const requiredAmount = parseUnits(amount.toString(), USDC_DECIMALS);
      if (usdcBalance < requiredAmount) {
        throw new Error(`Insufficient USDC. Balance: ${Number(usdcBalance) / 1e6}, Required: ${amount}`);
      }

      // Check native balance if not using paymaster
      if (!usePaymaster) {
        setDepositStatus("Checking native balance...");
        const balRes = await fetch("https://ethereum-sepolia-rpc.publicnode.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [smartAccountAddress, "latest"],
          }),
        });
        const balJson = await balRes.json();
        const balanceHex = balJson?.result;
        const nativeBalance = balanceHex ? BigInt(balanceHex) : BigInt(0);
        if (nativeBalance === BigInt(0)) {
          throw new Error("Smart account has zero native balance. Fund with Sepolia ETH or use paymaster.");
        }
      }

      const amountInWei = parseUnits(amount.toString(), USDC_DECIMALS);
      const poolAddress = AAVE_POOL_ADDRESS as `0x${string}`;

      // Prepare transactions
      const approveTx: Transaction = {
        to: USDC_ADDRESS,
        data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [poolAddress, amountInWei] }),
      };

      const depositTx: Transaction = {
        to: poolAddress,
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

      // Build UserOp options - only include paymaster if enabled
      // Don't set gas parameters manually when using paymaster, let it calculate automatically
      const buildUserOpOptions = usePaymaster
        ? {
            paymasterServiceData: {
              mode: "SPONSORED" as const,
            },
          }
        : undefined;

      // Build and send approve
      setDepositStatus("Building approve transaction...");
      const approveUserOp = await smartAccount.buildUserOp([approveTx], buildUserOpOptions as any);

      setDepositStatus("Sending approve transaction...");
      const approveResponse = await smartAccount.sendUserOp(approveUserOp);

      setDepositStatus("Waiting for approve confirmation...");
      await approveResponse.wait();

      // Build and send deposit
      setDepositStatus("Building deposit transaction...");
      const depositUserOp = await smartAccount.buildUserOp([depositTx], buildUserOpOptions as any);

      setDepositStatus("Sending deposit transaction...");
      const depositResponse = await smartAccount.sendUserOp(depositUserOp);

      setDepositStatus("Waiting for deposit confirmation...");
      const depositReceipt = await depositResponse.wait();

      const finalTxHash =
        (depositReceipt as any)?.transactionHash ??
        (depositReceipt as any)?.userOpHash ??
        (depositReceipt as any)?.hash ??
        null;
      setTxHash(finalTxHash);
      setDepositStatus("Deposit completed!");
    } catch (err: any) {
      console.error("Deposit failed:", err);
      setDepositStatus(`Deposit failed: ${err.message || String(err)}`);
    } finally {
      setIsDepositing(false);
    }
  };

  return { depositUSDC, isDepositing, txHash, depositStatus };
}
