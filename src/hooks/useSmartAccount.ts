import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { type BiconomySmartAccountV2 } from "@biconomy/account";
import { BICONOMY_CONFIG } from "@/config/biconomy";
import { SEPOLIA_CHAIN_ID } from "@/config/aave";

export const useSmartAccount = () => {
  const { address: eoaAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;

      setSmartAccount(null);
      setSmartAccountAddress(null);

      if (!eoaAddress || !walletClient) {
        setLoading(false);
        return;
      }

      try {
        // 初始化前的 process polyfill
        if (typeof (globalThis as any).process === "undefined") {
          try {
            (globalThis as any).process = { env: {} };
          } catch (e) {
            console.warn("Failed to add process polyfill:", e);
          }
        }

        // 使用 dynamic import 导入 createSmartAccountClient
        const { createSmartAccountClient } = await import("@biconomy/account");

        // 创建智能账户实例
        const createConfig: any = {
          signer: walletClient,
          bundlerUrl: BICONOMY_CONFIG.bundlerUrl || "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd",
          paymasterUrl: BICONOMY_CONFIG.paymasterUrl,
          chainId: SEPOLIA_CHAIN_ID,
        };

        let sa;
        try {
          sa = await createSmartAccountClient(createConfig);
        } catch (err: any) {
          // 如果出现 chainId mismatch，给出更友好的提示并尝试跳过检查（仅在开发/测试环境可接受）
          const msg = String(err?.message || err);
          if (msg.includes("Chain IDs from signer") || msg.includes("chain id")) {
            console.warn("Bundler chainId mismatch detected. Retrying with skipChainCheck=true. Error:", msg);
            // Retry with skipping chain check
            sa = await createSmartAccountClient({ ...createConfig, skipChainCheck: true });
          } else {
            throw err;
          }
        }

        const saAddress = await sa.getAccountAddress();
        // console.log("Smart account created:", {
        //   address: saAddress,
        //   methods: Object.keys(sa),
        // });

        if (mounted) {
          setSmartAccount(sa);
          setSmartAccountAddress(saAddress);
        }
      } catch (err) {
        console.error("Smart Account init failed:", err);
        if (mounted) {
          setSmartAccount(null);
          setSmartAccountAddress(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [eoaAddress, walletClient]);

  return { eoaAddress, smartAccount, smartAccountAddress, loading };
};
