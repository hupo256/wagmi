import { sepolia } from "viem/chains";
import { type WalletClient } from "viem";
import { BICONOMY_CONFIG } from "@/config/biconomy";

export const createBiconomyAccount = async (walletClient: WalletClient) => {
  // 在导入 Biconomy SDK 前确保 process 对象存在
  if (typeof process === "undefined") {
    (globalThis as any).process = {
      env: {},
    };
  }

  // 使用 dynamic import 导入 createSmartAccountClient
  const { createSmartAccountClient } = await import("@biconomy/account");

  // 端点版本与链 ID 校验（在创建 client 之前尽早失败）
  const extractChainId = (url?: string) => {
    if (!url) return null;
    const m = url.match(/api\/v\d+\/(\d+)\//);
    return m ? Number(m[1]) : null;
  };
  const isV3 = (url?: string) => !!url && /api\/v3\//.test(url);

  if (isV3(BICONOMY_CONFIG.bundlerUrl) || isV3(BICONOMY_CONFIG.paymasterUrl)) {
    const details = {
      bundlerUrl: BICONOMY_CONFIG.bundlerUrl,
      paymasterUrl: BICONOMY_CONFIG.paymasterUrl,
    };
    console.error(
      "[Biconomy Config] Detected v3 endpoint(s). This project uses @biconomy/account and requires Legacy v2 endpoints.",
      details,
    );
    throw new Error(
      "Biconomy endpoint version mismatch: detected /api/v3/. Please create Legacy infrastructure Bundler & Paymaster on Sepolia and use /api/v2/11155111/... endpoints.",
    );
  }

  const bundlerChainId = extractChainId(BICONOMY_CONFIG.bundlerUrl);
  const paymasterChainId = extractChainId(BICONOMY_CONFIG.paymasterUrl);
  const walletChainId = (walletClient as any)?.chain?.id ?? sepolia.id;

  if (
    (bundlerChainId && bundlerChainId !== walletChainId) ||
    (paymasterChainId && paymasterChainId !== walletChainId) ||
    (bundlerChainId && paymasterChainId && bundlerChainId !== paymasterChainId)
  ) {
    const details = {
      walletChainId,
      bundlerChainId,
      paymasterChainId,
      bundlerUrl: BICONOMY_CONFIG.bundlerUrl,
      paymasterUrl: BICONOMY_CONFIG.paymasterUrl,
    };
    console.error("[Biconomy Config] ChainId mismatch detected:", details);
    throw new Error(
      `Biconomy config chainId mismatch. Check your Dashboard endpoints. wallet=${walletChainId}, bundler=${bundlerChainId}, paymaster=${paymasterChainId}`,
    );
  }

  const smartAccount = await createSmartAccountClient({
    signer: walletClient,
    bundlerUrl: BICONOMY_CONFIG.bundlerUrl,
    paymasterUrl: BICONOMY_CONFIG.paymasterUrl,
    apiKey: BICONOMY_CONFIG.apiKey,
    chainId: sepolia.id,
  } as any);

  return smartAccount;
};
