import { createConfig, http, Config, webSocket, fallback } from "wagmi";
import { anvil } from "./localChain";

export const config: Config = createConfig({
  chains: [anvil],
  transports: {
    [anvil.id]: webSocket("ws://127.0.0.1:8545"),

    // 或者同时支持 HTTP 和 WebSocket（推荐）
    // [anvil.id]: fallback([webSocket("ws://127.0.0.1:8545"), http("http://127.0.0.1:8545")]),
  },
});

// module augmentation intentionally omitted here to avoid duplicate declarations
