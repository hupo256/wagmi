import { createConfig, webSocket, http } from "wagmi";
import { sepolia, mainnet, polygon, optimism, arbitrum } from "wagmi/chains";

export const config = createConfig({
  chains: [sepolia, mainnet, polygon, optimism, arbitrum],
  transports: {
    [sepolia.id]: webSocket("wss://ethereum-sepolia-rpc.publicnode.com"),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
