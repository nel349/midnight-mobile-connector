/**
 * Application Constants
 * 
 * Centralized constants to avoid magic numbers and strings throughout the codebase
 */

/**
 * Default contract address for testing and examples
 * 
 * ✅ CURRENT: Freshly deployed contract on local Midnight network
 * Deployed: 2025-08-30 (after Docker restart)
 */
export const DEFAULT_CONTRACT_ADDRESS = '02005dddcb01d0d75681ba73b17466ba0e0b36f5e38748e03d3179949faeb4a62eb1';

/**
 * Network configuration constants
 */
export const NETWORK_CONSTANTS = {
  TESTNET: {
    INDEXER_URL: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
    INDEXER_WS_URL: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql',
    NODE_URL: 'wss://rpc.testnet-02.midnight.network',
  },
  LOCAL: {
    INDEXER_URL: 'http://localhost:8088/api/v1/graphql',
    INDEXER_WS_URL: 'ws://localhost:8088/api/v1/graphql',
    NODE_URL: 'ws://localhost:9944',
  },
  PROOF_SERVER_URL: 'http://localhost:6300', // Always local fallback
} as const;

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  DEFAULT_FUNCTION_NAME: 'get_token_balance' as string,
  DEFAULT_PARAMETERS: '["0x123"]' as string,
};
