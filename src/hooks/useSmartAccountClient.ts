// hooks/useSmartAccountClient.ts
import { useWalletClient } from "wagmi";
import { createSmartAccountClient } from "@biconomy/account";
// import { createClient } from "@biconomy/common";

const BUNDLER_URL = "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd";
const PAYMASTER_URL = "https://paymaster.biconomy.io/api/v1/11155111/nJPK7B3ru.dd";
const CHAIN_ID = 11155111; // Sepolia

let smartAccountClientPromise: Promise<any> | null = null;

export function useSmartAccountClient() {
  const { data: walletClient } = useWalletClient();

  const getSmartAccountClient = async () => {
    if (!walletClient) throw new Error("Wallet not connected");

    if (!smartAccountClientPromise) {
      smartAccountClientPromise = (async () => {
        const smartAccount = await createSmartAccountClient({
          signer: walletClient,
          bundlerUrl: BUNDLER_URL,
          paymasterUrl: PAYMASTER_URL, // 可选：实现 Gas 抽象
          // index: 0, // 多账户支持
        });
        return smartAccount;
      })();
    }

    return smartAccountClientPromise;
  };

  return { getSmartAccountClient };
}
