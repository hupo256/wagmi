// src/hooks/useSmartAccount.ts
import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useSmartAccountClient } from "./useSmartAccountClient";

export const useSmartAccount = () => {
  const { address: eoaAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { getSmartAccountClient } = useSmartAccountClient();

  const [smartAccount, setSmartAccount] = useState<any | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      setSmartAccount(null);
      setSmartAccountAddress(null);

      if (!eoaAddress || !walletClient) {
        setLoading(false);
        return;
      }

      try {
        const client = await getSmartAccountClient();
        if (!mounted) return;

        let addr: string;
        // 兼容不同版本的 SDK：尝试各种可能的方法获取地址
        if (typeof client.getAccountAddress === "function") {
          addr = await client.getAccountAddress();
        } else if (typeof client.getAddress === "function") {
          addr = await client.getAddress();
        } else if (typeof client.getCounterFactualAddress === "function") {
          addr = await client.getCounterFactualAddress();
        } else {
          throw new Error("No method available to get smart account address");
        }

        if (!addr || typeof addr !== "string" || !addr.startsWith("0x")) {
          throw new Error(`Invalid smart account address: ${addr}`);
        }

        setSmartAccount(client);
        setSmartAccountAddress(addr);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("useSmartAccount init error:", errMsg, err);
        setSmartAccount(null);
        setSmartAccountAddress(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [eoaAddress, walletClient, getSmartAccountClient]);

  return {
    eoaAddress,
    smartAccount,
    smartAccountAddress,
    loading,
  };
};
