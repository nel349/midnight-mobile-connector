/**
 * Midnight Network Integration
 * 
 * Handles connection to Midnight testnet/mainnet infrastructure:
 * - Indexer (HTTP + WebSocket) for blockchain data
 * - Prover Server for zero-knowledge proofs
 * - Substrate Node for transaction submission
 * 
 * Based on official @midnight-ntwrk/wallet WalletBuilder architecture
 */

import { MidnightWallet } from './midnightWallet';
import { NetworkId } from './addressGeneration';
import axios from 'axios';

type NetworkIdType = typeof NetworkId[keyof typeof NetworkId];

// Official Midnight Network endpoints from midnight-bank project
export const MidnightNetworkEndpoints = {
  testnet: {
    name: 'TestNet-02',
    networkId: NetworkId.TestNet as NetworkIdType,
    // Official TestNet-02 endpoints
    indexerUri: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
    indexerWsUri: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws', 
    proverServerUri: 'https://lace-dev.proof-pub.stg.midnight.tools',
    substrateNodeUri: 'https://rpc.testnet-02.midnight.network'
  },
  undeployed: {
    name: 'Undeployed (Local)',
    networkId: NetworkId.Undeployed as NetworkIdType,
    // Local development endpoints
    indexerUri: 'http://localhost:8088/api/v1/graphql',
    indexerWsUri: 'ws://localhost:8088/api/v1/graphql/ws',
    proverServerUri: 'http://localhost:6300',
    substrateNodeUri: 'http://127.0.0.1:8080'
  },
  mainnet: {
    name: 'MainNet',
    networkId: NetworkId.MainNet as NetworkIdType,
    // MainNet endpoints (coming soon)
    indexerUri: 'https://indexer.midnight.network/api/v1/graphql',
    indexerWsUri: 'wss://indexer.midnight.network/api/v1/graphql/ws',
    proverServerUri: 'https://prover.midnight.network', 
    substrateNodeUri: 'https://rpc.midnight.network'
  }
} as const;

export type NetworkType = keyof typeof MidnightNetworkEndpoints;

export interface NetworkConnection {
  network: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  blockHeight?: number;
  peerCount?: number;
  lastSync?: Date;
  error?: string;
}

export interface ConnectedWallet {
  wallet: MidnightWallet;
  connection: NetworkConnection;
  networkEndpoints?: {
    name: string;
    networkId: NetworkIdType;
    indexerUri: string;
    indexerWsUri: string;
    proverServerUri: string;
    substrateNodeUri: string;
  }; // Direct network endpoints for GraphQL queries
}

/**
 * Test network connectivity to Midnight endpoints
 */
export const testNetworkConnectivity = async (networkType: NetworkType): Promise<NetworkConnection> => {
  console.log(`🌐 Testing ${networkType} network connectivity...`);
  
  const endpoints = MidnightNetworkEndpoints[networkType];
  console.log(`   Network: ${endpoints.name}`);
  console.log(`   Indexer: ${endpoints.indexerUri}`);
  console.log(`   Prover: ${endpoints.proverServerUri}`);
  console.log(`   Node: ${endpoints.substrateNodeUri}`);

  const connection: NetworkConnection = {
    network: endpoints.name,
    status: 'connecting'
  };

  try {
    // Test actual HTTP endpoint connectivity
    console.log('   🔍 Testing HTTP endpoints...');
    
    const httpTest = await testHttpEndpoint(endpoints.indexerUri);
    const wsTest = await testWebSocketEndpoint(endpoints.indexerWsUri);
    const proverTest = await testHttpEndpoint(endpoints.proverServerUri);
    const nodeTest = await testHttpEndpoint(endpoints.substrateNodeUri);
    
    // Core functionality only requires indexer and node to work
    const coreEndpointsWorking = httpTest && nodeTest;
    
    if (coreEndpointsWorking) {
      connection.status = 'connected';
      connection.lastSync = new Date();
      
      // Get real blockchain info if available
      const blockInfo = await getBlockchainInfo(endpoints.substrateNodeUri);
      connection.blockHeight = blockInfo.height;
      connection.peerCount = blockInfo.peers;
      
      console.log('   ✅ Core network connectivity established');
      console.log(`   📊 Block height: ${connection.blockHeight || 'N/A'}`);
      console.log(`   👥 Peers: ${connection.peerCount || 'N/A'}`);
      
      // Log optional service status
      if (!wsTest) console.log('   ⚠️ WebSocket connection failed (not critical)');
      if (!proverTest) {
        console.log('   ⚠️ Remote prover server unavailable (503), testing local fallback...');
        // Test local prover server fallback
        const localProverUri = MidnightNetworkEndpoints.undeployed.proverServerUri;
        const localProverTest = await testHttpEndpoint(localProverUri);
        if (localProverTest) {
          console.log('   ✅ Local prover server available as fallback');
          // You could optionally update the connection to use local prover
        } else {
          console.log('   ⚠️ Local prover server also unavailable');
        }
      }
      
    } else {
      const failedServices = [];
      if (!httpTest) failedServices.push('Indexer');
      if (!nodeTest) failedServices.push('RPC Node');
      throw new Error(`Critical endpoints failed: ${failedServices.join(', ')}`);
    }
    
  } catch (error) {
    console.error('   ❌ Network connectivity test failed:', error);
    connection.status = 'error';
    connection.error = String(error);
  }

  return connection;
};

/**
 * Connect wallet to Midnight network (Direct connectivity without WASM)
 */
export const connectWalletToNetwork = async (
  wallet: MidnightWallet,
  networkType: NetworkType
): Promise<ConnectedWallet> => {
  console.log(`🔗 Connecting wallet to ${networkType} network...`);
  
  const endpoints = MidnightNetworkEndpoints[networkType];
  
  // Test connectivity first
  const connection = await testNetworkConnectivity(networkType);
  
  if (connection.status !== 'connected') {
    throw new Error(`Network connectivity failed: ${connection.error}`);
  }

  try {
    console.log('   🔧 Establishing direct network connection...');
    console.log(`   📱 Using mobile-compatible approach (no WASM dependencies)`);
    
    // Check if we need to use local prover as fallback
    let finalEndpoints = {
      name: endpoints.name,
      networkId: endpoints.networkId,
      indexerUri: endpoints.indexerUri,
      indexerWsUri: endpoints.indexerWsUri,
      proverServerUri: endpoints.proverServerUri,
      substrateNodeUri: endpoints.substrateNodeUri
    };
    
    // If using testnet and remote prover failed, create hybrid endpoints with local prover
    if (networkType === 'testnet' && connection.status === 'connected') {
      const remoteProverWorking = await testHttpEndpoint(endpoints.proverServerUri);
      if (!remoteProverWorking) {
        const localProverUri = MidnightNetworkEndpoints.undeployed.proverServerUri;
        const localProverWorking = await testHttpEndpoint(localProverUri);
        
        if (localProverWorking) {
          console.log('   🔄 Using hybrid configuration: TestNet + Local Prover');
          // Update prover URI to local fallback
          finalEndpoints.proverServerUri = localProverUri;
        }
      }
    }
    
    // Create direct network connection without official wallet WASM dependencies
    const directConnection: ConnectedWallet = {
      wallet,
      connection,
      // Store network endpoints for direct GraphQL queries
      networkEndpoints: finalEndpoints
    };
    
    console.log('   ✅ Wallet connected to network successfully');
    console.log('   🔄 Ready for direct GraphQL queries...');
    
    return directConnection;
    
  } catch (error) {
    console.error('   ❌ Wallet connection failed:', error);
    throw new Error(`Failed to connect wallet to network: ${error}`);
  }
};

/**
 * Test HTTP endpoint connectivity using axios
 */
const testHttpEndpoint = async (url: string): Promise<boolean> => {
  try {
    console.log(`   📡 Testing ${url}...`);
    
    // For GraphQL endpoints, use POST with a basic query
    // For RPC endpoints, try a simple health check
    let response;
    
    if (url.includes('graphql')) {
      // Test GraphQL endpoint with a simple introspection query
      response = await axios.post(url, {
        query: '{ __schema { types { name } } }'
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else if (url.includes('rpc') || url.includes('midnight.network')) {
      // Test RPC endpoint with system health check
      response = await axios.post(url, {
        id: 1,
        jsonrpc: '2.0',
        method: 'system_health',
        params: []
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      // For other endpoints, try a simple GET request
      response = await axios.get(url, {
        timeout: 5000
      });
    }
    
    const success = response.status < 400;
    console.log(`   ${success ? '✅' : '❌'} HTTP ${url}: ${response.status}`);
    return success;
    
  } catch (error: any) {
    const status = error.response?.status || 'timeout/error';
    console.log(`   ❌ HTTP ${url}: ${status} - ${error.message}`);
    return false;
  }
};

/**
 * Test WebSocket endpoint connectivity
 */
const testWebSocketEndpoint = async (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      console.log(`   🔌 Testing ${url}...`);
      
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        console.log(`   ❌ WebSocket ${url}: Timeout`);
        resolve(false);
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        console.log(`   ✅ WebSocket ${url}: Connected`);
        ws.close();
        resolve(true);
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.log(`   ❌ WebSocket ${url}: Connection failed - ${error.type || 'unknown error'}`);
        resolve(false);
      };
      
    } catch (error) {
      console.log(`   ❌ WebSocket ${url}: ${error}`);
      resolve(false);
    }
  });
};

/**
 * Get real blockchain information from Substrate node using axios
 */
const getBlockchainInfo = async (nodeUri: string): Promise<{height?: number, peers?: number}> => {
  try {
    // Try RPC call to get system info
    const response = await axios.post(nodeUri, {
      id: 1,
      jsonrpc: '2.0',
      method: 'system_health',
      params: []
    }, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = response.data;
    return {
      height: data.result?.syncedHeight || undefined,
      peers: data.result?.peers || undefined
    };
    
  } catch (error: any) {
    console.log(`   ⚠️ Could not get blockchain info: ${error.message}`);
  }
  
  return {};
};

/**
 * Query wallet balance using direct GraphQL
 */
const queryWalletBalance = async (indexerUri: string, addresses: string[]): Promise<any> => {
  try {
    console.log(`   📡 Querying ${indexerUri}...`);
    
    // Basic GraphQL query for wallet balance
    // This is a simplified query - in production you'd use proper Midnight GraphQL schema
    const query = {
      query: `
        query GetWalletBalance($addresses: [String!]!) {
          coins(where: { address: { _in: $addresses } }) {
            value
            type
            address
          }
        }
      `,
      variables: {
        addresses
      }
    };
    
    const response = await axios.post(indexerUri, query, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = response.data;
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }
    
    // Process balance data
    const coins = result.data?.coins || [];
    const dustCoins = coins.filter((coin: any) => coin.type === 'tDUST');
    const totalDust = dustCoins.reduce((sum: number, coin: any) => sum + (parseFloat(coin.value) || 0), 0);
    
    return {
      dustBalance: totalDust.toFixed(6),
      totalCoins: coins.length,
      coinsByType: getCoinsByType(coins)
    };
    
  } catch (error) {
    console.log(`   ⚠️ GraphQL query failed: ${error}`);
    
    // Return empty balance on query failure
    return {
      dustBalance: '0.000000',
      totalCoins: 0,
      coinsByType: {}
    };
  }
};

/**
 * Get wallet balance using direct GraphQL queries
 */
export const getWalletBalance = async (connectedWallet: ConnectedWallet): Promise<any> => {
  console.log('💰 Fetching wallet balance from network...');
  
  if (connectedWallet.connection.status !== 'connected') {
    throw new Error('Wallet not connected to network');
  }
  
  try {
    if (!connectedWallet.networkEndpoints) {
      throw new Error('Network endpoints not available');
    }
    
    console.log('   📱 Using direct GraphQL query approach...');
    
    // Generate addresses from wallet key pairs for balance queries
    const { generateWalletAddresses } = await import('./addressGeneration');
    const walletAddresses = await generateWalletAddresses(connectedWallet.wallet.keyPairs, 'TestNet');
    const addressStrings = walletAddresses.map(addr => addr.address);
    console.log(`   🔍 Querying balance for ${addressStrings.length} addresses...`);
    
    // Direct GraphQL query for wallet balance
    const balanceData = await queryWalletBalance(
      connectedWallet.networkEndpoints.indexerUri,
      addressStrings
    );
    
    const balance = {
      dust: balanceData.dustBalance || '0.000000',
      totalCoins: balanceData.totalCoins || 0,
      coinsByType: balanceData.coinsByType || {},
      lastUpdated: new Date(),
      networkEndpoint: connectedWallet.networkEndpoints.indexerUri
    };
    
    console.log(`   💰 Balance: ${balance.dust} tDUST`);
    console.log(`   🪙 Total coins: ${balance.totalCoins}`);
    
    return balance;
    
  } catch (error) {
    console.error('   ❌ Failed to fetch balance:', error);
    
    // Return fallback balance info
    return {
      dust: '0.000000',
      totalCoins: 0,
      error: String(error),
      lastUpdated: new Date(),
      networkEndpoint: connectedWallet.networkEndpoints?.indexerUri || 'unknown'
    };
  }
};

/**
 * Format DUST balance from BigInt to string
 */
const formatDustBalance = (balance: bigint): string => {
  // DUST has 6 decimal places
  const divisor = 1000000n;
  const whole = balance / divisor;
  const fractional = balance % divisor;
  return `${whole}.${fractional.toString().padStart(6, '0')}`;
};

/**
 * Group coins by token type
 */
const getCoinsByType = (coins: any[]): Record<string, number> => {
  return coins.reduce((acc, coin) => {
    acc[coin.type] = (acc[coin.type] || 0) + 1;
    return acc;
  }, {});
};

/**
 * Get available networks for connection
 */
export const getAvailableNetworks = (): Array<{key: NetworkType, name: string, description: string}> => {
  return [
    {
      key: 'testnet',
      name: 'TestNet-02', 
      description: 'Persistent testnet for development'
    },
    {
      key: 'undeployed',
      name: 'Local Development',
      description: 'Local undeployed network'
    },
    {
      key: 'mainnet',
      name: 'MainNet',
      description: 'Production Midnight network (coming soon)'
    }
  ];
};