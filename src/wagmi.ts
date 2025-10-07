import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// VITE_WALLETCONNECT_PROJECT_ID is the projectId for WalletConnect
const { VITE_WALLETCONNECT_PROJECT_ID } = import.meta.env;

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  // chains: [mainnet, sepolia],
  // transports: {
  //   [mainnet.id]: http(),
  //   [sepolia.id]: http(),
  // },
  connectors: [injected(), walletConnect({ projectId: VITE_WALLETCONNECT_PROJECT_ID })],
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
