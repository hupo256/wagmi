import { createConfig, webSocket } from "wagmi";
import { sepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: webSocket("wss://ethereum-sepolia-rpc.publicnode.com"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
