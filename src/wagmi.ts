import { createConfig, http } from "wagmi";
// import { mainnet, sepolia } from "wagmi/chains";
// import { injected, walletConnect } from "wagmi/connectors";
import { hardhat } from "wagmi/chains"; // hardhat 链 ID 是 31337

// VITE_WALLETCONNECT_PROJECT_ID is the projectId for WalletConnect
// const { VITE_WALLETCONNECT_PROJECT_ID } = import.meta.env;

export const config = createConfig({
  chains: [hardhat],
  // chains: [sepolia],
  transports: {
    // [sepolia.id]: http(),
    // [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  // connectors: [injected(), walletConnect({ projectId: VITE_WALLETCONNECT_PROJECT_ID })],
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
