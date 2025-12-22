import { parseAbi } from "viem";

export const AAVE_POOL_ABI = parseAbi([
  "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
]);

// Aave V3 Pool 地址（Sepolia） — 来自 Aave 官方地址本/文档
// 注意：这是真正执行 deposit(...) 的 Pool 合约，不是 PoolAddressesProvider
export const AAVE_POOL_ADDRESS = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

// Circle USDC (Sepolia)
export const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";

// USDC Decimals
export const USDC_DECIMALS = 6;

// Sepolia Chain ID
export const SEPOLIA_CHAIN_ID = 11155111;
