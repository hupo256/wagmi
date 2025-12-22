// Biconomy Configuration
// 从 Dashboard 获取 API Key
export const BICONOMY_API_KEY = "mee_T8fqw9viUtPXyJ8h7pg3x4"; // 替换为图 1 中的 API Key

export const BICONOMY_CONFIG = {
  // Biconomy V3 Supertransactions
  bundlerUrl: `https://bundler.biconomy.io/api/v3/11155111/${BICONOMY_API_KEY}`,
  // V2 Paymaster (仍然使用 v2 endpoint)
  paymasterUrl: `https://paymaster.biconomy.io/api/v2/11155111/${BICONOMY_API_KEY}`,
  chainId: 11155111, // Sepolia testnet
  // 可选：如果你想使用原始 API Key
  apiKey: BICONOMY_API_KEY,
};

export const AAVE_POOL_ADDRESS = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
export const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
