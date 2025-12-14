/**
 * Shared contract addresses configuration
 * These contracts are deployed once and shared by all users
 */

export const CONTRACTS_CONFIG = {
  // Mock Router (Swap)
  MOCK_ROUTER_ADDRESS: "0x0000000000000000000000000000000000000000",

  // Mock Lending Pool
  MOCK_LENDING_POOL_ADDRESS: "0x0000000000000000000000000000000000000000",

  // Token addresses
  TOKENS: {
    WETH: {
      address: "0x1111111111111111111111111111111111111111",
      symbol: "WETH",
      name: "Wrapped Ether Test",
    },
    USDT: {
      address: "0x2222222222222222222222222222222222222222",
      symbol: "USDT",
      name: "Tether USD Test",
    },
  },
} as const;

// Export individual values for convenience
export const MOCK_ROUTER_ADDRESS = CONTRACTS_CONFIG.MOCK_ROUTER_ADDRESS;
export const MOCK_LENDING_POOL_ADDRESS = CONTRACTS_CONFIG.MOCK_LENDING_POOL_ADDRESS;
export const TOKEN_WETH = CONTRACTS_CONFIG.TOKENS.WETH;
export const TOKEN_USDT = CONTRACTS_CONFIG.TOKENS.USDT;

// Export tokens as array for UI components
export const TOKENS_LIST = [
  CONTRACTS_CONFIG.TOKENS.WETH,
  CONTRACTS_CONFIG.TOKENS.USDT,
];