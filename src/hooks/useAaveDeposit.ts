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

  const get1559Fees = async (): Promise<{ maxFeePerGas: string; maxPriorityFeePerGas: string }> => {
    try {
      const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";
      const [prioRes, blockRes] = await Promise.all([
        fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_maxPriorityFeePerGas", params: [] }),
        }),
        fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "eth_getBlockByNumber", params: ["latest", false] }),
        }),
      ]);

      const prioJson = await prioRes.json();
      const blockJson = await blockRes.json();
      const priorityHex = prioJson?.result as string | undefined;
      const baseHex = blockJson?.result?.baseFeePerGas as string | undefined;

      const priority = priorityHex ? BigInt(priorityHex) : 1_000_000_000n;
      const base = baseHex ? BigInt(baseHex) : 0n;
      const maxFee = base + priority * 2n;

      return { maxFeePerGas: maxFee.toString(), maxPriorityFeePerGas: priority.toString() };
    } catch (e) {
      return { maxFeePerGas: "2000000000", maxPriorityFeePerGas: "1000000000" };
    }
  };

  const depositUSDC = async (amount: number) => {
    if (!smartAccount) {
      setDepositStatus("Smart account not initialized");
      return;
    }

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

      // Build and send approve
      setDepositStatus("Building approve transaction...");
      const feeOverrides = usePaymaster ? await get1559Fees() : undefined;
      const approveUserOp = await smartAccount.buildUserOp(
        [approveTx],
        usePaymaster ? { paymasterServiceData: { mode: "SPONSORED" }, overrides: feeOverrides } : undefined,
      );
      setDepositStatus("Sending approve transaction...");
      const approveResponse = await smartAccount.sendUserOp(approveUserOp);
      setDepositStatus("Waiting for approve confirmation...");
      await approveResponse.wait();

      // Build and send deposit
      setDepositStatus("Building deposit transaction...");
      const depositUserOp = await smartAccount.buildUserOp(
        [depositTx],
        usePaymaster ? { paymasterServiceData: { mode: "SPONSORED" }, overrides: feeOverrides } : undefined,
      );
      setDepositStatus("Sending deposit transaction...");
      const depositResponse = await smartAccount.sendUserOp(depositUserOp);
      setDepositStatus("Waiting for deposit confirmation...");
      const depositReceipt = await depositResponse.wait();

      const finalTxHash = depositReceipt.transactionHash || depositReceipt.txHash || depositResponse.userOpHash;
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
