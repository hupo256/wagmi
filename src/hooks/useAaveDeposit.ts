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

  // Fetch EIP-1559 gas fee suggestions from a public Sepolia RPC and return decimal strings
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

      const priority = priorityHex ? BigInt(priorityHex) : 1_000_000_000n; // fallback 1 gwei
      const base = baseHex ? BigInt(baseHex) : 0n;
      // conservative buffer
      const maxFee = base + priority * 2n;

      return { maxFeePerGas: maxFee.toString(), maxPriorityFeePerGas: priority.toString() };
    } catch (e) {
      console.warn("Failed to fetch 1559 fees; using defaults", e);
      // 2 gwei / 1 gwei fallback
      return { maxFeePerGas: 2_000_000_000n.toString(), maxPriorityFeePerGas: 1_000_000_000n.toString() };
    }
  };

  const depositUSDC = async (amount: number, options?: { poolAddress?: string }) => {
    if (!smartAccount) return console.error("Smart account not initialized");

    setIsDepositing(true);
    setDepositStatus("Starting deposit...");

    try {
      // 获取智能账户地址
      const smartAccountAddress = await smartAccount.getAccountAddress();

      // 若未使用 Paymaster，则检查智能账户是否有原生余额（用于 prefund）
      if (!usePaymaster) {
        try {
          const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";
          const balRes = await fetch(rpcUrl, {
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
            throw new Error(
              `Smart account ${smartAccountAddress} has zero native balance. Fund it with a small amount of Sepolia ETH or configure a paymaster (paymasterAndData) to prefund user ops.`,
            );
          }
        } catch (e) {
          console.error("Failed balance check for smart account:", e);
          throw e;
        }
      }

      const amountInWei = parseUnits(amount.toString(), USDC_DECIMALS);

      const poolAddress = (options?.poolAddress || AAVE_POOL_ADDRESS) as `0x${string}`;

      // Step 1: 准备 Approve USDC 交易
      const approveTx: Transaction = {
        to: USDC_ADDRESS,
        data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [poolAddress, amountInWei] }),
      };

      // Step 2: 准备 Deposit 交易
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

      // helper to extract/format bundler error info
      const formatBundlerError = async (e: any) => {
        try {
          // Axios-like
          if (e?.response?.data) return JSON.stringify(e.response.data, null, 2);
          // fetch-style response object
          if (e?.response?.text) return await e.response.text();
          // generic
          return String(e?.message || e || "Unknown bundler error");
        } catch (inner) {
          return String(e?.message || e || "Unknown bundler error");
        }
      };

      // Pre-compute fee overrides when using Paymaster (its API requires fee fields as strings)
      const feeOverrides = usePaymaster ? await get1559Fees() : undefined;

      // build approve userOp
      setDepositStatus("Building approve user operation...");
      let approvePartialUserOp: any;
      try {
        approvePartialUserOp = await smartAccount.buildUserOp(
          [approveTx],
          usePaymaster
            ? ({
                // 请求 Paymaster 赞助（避免直接引入 @biconomy/paymaster 以免浏览器打包 Node 全局）
                paymasterServiceData: { mode: "SPONSORED" },
                overrides: feeOverrides,
              } as any)
            : undefined,
        );
      } catch (e: any) {
        const body = await formatBundlerError(e);
        console.error("buildUserOp (approve) failed. Bundler response/body:\n", body);
        setDepositStatus(`Failed to build approve userOp: ${String(e?.message || e)}`);
        throw new Error(`Failed to build approve userOp. Bundler response: ${body}`);
      }

      // safe serialize helper
      const safeUserOp = (u: any) =>
        JSON.parse(JSON.stringify(u, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
      console.log("Approve partial UserOp (safe):", safeUserOp(approvePartialUserOp));

      // --- DIAGNOSTIC: log final approve userOp payload before sending ---
      try {
        const safeApprovePayload = safeUserOp(approvePartialUserOp);
        console.log("[DIAG] Final approve userOp payload:", safeApprovePayload);
      } catch (diagErr) {
        console.warn("[DIAG] Failed to serialize approve userOp payload:", diagErr);
      }

      // helper: send with retry
      const sendUserOpWithRetry = async (userOp: any, label = "userOp") => {
        const maxAttempts = 5;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            setDepositStatus(`Sending ${label} (attempt ${attempt})`);
            const res = await smartAccount.sendUserOp(userOp);
            return res;
          } catch (e: any) {
            const status = e?.response?.status ?? (typeof e?.code === "string" && e.code.includes("429") ? 429 : null);
            const msg = String(e?.message || e || "Unknown error");
            const isRateLimit = status === 429 || msg.includes("429");
            const isServerErr =
              (status !== null && status >= 500 && status < 600) || /5\d{2}/.test(msg) || msg.includes("520");

            if (attempt === maxAttempts || (!isRateLimit && !isServerErr)) {
              setDepositStatus(`Failed to send ${label}: ${msg}`);
              if (e?.response?.data) console.error("Bundler response:", e.response.data);
              throw e;
            }

            const delayMs = Math.min(2000 * 2 ** (attempt - 1), 16000);
            setDepositStatus(
              `Rate limited or server error for ${label}. Retrying attempt ${attempt + 1} in ${Math.round(delayMs / 1000)}s...`,
            );
            console.warn(
              `sendUserOp (${label}) attempt ${attempt} failed (status=${status}). Retrying in ${delayMs}ms...`,
            );
            await new Promise((res) => setTimeout(res, delayMs));
          }
        }
        throw new Error("sendUserOpWithRetry: unexpected exit");
      };

      // send approve
      setDepositStatus("Sending approve user operation...");
      const approveUserOpResponse = await sendUserOpWithRetry(approvePartialUserOp, "approve");
      try {
        console.log("Approve UserOp sent (safe):", safeUserOp(approveUserOpResponse));
      } catch {
        console.log("Approve UserOp sent:", approveUserOpResponse);
      }

      setDepositStatus("Waiting for approve confirmation...");
      const receipt = await approveUserOpResponse.wait();
      console.log("Approve transaction confirmed:", receipt);

      // build deposit
      setDepositStatus("Building deposit user operation...");
      let depositPartialUserOp;
      try {
        depositPartialUserOp = await smartAccount.buildUserOp(
          [depositTx],
          usePaymaster
            ? ({
                paymasterServiceData: { mode: "SPONSORED" },
                overrides: feeOverrides,
              } as any)
            : undefined,
        );
      } catch (err: any) {
        console.warn("buildUserOp for deposit failed, retrying once. Error:", err);
        setDepositStatus("Estimation failed, retrying build for deposit...");
        await new Promise((res) => setTimeout(res, 1000));
        try {
          depositPartialUserOp = await smartAccount.buildUserOp(
            [depositTx],
            usePaymaster
              ? ({
                  paymasterServiceData: { mode: "SPONSORED" },
                  overrides: feeOverrides,
                } as any)
              : undefined,
          );
        } catch (err2: any) {
          const body = await formatBundlerError(err2);
          console.error("buildUserOp (deposit) failed after retry. Bundler response/body:\n", body);
          setDepositStatus(`Failed to build deposit userOp: ${String(err2?.message || err2)}`);
          throw new Error(`Failed to build deposit userOp. Bundler response: ${body}`);
        }
      }

      console.log("Deposit partial UserOp (safe):", safeUserOp(depositPartialUserOp));

      // --- DIAGNOSTIC: log final deposit userOp payload before sending ---
      try {
        console.log("[DIAG] Final deposit userOp payload:", safeUserOp(depositPartialUserOp));
      } catch (diagErr) {
        console.warn("[DIAG] Failed to serialize deposit userOp payload:", diagErr);
      }

      setDepositStatus("Sending deposit user operation...");
      const depositUserOpResponse = await sendUserOpWithRetry(depositPartialUserOp, "deposit");
      try {
        console.log("Deposit UserOp sent (safe):", safeUserOp(depositUserOpResponse));
      } catch {
        console.log("Deposit UserOp sent:", depositUserOpResponse);
      }

      setDepositStatus("Waiting for deposit confirmation...");
      try {
        const depositReceipt = await depositUserOpResponse.wait();
        console.log("Deposit transaction confirmed:", depositReceipt);

        const finalTxHash =
          (depositReceipt as any).transactionHash ||
          (depositReceipt as any).txHash ||
          (depositUserOpResponse as any).userOpHash ||
          JSON.stringify(depositUserOpResponse);
        setTxHash(finalTxHash);
        setDepositStatus("Deposit completed");
        console.log("Final transaction hash:", finalTxHash);
        alert(`Deposit completed! Transaction Hash: ${finalTxHash}`);
      } catch (waitErr: any) {
        // handle timeout waiting for receipt — try querying bundler directly for userOp receipt
        console.error("Error waiting for deposit receipt:", waitErr);
        const userOpHash = (depositUserOpResponse as any)?.userOpHash;
        if (waitErr?.message?.includes("Exceeded maximum duration") && userOpHash) {
          setDepositStatus("Timed out waiting for receipt — querying bundler for userOp receipt...");
          try {
            const bundlerUrl = BICONOMY_CONFIG.bundlerUrl;
            const rpcBody = {
              jsonrpc: "2.0",
              id: 1,
              method: "eth_getUserOperationReceipt",
              params: [userOpHash],
            };
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            headers["x-api-key"] = BICONOMY_CONFIG.apiKey;
            // Poll bundler for the receipt with exponential backoff
            const maxAttempts = 8; // increased from 6
            let receipt: any = null;
            let lastBody: string | null = null;
            const bundlerResponses: string[] = [];
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              setDepositStatus(`Querying bundler for receipt (attempt ${attempt}/${maxAttempts})...`);
              try {
                const res = await fetch(bundlerUrl, {
                  method: "POST",
                  headers,
                  body: JSON.stringify(rpcBody),
                });
                const text = await res.text();
                lastBody = text;
                bundlerResponses.push(`Attempt ${attempt}: ${text}`);
                let parsed: any = null;
                try {
                  parsed = JSON.parse(text);
                } catch {}
                console.log(`Bundler eth_getUserOperationReceipt (attempt ${attempt}) response:`, parsed ?? text);
                const result = parsed?.result ?? null;
                if (result) {
                  receipt = result;
                  break;
                }
              } catch (qErr) {
                console.error(`Error querying bundler (attempt ${attempt}):`, qErr);
                lastBody = String((qErr as any)?.message ?? qErr);
                bundlerResponses.push(`Attempt ${attempt} - error: ${lastBody}`);
              }

              // wait before next attempt (exponential backoff, longer)
              if (attempt < maxAttempts) {
                const delayMs = Math.min(3000 * 2 ** (attempt - 1), 45000);
                await new Promise((r) => setTimeout(r, delayMs));
              }
            }

            // --- DIAGNOSTIC: prepare downloadable log of bundler responses ---
            try {
              const logText = `userOpHash: ${userOpHash}\n` + bundlerResponses.join("\n\n");
              // trigger browser download of the log
              const blob = new Blob([logText], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `userop_receipts_${userOpHash}.log`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              console.log("Bundler responses saved to download:", `userop_receipts_${userOpHash}.log`);
            } catch (dlErr) {
              console.warn("Failed to create downloadable bundler log:", dlErr);
            }

            if (receipt) {
              const finalTxHash = receipt.transactionHash || receipt.txHash || userOpHash;
              setTxHash(finalTxHash);
              setDepositStatus(
                `Receipt found via bundler. Transaction: ${finalTxHash} — check explorer or use eth_getUserOperationReceipt for details.`,
              );
            } else {
              setDepositStatus(
                `No receipt returned from bundler after ${maxAttempts} attempts for userOpHash ${userOpHash}. Last response: ${lastBody}`,
              );
            }
          } catch (qErr) {
            console.error("Failed to query bundler for userOp receipt:", qErr);
            setDepositStatus(`Failed to retrieve receipt from bundler: ${String(qErr)}`);
          }
        } else {
          setDepositStatus(typeof waitErr === "string" ? waitErr : waitErr?.message || "Waiting for receipt failed");
        }
      }
    } catch (err: any) {
      console.error("Deposit failed:", err);
      setDepositStatus(typeof err === "string" ? err : err?.message ? err.message : "Deposit failed");
      alert("Deposit failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDepositing(false);
    }
  };

  return { depositUSDC, isDepositing, txHash, depositStatus };
}
