// hooks/useAaveDepositAA.ts
import { parseAbi } from "viem";
import { useAccount } from "wagmi";
import { useSmartAccountClient } from "./useSmartAccountClient";

const AAVE_POOL_ADDRESS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export function useAaveDepositAA() {
  const { address } = useAccount();
  const { getSmartAccountClient } = useSmartAccountClient();

  const deposit = async (amount: number) => {
    if (!address) throw new Error("No address");
    const smartAccount = await getSmartAccountClient();

    const amountInWei = BigInt(Math.floor(amount * 1e6));

    const tx = {
      to: AAVE_POOL_ADDRESS,
      data: encodeFunctionData({
        abi: parseAbi(["function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"]),
        functionName: "deposit",
        args: [USDC_ADDRESS, amountInWei, address, 0],
      }),
    };

    const userOpResponse = await smartAccount.sendTransaction(tx);
    const txHash = await userOpResponse.wait();
    return txHash;
  };

  return { deposit };
}

// Helper
function encodeFunctionData({ abi, functionName, args }: any) {
  return new (globalThis as any).viem.AbiFunction({
    abi,
    functionName,
    args,
  }).encode();
}
