// wagmi.config.ts
import { createConfig, http, Config } from "wagmi";
import { anvil } from "./localChain";

export const config: Config = createConfig({
  chains: [anvil],
  transports: {
    [anvil.id]: http("http://127.0.0.1:8545"),
  },
});

declare module "wagmi" {
  interface Register {
    config: Config;
  }
}
