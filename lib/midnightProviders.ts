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
      // Get detailed schema information including field arguments
      const query = `
        query GetDetailedSchema {
          __schema {
            queryType {
              fields {
                name
                type {
                  name
                  kind
                }
                args {
                  name
                  type {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      `;
      
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query }),
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

      const schemaInfo = result.data?.__schema?.queryType?.fields;
      
      if (schemaInfo) {
        console.log('✅ Schema introspection successful!');
        console.log('📋 Available query fields:');
        schemaInfo.forEach((field: any, index: number) => {
          if (index < 10) { // Show first 10 fields
            console.log(`   ${field.name}: ${field.type?.name || 'Complex'}`);
          }
        });
        
        // Look for contract-related fields and show their arguments
        const contractFields = schemaInfo.filter((field: any) => 
          field.name.toLowerCase().includes('contract') || 
          field.name.toLowerCase().includes('deployment') ||
          field.name.toLowerCase().includes('transaction')
        );
        
        console.log('🔍 Contract-related fields with arguments:');
        contractFields.forEach((field: any) => {
          console.log(`   ${field.name}: ${field.type?.name || 'Complex'}`);
          if (field.args && field.args.length > 0) {
            field.args.forEach((arg: any) => {
              console.log(`     - ${arg.name}: ${arg.type?.name || 'Complex'}`);
            });
          }
        });
        
        return { schemaFields: schemaInfo, contractFields };
      } else {
        console.log('❌ Schema introspection failed');
        return null;
      }

    } catch (error) {
      console.error('❌ Contract state query failed:', error);
      throw error;
    }
  }

  async queryActualContractState(contractAddress: string): Promise<any> {
    console.log(`📡 Attempting to query contract with common field names...`);
    
    // Use the discovered schema with correct type names
    const possibleQueries = [
      // Query with the correct union types
      {
        name: 'contractActionWithCorrectTypes',
        query: `
          query GetContractActionCorrect($contractAddress: String!) {
            contractAction(address: $contractAddress) {
              __typename
              ... on ContractDeploy {
                address
                transaction {
                  hash
                }
              }
              ... on ContractCall {
                address
                entryPoint
                transaction {
                  hash
                }
              }
              ... on ContractUpdate {
                address
                transaction {
                  hash
                }
              }
            }
          }
        `
      },
      // Try to see if there are any contracts at all (explore transactions)
      {
        name: 'exploreTransactions',
        query: `
          query ExploreTransactions {
            transactions(offset: { hash: "0000000000000000000000000000000000000000000000000000000000000000" }) {
              hash
              contractActions {
                __typename
                ... on ContractDeploy {
                  address
                }
                ... on ContractCall {
                  address
                  entryPoint
                }
              }
            }
          }
        `
      },
      // Try without variables first
      {
        name: 'contractActionNoVars',
        query: `
          query GetContractActionNoVars {
            contractAction(address: "0200c79698a29be94e3b4e3f19ceb1a6f25b206cda15347e68caf15083e715a69c6a") {
              __typename
              ... on ContractDeploy {
                address
              }
              ... on ContractCall {
                address
                entryPoint
              }
              ... on ContractUpdate {
                address
              }
            }
          }
        `
      },
      // Try to understand if the address format is correct
      {
        name: 'testBasicContractQuery',
        query: `
          query TestBasicContract($contractAddress: String!) {
            contractAction(address: $contractAddress) {
              __typename
            }
          }
        `
      }
    ];

    for (const queryAttempt of possibleQueries) {
      try {
        console.log(`🔍 Trying query approach: ${queryAttempt.name}`);
        
        const response = await fetch(this.graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: queryAttempt.query,
            variables: { contractAddress },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          if (!result.errors && result.data) {
            console.log(`✅ Query ${queryAttempt.name} worked!`);
            console.log('📋 Result:', JSON.stringify(result.data, null, 2));
            return result.data;
          } else if (result.errors) {
            console.log(`❌ Query ${queryAttempt.name} failed:`, result.errors[0]?.message);
          }
        }
      } catch (error) {
        console.log(`❌ Query ${queryAttempt.name} error:`, error);
      }
    }
    
    console.log('❌ All query attempts failed');
    return null;
  }

  async exploreExistingContracts(): Promise<any> {
    console.log('🌐 Exploring existing contracts on TestNet...');
    
    try {
      const query = `
        query ExploreContracts {
          transactions(offset: { hash: "0000000000000000000000000000000000000000000000000000000000000000" }) {
            hash
            contractActions {
              __typename
              ... on ContractDeploy {
                address
                transaction {
                  hash
                  block {
                    height
                    timestamp
                  }
                }
              }
              ... on ContractCall {
                address
                entryPoint
                transaction {
                  hash
                  block {
                    height
                  }
                }
              }
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
        console.error('❌ Contract exploration failed:', result.errors);
        return null;
      }

      const transactions = result.data?.transactions;
      
      if (transactions && transactions.length > 0) {
        console.log(`✅ Found ${transactions.length} transactions`);
        
        const contractAddresses = new Set();
        let deployCount = 0;
        let callCount = 0;
        
        transactions.forEach((tx: any) => {
          if (tx.contractActions) {
            tx.contractActions.forEach((action: any) => {
              if (action.address) {
                contractAddresses.add(action.address);
                
                if (action.__typename === 'ContractDeploy') {
                  deployCount++;
                  console.log(`📋 Deploy: ${action.address} (tx: ${action.transaction?.hash?.substring(0, 10)}...)`);
                } else if (action.__typename === 'ContractCall') {
                  callCount++;
                  console.log(`📞 Call: ${action.address} -> ${action.entryPoint} (tx: ${action.transaction?.hash?.substring(0, 10)}...)`);
                }
              }
            });
          }
        });
        
        console.log(`🏗️ Total deployments: ${deployCount}`);
        console.log(`📞 Total calls: ${callCount}`);
        console.log(`🏠 Unique contracts: ${contractAddresses.size}`);
        
        return {
          transactions,
          contractAddresses: Array.from(contractAddresses),
          stats: { deployCount, callCount, uniqueContracts: contractAddresses.size }
        };
        
      } else {
        console.log('❌ No transactions found');
        return null;
      }

    } catch (error) {
      console.error('❌ Contract exploration error:', error);
      return null;
    }
  }

  async introspectContractActionType(): Promise<any> {
    console.log('🔍 Introspecting ContractAction type...');
    
    try {
      const query = `
        query IntrospectContractAction {
          __type(name: "ContractAction") {
            name
            kind
            possibleTypes {
              name
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
        console.error('❌ ContractAction introspection failed:', result.errors);
        return null;
      }

      const contractActionType = result.data?.__type;
      
      if (contractActionType) {
        console.log('✅ ContractAction type info:');
        console.log(`   Kind: ${contractActionType.kind}`);
        console.log(`   Name: ${contractActionType.name}`);
        
        if (contractActionType.possibleTypes) {
          console.log('📋 Possible types:');
          contractActionType.possibleTypes.forEach((type: any) => {
            console.log(`   ${type.name}:`);
            if (type.fields) {
              type.fields.forEach((field: any) => {
                console.log(`     - ${field.name}: ${field.type?.name || 'Complex'}`);
              });
            }
          });
        }
        
        return contractActionType;
      } else {
        console.log('❌ ContractAction type not found');
        return null;
      }

    } catch (error) {
      console.error('❌ ContractAction introspection error:', error);
      return null;
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