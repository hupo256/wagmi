// src/hooks/useSmartAccountClient.ts - 简化版
import { useState, useCallback, useRef } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { createSmartAccountClient } from "@biconomy/account";
import { BICONOMY_CONFIG } from "@/config/biconomy";

export function useSmartAccountClient() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 缓存 Smart Account 实例
  const smartAccountRef = useRef<any>(null);
  const addressRef = useRef<string>("");

  const getSmartAccountClient = useCallback(async () => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    // 如果已经创建过且地址相同，直接返回缓存
    if (smartAccountRef.current && addressRef.current === address) {
      console.log("Reusing cached smart account");
      return smartAccountRef.current;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("Creating Smart Account with config:", {
        bundlerUrl: BICONOMY_CONFIG.bundlerUrl,
        chainId: BICONOMY_CONFIG.chainId,
      });

      // 最简化的配置
      const smartAccount = await createSmartAccountClient({
        signer: walletClient,
        bundlerUrl: BICONOMY_CONFIG.bundlerUrl,
        // 启用 Paymaster 以实现 gasless 交易
        biconomyPaymasterApiKey: BICONOMY_CONFIG.apiKey,
        chainId: BICONOMY_CONFIG.chainId,
      });

      console.log("Smart Account created:", smartAccount);

      // 缓存实例
      smartAccountRef.current = smartAccount;
      addressRef.current = address;

      setIsLoading(false);
      return smartAccount;
    } catch (err: any) {
      console.error("Failed to create smart account:", err);
      setError(err.message || "Failed to create smart account");
      setIsLoading(false);
      throw err;
    }
  }, [walletClient, address]);

  const getSmartAccountAddress = useCallback(async () => {
    const account = await getSmartAccountClient();

    // 尝试多种方式获取地址
    if (account.accountAddress) {
      return account.accountAddress;
    }
    if (typeof account.getAccountAddress === "function") {
      return await account.getAccountAddress();
    }
    if (typeof account.getAddress === "function") {
      return await account.getAddress();
    }
    if (account.account?.address) {
      return account.account.address;
    }

    throw new Error("Unable to get smart account address");
  }, [getSmartAccountClient]);

  return {
    getSmartAccountClient,
    getSmartAccountAddress,
    smartAccount: smartAccountRef.current,
    isLoading,
    error,
  };
}
