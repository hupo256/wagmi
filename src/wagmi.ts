import { createConfig, http } from "wagmi";
import { hardhat } from "wagmi/chains";

// import { defineChain } from "viem";
// export const hardhat31337 = defineChain({
//   id: 31337,
//   name: "Hardhat",
//   nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
//   rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
// });

export const config = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
