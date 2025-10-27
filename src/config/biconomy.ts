// Biconomy Configuration
// 从 Biconomy Dashboard 获取（项目类型选 Smart Accounts，网络选 Sepolia）
export const BICONOMY_CONFIG = {
  apiKey: import.meta.env.VITE_BICONOMY_API_KEY,
  bundlerUrl: import.meta.env.VITE_BUNDLER_URL,
  paymasterUrl: import.meta.env.VITE_PAYMASTER_URL,
};
