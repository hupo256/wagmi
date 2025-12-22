// src/hooks/useSmartAccount.ts
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSmartAccountClient } from "./useSmartAccountClient";

export function useSmartAccount() {
  const { address: eoaAddress, isConnected } = useAccount();
  const { getSmartAccountAddress, isLoading: clientLoading, error } = useSmartAccountClient();

  const [smartAccountAddress, setSmartAccountAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchSmartAccountAddress = async () => {
      if (!isConnected || !eoaAddress) {
        setSmartAccountAddress("");
        return;
      }

      try {
        setLoading(true);
        const address = await getSmartAccountAddress();

        if (mounted) {
          setSmartAccountAddress(address);
          console.log("Smart Account Address loaded:", address);
        }
      } catch (err) {
        console.error("Failed to get smart account address:", err);
        if (mounted) {
          setSmartAccountAddress("");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSmartAccountAddress();

    return () => {
      mounted = false;
    };
  }, [isConnected, eoaAddress, getSmartAccountAddress]);

  return {
    eoaAddress: eoaAddress || "",
    smartAccountAddress,
    loading: loading || clientLoading,
    error,
  };
}
