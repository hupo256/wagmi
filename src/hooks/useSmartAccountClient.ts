// hooks/useSmartAccountClient.ts
import { useWalletClient } from "wagmi";
// import { smartData } from "@/common/smartData";
import type { BiconomySmartAccountV2 } from "@biconomy/account";
// 注意：不要在顶层静态导入 @biconomy/account，因为其打包产物可能在模块初始化时访问 `process` 等 Node 全局。
// 改为在需要时动态导入，保证浏览器环境不会在模块评估阶段抛出 `process is not defined`。
// import { createClient } from "@biconomy/common";

const BUNDLER_URL = "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd";
const PAYMASTER_URL = "https://paymaster.biconomy.io/api/v1/11155111/nJPK7B3ru.dd";
const CHAIN_ID = 11155111; // Sepolia

let smartAccountClientPromise: Promise<BiconomySmartAccountV2> | null = null;

export function useSmartAccountClient() {
  const { data: walletClient } = useWalletClient();

  const getSmartAccountClient = async (): Promise<BiconomySmartAccountV2> => {
    if (!walletClient) throw new Error("Wallet not connected");

    if (!smartAccountClientPromise) {
      smartAccountClientPromise = (async () => {
        // 在浏览器环境中，某些包（或其依赖）可能在模块评估或运行时访问 `process`。
        // 如果没有 process，就临时挂载一个最小的 polyfill，避免 ReferenceError。
        if (typeof (globalThis as any).process === "undefined") {
          try {
            (globalThis as any).process = { env: {} };
          } catch (e) {
            // 忽略赋值失败（非严格环境可能会失败），不过大多数浏览器允许设置 globalThis.process
          }
        }

        const { createSmartAccountClient } = await import("@biconomy/account");
        const smartAccount = (await createSmartAccountClient({
          signer: walletClient,
          bundlerUrl: BUNDLER_URL,
          paymasterUrl: PAYMASTER_URL, // 可选：实现 Gas 抽象
          // index: 0, // 多账户支持
        })) as BiconomySmartAccountV2;
        return smartAccount;
      })();
    }

    return smartAccountClientPromise;
  };

  return { getSmartAccountClient };
}
