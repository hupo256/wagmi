import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { type BiconomySmartAccountV2 } from "@biconomy/account";
import { BICONOMY_CONFIG } from "@/config/biconomy";

// Fallbacks (in case env vars are not set)
// Keep these aligned with the working defaults used elsewhere in this repo (`useSmartAccountClient.ts`)
const DEFAULT_BUNDLER_URL = "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd";
// Paymaster is optional. Do NOT default to a random/shared paymaster URL, otherwise the app will spam 417s.
const DEFAULT_PAYMASTER_URL: string | undefined = undefined;

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
      // Paymaster is disabled by default because misconfigured paymasters crash the SDK in some paths.
      // Enable only when explicitly requested via env flag.
      const enablePaymaster = (import.meta as any)?.env?.VITE_ENABLE_PAYMASTER === "true";
      const paymasterUrl = enablePaymaster
        ? normalizePaymasterUrl(BICONOMY_CONFIG?.paymasterUrl || DEFAULT_PAYMASTER_URL)
        : undefined;

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
