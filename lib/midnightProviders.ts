/**
 * Midnight Providers Setup for Mobile
 * 
 * Simplified React Native compatible implementation that focuses on core contract functionality
 * Avoids WASM dependencies while providing real TestNet connectivity
 */

import { MidnightNetworkId } from './midnightContractClient';

// Core provider configuration
export interface MidnightProvidersConfig {
  networkId: MidnightNetworkId;
  indexerUrl: string;
  indexerWsUrl: string;
  proofServerUrl: string;
  nodeUrl: string;
}

/**
 * Create TestNet providers configuration
 */
export function createTestnetProvidersConfig(): MidnightProvidersConfig {
  return {
    networkId: MidnightNetworkId.TestNet,
    indexerUrl: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
    indexerWsUrl: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql',
    proofServerUrl: 'https://proof-server.testnet-02.midnight.network',
    nodeUrl: 'wss://rpc.testnet-02.midnight.network',
  };
}

/**
 * Create local development providers configuration
 */
export function createLocalProvidersConfig(): MidnightProvidersConfig {
  return {
    networkId: MidnightNetworkId.DevNet,
    indexerUrl: 'http://localhost:8088/api/v1/graphql',
    indexerWsUrl: 'ws://localhost:8088/api/v1/graphql',
    proofServerUrl: 'http://localhost:8089',
    nodeUrl: 'ws://localhost:9944',
  };
}

/**
 * Simple private state provider for mobile
 */
export function createMobilePrivateStateProvider<StateId extends string, State>() {
  const storage = new Map<StateId, State>();

  return {
    async get(stateId: StateId): Promise<State | null> {
      const state = storage.get(stateId) || null;
      console.log(`📁 Retrieved private state for ${stateId}: ${state ? 'found' : 'not found'}`);
      return state;
    },

    async set(stateId: StateId, state: State): Promise<void> {
      storage.set(stateId, state);
      console.log(`💾 Stored private state for ${stateId}`);
    }
  };
}

/**
 * React Native compatible contract state querier
 */
export class ReactNativeContractQuerier {
  constructor(private graphqlUrl: string) {
    console.log('🌐 ReactNativeContractQuerier initialized');
    console.log(`   GraphQL URL: ${graphqlUrl}`);
  }

  async queryContractState(contractAddress: string): Promise<any> {
    console.log(`📡 Querying contract state: ${contractAddress.substring(0, 20)}...`);
    
    try {
      // Use direct GraphQL query to TestNet indexer
      const query = `
        query ContractState($contractAddress: String!) {
          contract(address: $contractAddress) {
            address
            data
            blockHeight
            txHash
          }
        }
      `;
      
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { contractAddress },
        }),
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('❌ GraphQL errors:', result.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      const contractData = result.data?.contract;
      
      if (contractData) {
        console.log('✅ Contract found!');
        console.log(`   Address: ${contractData.address}`);
        console.log(`   Block Height: ${contractData.blockHeight}`);
        console.log(`   Data length: ${contractData.data ? contractData.data.length : 0}`);
      } else {
        console.log('❌ Contract not found at address');
      }

      return contractData;

    } catch (error) {
      console.error('❌ Contract state query failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    console.log('🔍 Testing indexer connection...');
    
    try {
      // Test with a simple query to verify the endpoint works
      const query = `
        query TestConnection {
          __schema {
            types {
              name
            }
          }
        }
      `;
      
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`Connection test failed: ${JSON.stringify(result.errors)}`);
      }

      console.log('✅ Indexer connection successful');
      console.log(`   Available types: ${result.data?.__schema?.types?.length || 0}`);
      return true;

    } catch (error) {
      console.error('❌ Indexer connection failed:', error);
      return false;
    }
  }
}

/**
 * Basic Midnight providers for React Native
 */
export interface BasicMidnightProviders {
  contractQuerier: ReactNativeContractQuerier;
  privateStateProvider: any;
  config: MidnightProvidersConfig;
}

/**
 * Create basic providers for React Native
 */
export async function createBasicProviders<StateId extends string = string, State = any>(
  config: MidnightProvidersConfig
): Promise<BasicMidnightProviders> {
  console.log('🌐 Creating React Native Midnight providers...');
  console.log(`   Network: ${MidnightNetworkId[config.networkId]}`);
  console.log(`   Indexer: ${config.indexerUrl}`);
  
  try {
    const contractQuerier = new ReactNativeContractQuerier(config.indexerUrl);
    const privateStateProvider = createMobilePrivateStateProvider<StateId, State>();

    console.log('✅ Basic Midnight providers created');

    return {
      contractQuerier,
      privateStateProvider,
      config,
    };

  } catch (error) {
    console.error('❌ Failed to create providers:', error);
    throw new Error(`Failed to initialize providers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create TestNet providers
 */
export async function createTestnetProviders<StateId extends string = string, State = any>(): Promise<BasicMidnightProviders> {
  const config = createTestnetProvidersConfig();
  return createBasicProviders<StateId, State>(config);
}

/**
 * Create local development providers
 */
export async function createLocalProviders<StateId extends string = string, State = any>(): Promise<BasicMidnightProviders> {
  const config = createLocalProvidersConfig();
  return createBasicProviders<StateId, State>(config);
}

/**
 * Test provider connection
 */
export async function testProviderConnection(providers: BasicMidnightProviders, contractAddress?: string): Promise<boolean> {
  console.log('🔍 Testing provider connection...');
  
  try {
    // Test basic indexer connection
    const connectionOk = await providers.contractQuerier.testConnection();
    
    if (!connectionOk) {
      return false;
    }
    
    // Test with a specific contract if provided
    if (contractAddress) {
      console.log(`🔍 Testing with contract: ${contractAddress.substring(0, 20)}...`);
      try {
        await providers.contractQuerier.queryContractState(contractAddress);
        console.log('✅ Contract query test successful');
      } catch (error) {
        console.log('ℹ️ Contract query failed (normal if contract doesn\'t exist)');
      }
    }
    
    console.log('✅ Provider connection test passed');
    return true;
    
  } catch (error) {
    console.error('❌ Provider connection test failed:', error);
    return false;
  }
}

/**
 * Query contract state using providers
 */
export async function queryContractState(providers: BasicMidnightProviders, contractAddress: string): Promise<any> {
  return providers.contractQuerier.queryContractState(contractAddress);
}

/**
 * Check if contract exists
 */
export async function contractExists(providers: BasicMidnightProviders, contractAddress: string): Promise<boolean> {
  try {
    const state = await queryContractState(providers, contractAddress);
    return state !== null && state !== undefined;
  } catch (error) {
    console.error(`❌ Error checking contract existence:`, error);
    return false;
  }
}

/**
 * Provider health check
 */
export async function checkProviderHealth(providers: BasicMidnightProviders): Promise<{
  indexerConnection: boolean;
  privateState: boolean;
}> {
  const health = {
    indexerConnection: false,
    privateState: false,
  };
  
  try {
    // Test indexer connection
    health.indexerConnection = await providers.contractQuerier.testConnection();
    
    // Test private state
    await providers.privateStateProvider.set('test' as any, { test: true });
    const retrieved = await providers.privateStateProvider.get('test' as any);
    health.privateState = retrieved !== null;
    
    console.log('✅ Provider health check completed');
    console.log(`   Indexer: ${health.indexerConnection ? 'OK' : 'FAILED'}`);
    console.log(`   Private State: ${health.privateState ? 'OK' : 'FAILED'}`);
    
  } catch (error) {
    console.error('❌ Provider health check failed:', error);
  }
  
  return health;
}

/**
 * Get available networks
 */
export function getAvailableNetworks() {
  return [
    {
      key: 'testnet' as const,
      name: 'TestNet-02',
      description: 'Official Midnight TestNet',
      config: createTestnetProvidersConfig()
    },
    {
      key: 'local' as const,
      name: 'Local Development', 
      description: 'Local Midnight node (requires docker setup)',
      config: createLocalProvidersConfig()
    }
  ];
}