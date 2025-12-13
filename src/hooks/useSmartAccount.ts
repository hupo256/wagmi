import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { type BiconomySmartAccountV2 } from "@biconomy/account";
import { BICONOMY_CONFIG } from "@/config/biconomy";

// Fallbacks (in case env vars are not set)
const DEFAULT_BUNDLER_URL = "https://bundler.biconomy.io/api/v2/11155111/bundler_EySs6k278gKSMuFVymA22J";
// NOTE: For @biconomy/account@4.x, paymaster v1 endpoints are the common stable default.
const DEFAULT_PAYMASTER_URL =
  "https://paymaster.biconomy.io/api/v1/11155111/lKqP4LfWm.929bf343-197e-4ea0-a4e7-4940d1bd7d49";

function normalizePaymasterUrl(url?: string) {
  if (!url) return url;
  // Many projects accidentally paste a v2 paymaster URL which can cause "Expected a V7 response" errors
  // with certain SDK versions. Normalize to v1 by default.
  return url.replace("/api/v2/", "/api/v1/");
}

export const useSmartAccount = () => {
  const { address: eoaAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eoaAddress || !walletClient) return setLoading(false);
    init();
  }, [eoaAddress, walletClient]);

  async function init() {
    try {
      const { createSmartAccountClient } = await import("@biconomy/account");
      const bundlerUrl = BICONOMY_CONFIG?.bundlerUrl || DEFAULT_BUNDLER_URL;
      const paymasterUrl = normalizePaymasterUrl(BICONOMY_CONFIG?.paymasterUrl || DEFAULT_PAYMASTER_URL);

      const config = {
        signer: walletClient!,
        bundlerUrl,
        // Only attach paymaster if we have a URL (enables Gas Abstraction)
        ...(paymasterUrl ? { paymasterUrl } : {}),
      } as any;

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

  return { eoaAddress, smartAccount, smartAccountAddress, loading };
};
