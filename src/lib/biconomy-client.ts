import { sepolia } from "viem/chains";
import { type WalletClient } from "viem";
// import { BICONOMY_CONFIG } from "@/config/biconomy";
import { smartData } from "@/common/smartData";

export const createBiconomyAccount = async (walletClient: WalletClient) => {
  // 使用 dynamic import 导入 createSmartAccountClient
  const { createSmartAccountClient } = await import("@biconomy/account");
  const smartAccount = await createSmartAccountClient({
    signer: walletClient,
    bundlerUrl: smartData.bundlerUrl,
    paymasterUrl: smartData.paymasterUrl,
    chainId: sepolia.id,
  });
  return smartAccount;
};
