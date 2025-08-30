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
 * Discover GraphQL schema from the indexer
 */
const introspectGraphQLSchema = async (indexerUri: string): Promise<any> => {
  try {
    console.log(`   🔍 Introspecting GraphQL schema at ${indexerUri}...`);
    
    const introspectionQuery = {
      query: `
        query IntrospectionQuery {
          __schema {
            queryType {
              name
            }
            types {
              name
              kind
              fields {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      `
    };
    
    const response = await axios.post(indexerUri, introspectionQuery, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = response.data;
    
    if (result.errors) {
      console.log(`   ❌ Schema introspection failed: ${JSON.stringify(result.errors)}`);
      return null;
    }
    
    const schema = result.data?.__schema;
    if (schema) {
      console.log(`   ✅ Schema discovered. Query type: ${schema.queryType?.name}`);
      
      // Log all available types for debugging
      const allTypes = schema.types.map((t: any) => t.name).sort();
      console.log(`   📋 All available types (${allTypes.length}):`, allTypes.slice(0, 20).join(', ') + (allTypes.length > 20 ? '...' : ''));
      
      // Look for balance-related types (broader search)
      const balanceTypes = schema.types.filter((type: any) => {
        const name = type.name.toLowerCase();
        return name.includes('balance') ||
               name.includes('coin') ||
               name.includes('utxo') ||
               name.includes('output') ||
               name.includes('transaction') ||
               name.includes('transfer') ||
               name.includes('asset') ||
               name.includes('token') ||
               name.includes('dust') ||
               name.includes('shielded');
      });
      
      if (balanceTypes.length > 0) {
        console.log(`   💰 Found potential balance types:`, balanceTypes.map((t: any) => t.name));
        return { schema, balanceTypes };
      } else {
        console.log(`   ⚠️ No obvious balance types found in schema`);
        
        // Try to find the Query type and its fields
        const queryType = schema.types.find((t: any) => t.name === 'Query');
        if (queryType && queryType.fields) {
          const queryFields = queryType.fields.map((f: any) => f.name);
          console.log(`   📋 Available Query fields (${queryFields.length}): ${queryFields.slice(0, 15).join(', ')}${queryFields.length > 15 ? '...' : ''}`);
          return { schema, balanceTypes: [], queryFields };
        }
      }
    }
    
    return { schema, balanceTypes: [] };
    
  } catch (error) {
    console.log(`   ❌ Schema introspection error: ${error}`);
    return null;
  }
};

/**
 * Query wallet balance using direct GraphQL - now with schema discovery
 */
const queryWalletBalance = async (indexerUri: string, addresses: string[]): Promise<any> => {
  try {
    console.log(`   📡 Querying ${indexerUri}...`);
    
    // First try to discover the schema
    const schemaInfo = await introspectGraphQLSchema(indexerUri);
    
    // Try queries based on discovered schema
    if (schemaInfo?.balanceTypes?.length > 0) {
      console.log(`   🎯 Using discovered balance types`);
      
      for (const balanceType of schemaInfo.balanceTypes) {
        console.log(`   🔍 Trying balance query with type: ${balanceType.name}`);
        
        // Create targeted queries based on transaction type
        const queries = [];
        
        if (balanceType.name.includes('Transaction')) {
          // Transaction-based queries for Midnight
          queries.push(
            // Query 1: Look for transactions with our addresses in various fields
            `query GetTransactions($addresses: [String!]!) { 
              ${balanceType.name.toLowerCase()}(where: { 
                _or: [
                  { recipient: { _in: $addresses } },
                  { sender: { _in: $addresses } },
                  { address: { _in: $addresses } },
                  { to: { _in: $addresses } },
                  { from: { _in: $addresses } }
                ]
              }) { 
                id hash recipient sender address to from value amount fee status blockHeight timestamp
              } 
            }`,
            
            // Query 2: Simpler transaction query
            `query GetTransactions($addresses: [String!]!) { 
              ${balanceType.name}(where: { recipient: { _in: $addresses } }) { 
                id recipient value amount status
              } 
            }`,
            
            // Query 3: Very basic transaction query
            `query GetTransactions { 
              ${balanceType.name.toLowerCase()} { 
                id recipient sender value amount hash status
              } 
            }`
          );
        } else {
          // Generic balance queries for other types
          queries.push(
            `query GetBalance($addresses: [String!]!) { 
              ${balanceType.name.toLowerCase()}(where: { address: { _in: $addresses } }) { 
                value address type 
              } 
            }`,
            `query GetBalance($addresses: [String!]!) { 
              ${balanceType.name}(where: { address: { _in: $addresses } }) { 
                value address type 
              } 
            }`
          );
        }
        
        for (const queryString of queries) {
          try {
            const query = { query: queryString, variables: { addresses } };
            const response = await axios.post(indexerUri, query, {
              timeout: 10000,
              headers: { 'Content-Type': 'application/json' }
            });
            
            const result = response.data;
            
            if (!result.errors && result.data) {
              console.log(`   ✅ Successful query with ${balanceType.name}!`);
              console.log(`   📊 Response:`, JSON.stringify(result.data, null, 2));
              
              const dataKey = Object.keys(result.data)[0];
              const items = result.data[dataKey] || [];
              
              return processBalanceData(items);
            }
          } catch (queryError) {
            // Silent fail, try next
          }
        }
      }
    }
    
    // Try queries based on discovered query fields
    if (schemaInfo?.queryFields?.length > 0) {
      console.log(`   🎯 Trying discovered query fields`);
      
      // Look for balance-related query fields
      const balanceFields = schemaInfo.queryFields.filter((field: string) => {
        const name = field.toLowerCase();
        return name.includes('balance') ||
               name.includes('coin') ||
               name.includes('utxo') ||
               name.includes('transaction') ||
               name.includes('transfer') ||
               name.includes('dust') ||
               name.includes('block') ||
               name.includes('contract');
      });
      
      console.log(`   💰 Found potential balance fields:`, balanceFields);
      
      for (const field of balanceFields) {
        console.log(`   🔍 Trying query field: ${field}`);
        
        // Try various parameter patterns for each field
        const queries = [
          // Pattern 1: With address filter
          `query GetBalance($addresses: [String!]!) { 
            ${field}(where: { address: { _in: $addresses } }) { 
              id address value amount 
            } 
          }`,
          
          // Pattern 2: With different address field name
          `query GetBalance($addresses: [String!]!) { 
            ${field}(where: { recipient: { _in: $addresses } }) { 
              id recipient value amount 
            } 
          }`,
          
          // Pattern 3: With to/from filters
          `query GetBalance($addresses: [String!]!) { 
            ${field}(where: { _or: [{ to: { _in: $addresses } }, { from: { _in: $addresses } }] }) { 
              id to from value amount 
            } 
          }`,
          
          // Pattern 4: Simple query without filters (get all, then filter)
          `query GetAll { 
            ${field} { 
              id address recipient to from value amount 
            } 
          }`
        ];
        
        for (const queryString of queries) {
          try {
            const query = { query: queryString, variables: { addresses } };
            const response = await axios.post(indexerUri, query, {
              timeout: 10000,
              headers: { 'Content-Type': 'application/json' }
            });
            
            const result = response.data;
            
            if (!result.errors && result.data && result.data[field]) {
              console.log(`   ✅ Successful query with field: ${field}!`);
              console.log(`   📊 Response:`, JSON.stringify(result.data, null, 2));
              
              const items = result.data[field] || [];
              
              // Filter items by our addresses if we got all data
              let filteredItems = items;
              if (queryString.includes('GetAll')) {
                filteredItems = items.filter((item: any) => 
                  addresses.includes(item.address) ||
                  addresses.includes(item.recipient) ||
                  addresses.includes(item.to) ||
                  addresses.includes(item.from)
                );
              }
              
              if (filteredItems.length > 0) {
                return processBalanceData(filteredItems);
              }
            }
          } catch (queryError) {
            // Silent fail, try next
          }
        }
      }
    }
    
    // Fallback: try Midnight-specific queries based on documentation
    console.log(`   🔄 Trying Midnight-specific queries...`);
    
    const fallbackQueries = [
      // Midnight contractAction query (from docs)
      `query GetContractBalances($addresses: [String!]!) { 
        contractAction(address: { _in: $addresses }) {
          ... on ContractDeploy {
            address
            unshieldedBalances {
              tokenType
              amount
            }
          }
          ... on ContractCall {
            address
            unshieldedBalances {
              tokenType
              amount
            }
          }
          ... on ContractUpdate {
            address
            unshieldedBalances {
              tokenType
              amount
            }
          }
        }
      }`,
      
      // Try getting all contract actions first
      `query GetAllContracts { 
        contractAction {
          ... on ContractDeploy {
            address
            unshieldedBalances {
              tokenType
              amount
            }
          }
          ... on ContractCall {
            address
            unshieldedBalances {
              tokenType
              amount
            }
          }
        }
      }`,
      
      // Basic block query to see if we can get any data
      `query GetBlocks { 
        block(limit: 5) {
          id
          height
          timestamp
        }
      }`,
      
      // Standard transaction query
      `query GetTransactions { 
        transaction(limit: 10) {
          id
          hash
          blockHeight
        }
      }`
    ];
    
    for (const queryString of fallbackQueries) {
      try {
        const query = { query: queryString, variables: { addresses } };
        const response = await axios.post(indexerUri, query, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = response.data;
        
        if (!result.errors && result.data) {
          console.log(`   ✅ Fallback query succeeded!`);
          console.log(`   📊 Response:`, JSON.stringify(result.data, null, 2));
          
          const dataKey = Object.keys(result.data)[0];
          const items = result.data[dataKey] || [];
          
          return processBalanceData(items);
        }
      } catch (queryError) {
        console.log(`   ⚠️ Fallback query failed, trying next...`);
      }
    }
    
    // Ultimate fallback - return empty
    console.log(`   ❌ All GraphQL queries failed, returning empty balance`);
    return {
      dustBalance: '0.000000',
      totalCoins: 0,
      coinsByType: {}
    };
    
  } catch (error) {
    console.log(`   ⚠️ GraphQL query failed: ${error}`);
    
    return {
      dustBalance: '0.000000',
      totalCoins: 0,
      coinsByType: {}
    };
  }
};

/**
 * Process balance data from any GraphQL response format
 */
const processBalanceData = (items: any[]): any => {
  console.log(`   🔄 Processing ${items.length} balance items...`);
  
  if (items.length > 0) {
    console.log(`   📋 Sample item structure:`, JSON.stringify(items[0], null, 2));
  }
  
  let totalDust = 0;
  const coinsByType: { [key: string]: number } = {};
  let transactionCount = 0;
  
  for (const item of items) {
    // Handle transaction-based data
    if (item.id || item.hash) {
      transactionCount++;
      console.log(`   📝 Transaction ${transactionCount}:`, {
        id: item.id,
        hash: item.hash,
        recipient: item.recipient, 
        sender: item.sender,
        value: item.value,
        amount: item.amount,
        status: item.status
      });
    }
    
    // Extract value/amount from various possible fields
    const value = parseFloat(
      item.value || 
      item.amount || 
      item.balance || 
      '0'
    );
    
    const type = item.type || item.currency || 'tDUST';
    
    if (value > 0) {
      console.log(`   💰 Found value: ${value} ${type}`);
      
      if (type === 'tDUST' || type === 'DUST' || !item.type) {
        totalDust += value;
      }
      
      coinsByType[type] = (coinsByType[type] || 0) + value;
    }
  }
  
  console.log(`   💰 Final processed balance: ${totalDust.toFixed(6)} tDUST`);
  console.log(`   📊 Total transactions: ${transactionCount}`);
  
  return {
    dustBalance: totalDust.toFixed(6),
    totalCoins: items.length,
    transactionCount,
    coinsByType
  };
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