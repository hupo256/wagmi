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
    async function init() {
      if (!eoaAddress || !walletClient) return setLoading(false);

      try {
        const { createSmartAccountClient } = await import("@biconomy/account");
        const config = {
          signer: walletClient,
          bundlerUrl: BICONOMY_CONFIG.bundlerUrl || "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd",
          paymasterUrl: BICONOMY_CONFIG.paymasterUrl,
          apiKey: BICONOMY_CONFIG.apiKey,
          chainId: SEPOLIA_CHAIN_ID,
        };

        const sa = await createSmartAccountClient(config);
        const saAddress = await sa.getAccountAddress();

        setSmartAccount(sa);
        setSmartAccountAddress(saAddress);
      } catch (err) {
        console.error("Smart Account init failed:", err);
        setSmartAccount(null);
        setSmartAccountAddress(null);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [eoaAddress, walletClient]);

  return { eoaAddress, smartAccount, smartAccountAddress, loading };
};
