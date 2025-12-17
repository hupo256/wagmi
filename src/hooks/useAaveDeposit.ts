import { useState } from "react";
import { useWalletClient } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";
import { erc20Abi } from "viem";
import { AAVE_POOL_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from "@/config/aave";
import { useSmartAccount } from "./useSmartAccount";
import { BICONOMY_CONFIG } from "@/config/biconomy";
import type { Transaction } from "@biconomy/account";

export function useAaveDeposit(opts?: { forcePaymaster?: boolean }) {
  const { smartAccount } = useSmartAccount();
  const { data: walletClient } = useWalletClient();
  const [isDepositing, setIsDepositing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  // Paymaster is OFF by default. Turn it on only when explicitly forcing it.
  const paymasterEnabled = opts?.forcePaymaster === true;
  // If the caller explicitly forces paymaster, we won't silently fall back.
  const allowPaymasterFallback = opts?.forcePaymaster === true ? false : true;

  const isPaymasterV7Error = (err: unknown) => {
    const msg = (err as any)?.message ? String((err as any).message) : String(err);
    return (
      msg.includes("Expected a V7 response") ||
      msg.includes("Invalid response from the gas estimator") ||
      msg.includes("Expectation Failed") ||
      msg.includes(" 417 ") ||
      msg.includes("417")
    );
  };

  const isLikelyPaymasterBuildError = (err: unknown) => {
    const msg = (err as any)?.message ? String((err as any).message) : String(err);
    // We've seen this specific crash when the paymaster/gas estimator returns an unexpected payload.
    if (msg.includes("Cannot destructure property 'callGasLimit'")) return true;
    if (msg.toLowerCase().includes("paymaster")) return true;
    if (msg.includes("gas estimator")) return true;
    if (msg.includes("Expectation Failed") || msg.includes("417")) return true;
    return false;
  };

  // Keep aligned with `useSmartAccountClient.ts` / `useSmartAccount.ts` defaults.
  const BUNDLER_URL_FALLBACK = "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd";
  const bundlerUrl = BICONOMY_CONFIG?.bundlerUrl || BUNDLER_URL_FALLBACK;

  // A paymaster-less smart account client used for "self-paid gas" buildUserOp, to avoid SDK paymaster codepaths.
  let selfPaidClientPromise: Promise<any> | null = null;
  const getSelfPaidSmartAccountClient = async () => {
    if (selfPaidClientPromise) return selfPaidClientPromise;
    if (!walletClient) throw new Error("Wallet client not ready (connect wallet first)");
    selfPaidClientPromise = (async () => {
      const { createSmartAccountClient } = await import("@biconomy/account");
      // Intentionally omit paymasterUrl to force self-paid path inside SDK.
      const sa = await createSmartAccountClient({
        signer: walletClient,
        bundlerUrl,
      } as any);
      return sa as any;
    })();
    return selfPaidClientPromise;
  };

  const bundlerRpc = async (method: string, params: any[]) => {
    const res = await fetch(bundlerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const j = await res.json();
    if (j?.error) {
      const msg = j?.error?.message ? String(j.error.message) : JSON.stringify(j.error);
      throw new Error(`Bundler RPC error (${method}): ${msg}`);
    }
    return j?.result;
  };

  const resolveEntryPoint = async () => {
    // Try SDK-provided helpers first (shape varies by version), then fall back to the common v0.6 EntryPoint.
    const sa: any = smartAccount as any;
    if (typeof sa?.getEntryPointAddress === "function") {
      try {
        const ep = await sa.getEntryPointAddress();
        if (ep) return String(ep);
      } catch {
        // ignore
      }
    }
    const ep =
      sa?.entryPointAddress ??
      sa?.entryPoint ??
      // ERC-4337 v0.6 EntryPoint (widely used)
      "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
    return String(ep);
  };

  const sendUserOpViaBundler = async (userOp: any) => {
    const entryPoint = await resolveEntryPoint();
    // bundler returns userOpHash if accepted; otherwise it returns a JSON-RPC error (we surface it).
    const userOpHash = await bundlerRpc("eth_sendUserOperation", [userOp, entryPoint]);
    return String(userOpHash);
  };

  const getSelfPaidFeeOverrides = async () => {
    // When not using a paymaster, we can bump fees to reduce the chance of the UserOp getting stuck.
    // Using eth_gasPrice as a simple signal (works on Sepolia too).
    const res = await fetch("https://ethereum-sepolia-rpc.publicnode.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
    });
    const j = await res.json();
    const gp = j?.result ? BigInt(j.result) : BigInt(0);
    // bump 2x as maxFee; 1 gwei tip
    const maxFeePerGas = gp > 0n ? gp * 2n : 50_000_000_000n; // fallback 50 gwei
    const maxPriorityFeePerGas = 1_500_000_000n; // 1.5 gwei
    // SDK accepts strings in many versions; keep as decimal strings to avoid hex confusion.
    return {
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    };
  };

  const getManualGasLimits = () => {
    // Conservative defaults to bypass flaky bundler gas-estimator responses.
    // Values are intentionally generous for Sepolia.
    return {
      callGasLimit: "800000",
      verificationGasLimit: "800000",
      preVerificationGas: "120000",
      // v0.7 paymaster gas fields (harmless if ignored by SDK/version)
      paymasterVerificationGasLimit: "0",
      paymasterPostOpGasLimit: "0",
    };
  };

  const waitForUserOpReceiptViaBundler = async (
    userOpHash: string,
    opts?: { timeoutMs?: number; intervalMs?: number },
  ) => {
    const timeoutMs = opts?.timeoutMs ?? 480_000; // 8 minutes (Sepolia/bundler can be slow)
    const intervalMs = opts?.intervalMs ?? 2_000; // 2 seconds
    const startedAt = Date.now();
    let lastKnown: boolean | null = null;

    while (Date.now() - startedAt < timeoutMs) {
      const receipt = (await bundlerRpc("eth_getUserOperationReceipt", [userOpHash])) ?? null;
      if (receipt) return receipt;

      // Optional extra signal: is the bundler aware of this UserOp at all?
      const byHash = await bundlerRpc("eth_getUserOperationByHash", [userOpHash]);
      const known = !!byHash;
      lastKnown = known;
      setDepositStatus(
        known
          ? `UserOp pending on bundler... (${userOpHash.slice(0, 10)}...)`
          : `Bundler has not indexed this UserOp yet... (${userOpHash.slice(0, 10)}...)`,
      );
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(
      `Timed out waiting for bundler receipt for userOpHash ${userOpHash} (bundler: ${bundlerUrl}, bundlerKnown=${String(
        lastKnown,
      )}).`,
    );
  };

  const depositUSDC = async (amount: number) => {
    if (!smartAccount) return setDepositStatus("Smart account not initialized");

    setIsDepositing(true);
    setDepositStatus("Starting deposit...");

    try {
      const smartAccountAddress = await smartAccount.getAccountAddress();

      const assertSmartAccountHasNativeGas = async () => {
        setDepositStatus("Checking smart account ETH balance (gas)...");
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
          throw new Error(
            "Paymaster is unavailable and smart account has 0 Sepolia ETH for gas. Please fund the smart account with a small amount of Sepolia ETH, or fix the Paymaster configuration.",
          );
        }
      };

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

      // If paymaster is disabled, ensure the smart account can pay gas.
      if (!paymasterEnabled) await assertSmartAccountHasNativeGas();

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
      let buildUserOpOptions: any = paymasterEnabled
        ? { paymasterServiceData: { mode: "SPONSORED" as const } }
        : undefined;

      const buildUserOp = async (txs: Transaction[]) => {
        try {
          if (!buildUserOpOptions) {
            // self-paid mode: bump fees
            const fee = await getSelfPaidFeeOverrides();
            const sa = await getSelfPaidSmartAccountClient().catch(() => smartAccount);
            return await (sa as any).buildUserOp(txs, { ...(fee as any) } as any);
          }
          return await smartAccount.buildUserOp(txs, buildUserOpOptions);
        } catch (e) {
          // If bundler gas estimation returns an unexpected payload, the SDK can crash with a destructure TypeError.
          // Retry with explicit gas limit fields to bypass estimation.
          const msg = (e as any)?.message ? String((e as any).message) : String(e);
          if (msg.includes("Cannot destructure property 'callGasLimit'")) {
            setDepositStatus("Gas estimation failed. Retrying with manual gas limits...");
            const fee = await getSelfPaidFeeOverrides();
            const gasLimits = getManualGasLimits();
            const sa = await getSelfPaidSmartAccountClient().catch(() => smartAccount);
            return await (sa as any).buildUserOp(txs, { ...(fee as any), ...(gasLimits as any) } as any);
          }

          if (paymasterEnabled && allowPaymasterFallback && (isPaymasterV7Error(e) || isLikelyPaymasterBuildError(e))) {
            // Paymaster endpoint/key/config is incompatible or temporarily down.
            setDepositStatus("Paymaster failed. Falling back to self-paid gas (smart account needs Sepolia ETH)...");
            await assertSmartAccountHasNativeGas();
            buildUserOpOptions = undefined;
            const fee = await getSelfPaidFeeOverrides();
            const sa = await getSelfPaidSmartAccountClient().catch(() => smartAccount);
            return await (sa as any).buildUserOp(txs, { ...(fee as any), ...(getManualGasLimits() as any) } as any);
          }
          throw e;
        }
      };

      // Helper: build & send a UserOp, retrying with manual gas limits if bundler/gas-estimator fails
      const sendUserOpWithRetry = async (txs: Transaction[]) => {
        try {
          const userOp = await buildUserOp(txs);
          return await sendUserOpViaBundler(userOp);
        } catch (e: any) {
          const msg = e?.message || String(e);
          if (msg.includes("Cannot destructure property 'callGasLimit'") || isLikelyPaymasterBuildError(e)) {
            setDepositStatus("Bundler gas estimation failed. Retrying with manual gas limits...");
            const fee = await getSelfPaidFeeOverrides();
            const gasLimits = getManualGasLimits();
            const sa = await getSelfPaidSmartAccountClient().catch(() => smartAccount);
            const userOp2 = await (sa as any).buildUserOp(txs, { ...(fee as any), ...(gasLimits as any) } as any);
            return await sendUserOpViaBundler(userOp2);
          }
          throw e;
        }
      };

      // Build and send approve
      setDepositStatus("Building approve transaction...");
      const approveUserOpHash = await sendUserOpWithRetry([approveTx]);
      setTxHash(String(approveUserOpHash));
      setDepositStatus("Waiting for approve confirmation (polling bundler)...");
      await waitForUserOpReceiptViaBundler(String(approveUserOpHash));

      // Build and send deposit
      setDepositStatus("Building deposit transaction...");
      const depositUserOpHash = await sendUserOpWithRetry([depositTx]);
      setTxHash(String(depositUserOpHash));
      setDepositStatus("Waiting for deposit confirmation (polling bundler)...");
      const depositReceipt: any = await waitForUserOpReceiptViaBundler(String(depositUserOpHash));

      const finalTxHash =
        (depositReceipt as any)?.transactionHash ??
        (depositReceipt as any)?.receipt?.transactionHash ??
        (depositReceipt as any)?.userOpHash ??
        (depositReceipt as any)?.hash ??
        null;
      setTxHash(finalTxHash);
      setDepositStatus("Deposit completed!");
    } catch (err: any) {
      console.error("Deposit failed:", err);
      const msg = err?.message || String(err);
      setDepositStatus(`Deposit failed: ${msg}`);
    } finally {
      setIsDepositing(false);
    }
  };

  return { depositUSDC, isDepositing, txHash, depositStatus };
}
