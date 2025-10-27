export const SEPOLIA_CHAIN_ID = 11155111;

// Aave V3 Sepolia Addresses
export const AAVE_LENDING_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
// export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Circle USDC
export const USDC_DECIMALS = 6;

import { parseAbi } from "viem";

export const AAVE_POOL_ABI = parseAbi([
  "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
]);

export const AAVE_POOL_ADDRESS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// Aave Sepolia 合约地址
// Pool: 0x794a61358D6845594F94dc1DB02A252b5b4814aD
// USDC (Sepolia): 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
// Aave USDC aToken: 0x800731F19E7B3F611E2075F0141aB02d0eD51DBd
