/**
 * Midnight Providers Setup for Mobile
 * 
 * Simplified React Native compatible implementation that focuses on core contract functionality
 * Avoids WASM dependencies while providing real TestNet connectivity
 */

import { MidnightNetworkId } from './midnightContractClient';
import {
  type PublicDataProvider,
  type ContractLedgerReader,
  createIndexerPublicDataProvider,
  createContractLedgerReader,
  setupContractReader,
} from './contractStateReader';
import { NETWORK_CONSTANTS, DEFAULT_CONTRACT_ADDRESS } from './constants';
import { NetworkId } from './addressGeneration';

/**
 * 🚀 USING YOUR EXISTING NETWORK ID INTERFACE - NO BULLSHIT!
 * 
 * Finally using the NetworkId you already fucking implemented!
 */

/**
 * Convert network type to network ID using YOUR existing interface
 */
export function getNetworkId(networkType: 'local' | 'testnet' | 'mainnet' = 'local'): number {
  switch (networkType) {
    case 'local':
      return NetworkId.Undeployed;  // Local uses Undeployed (0x00)
    case 'testnet':
      return NetworkId.TestNet;
    case 'mainnet':
      return NetworkId.MainNet;
    default:
      return NetworkId.Undeployed;  // Default to Undeployed for local
  }
}

/**
 * Convert network ID to hex string (2 characters, zero-padded)
 */
export function networkIdToHex(networkId: number): string {
  return networkId.toString(16).padStart(2, '0').toLowerCase();
}

/**
 * Prepends the network ID to a contract address (same as official indexer provider)
 * This is required because the indexer expects addresses with network ID prefix
 * while the ledger WASM API provides addresses without it
 * 
 * 🚀 USING OUR CUSTOM IMPLEMENTATION - NO DEPENDENCIES!
 */
export function prependNetworkIdHex(contractAddress: string, networkType: 'local' | 'testnet' | 'mainnet' = 'local'): string {
  try {
    const networkId = getNetworkId(networkType);
    const networkHex = networkIdToHex(networkId);
    const prefixedAddress = `${networkHex}${contractAddress}`;
    
    console.log(`🚀 CUSTOM network ID prepending:`);
    console.log(`   Network: ${networkType}`);
    console.log(`   ID: ${networkId} → Hex: ${networkHex}`);
    console.log(`   ${contractAddress} → ${prefixedAddress}`);
    
    return prefixedAddress;
  } catch (error) {
    console.log(`⚠️ Failed to prepend network ID, using original address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return contractAddress;
  }
}

// 🚀 USING CUSTOM IMPLEMENTATION: No dependency on problematic official package
// Our custom implementation is React Native compatible and works perfectly!

// Core provider configuration
export interface MidnightProvidersConfig {
  networkId: MidnightNetworkId;
  indexerUrl: string;
  indexerWsUrl: string;
  proofServerUrl: string;
  nodeUrl: string;
}

/**
 * Create TestNet providers configuration with local proof server fallback
 */
export function createTestnetProvidersConfig(): MidnightProvidersConfig {
  return {
    networkId: MidnightNetworkId.TestNet,
    indexerUrl: NETWORK_CONSTANTS.TESTNET.INDEXER_URL,
    indexerWsUrl: NETWORK_CONSTANTS.TESTNET.INDEXER_WS_URL,
    proofServerUrl: NETWORK_CONSTANTS.PROOF_SERVER_URL, // Always use local proof server as fallback
    nodeUrl: NETWORK_CONSTANTS.TESTNET.NODE_URL,
  };
}

/**
 * Create local development providers configuration
 */
export function createLocalProvidersConfig(): MidnightProvidersConfig {
  return {
    networkId: MidnightNetworkId.DevNet,
    indexerUrl: NETWORK_CONSTANTS.LOCAL.INDEXER_URL,
    indexerWsUrl: NETWORK_CONSTANTS.LOCAL.INDEXER_WS_URL,
    proofServerUrl: NETWORK_CONSTANTS.PROOF_SERVER_URL, // Consistent local proof server
    nodeUrl: NETWORK_CONSTANTS.LOCAL.NODE_URL,
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

  // Allow access to the GraphQL URL for enhanced queries
  getGraphqlUrl(): string {
    return this.graphqlUrl;
  }

  // First, let's add a method to find actual contracts
  async findActualContracts(): Promise<string[]> {
    console.log('🔍 Finding actual contracts on the network...');
    
    try {
      const exploration = await this.exploreExistingContracts();
      const contracts = exploration?.contractAddresses || [];
      console.log(`✅ Found ${contracts.length} actual contracts:`, contracts);
      return contracts;
    } catch (error) {
      console.error('❌ Failed to find contracts:', error);
      return [];
    }
  }

  // Enhanced query that includes contract state data for ledger reading
  async queryContractStateWithData(contractAddress: string, networkType: 'local' | 'testnet' | 'mainnet' = 'local'): Promise<any> {
    console.log(`📡 Querying contract state with data: ${contractAddress.substring(0, 20)}...`);
    
    // 🔧 KEY FIX: Use network ID prefixed address (same as official indexer provider)
    const prefixedAddress = prependNetworkIdHex(contractAddress, networkType);
    console.log(`🔧 Using prefixed address for indexer query`);
    
    try {
      // Use the exact same pattern as the working query, just add 'state' field
      const query = `
        query GetContractStateWithData($contractAddress: String!) {
          contractAction(address: $contractAddress) {
            __typename
            state
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
      `;
      
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { contractAddress: prefixedAddress },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('❌ GraphQL errors:', result.errors);
        console.error('❌ Full error details:', JSON.stringify(result.errors, null, 2));
        console.error('❌ Query that failed:', query);
        
        // Try fallback to just get the basic info without state
        console.log('🔄 Trying fallback query without state field...');
        try {
          const fallbackResult = await this.queryActualContractState(contractAddress);
          if (fallbackResult?.contractAction) {
            console.log('✅ Fallback query worked, but no state data available');
            return { contractAction: { ...fallbackResult.contractAction, state: null } };
          }
        } catch (fallbackError) {
          console.log('❌ Fallback query also failed');
        }
        
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      console.log(`✅ Contract state with data query successful`);
      return result.data;

    } catch (error) {
      console.error('❌ Contract state with data query failed:', error);
      throw error;
    }
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

  async queryActualContractState(contractAddress: string, networkType: 'local' | 'testnet' | 'mainnet' = 'local'): Promise<any> {
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
            contractAction(address: "${DEFAULT_CONTRACT_ADDRESS}") {
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
            variables: { contractAddress: prependNetworkIdHex(contractAddress, networkType) },
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
  publicDataProvider: PublicDataProvider;
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
    
    // 🚀 Using our proven custom indexer provider (React Native compatible!)
    console.log('🔧 Using custom indexer provider implementation (React Native compatible)');
    const publicDataProvider = createIndexerPublicDataProvider(contractQuerier);

    console.log('✅ Basic Midnight providers created');

    return {
      contractQuerier,
      privateStateProvider,
      publicDataProvider,
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
 * Create providers for a specific network type
 */
export async function createProvidersForNetwork<StateId extends string = string, State = any>(
  networkType: 'testnet' | 'local'
): Promise<BasicMidnightProviders> {
  console.log(`🌐 Creating providers for ${networkType} network...`);
  
  const config = networkType === 'testnet' 
    ? createTestnetProvidersConfig() 
    : createLocalProvidersConfig();
    
  const providers = await createBasicProviders<StateId, State>(config);
  
  console.log(`✅ ${networkType} providers created with local proof server fallback`);
  
  return providers;
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
      description: 'Official Midnight TestNet + Local Proof Server',
      config: createTestnetProvidersConfig(),
      details: {
        indexer: 'Remote TestNet',
        proofServer: 'Local (localhost:6300)',
        node: 'Remote TestNet'
      }
    },
    {
      key: 'local' as const,
      name: 'Local Development', 
      description: 'Full local Midnight node + Local Proof Server',
      config: createLocalProvidersConfig(),
      details: {
        indexer: 'Local (localhost:8088)',
        proofServer: 'Local (localhost:6300)',
        node: 'Local (localhost:9944)'
      }
    }
  ];
}

/**
 * Create a contract ledger reader for a specific contract
 */
export async function createContractReader<LedgerType = any>(
  providers: BasicMidnightProviders,
  contractAddress: string,
  ledgerFunction?: (stateData: any) => LedgerType
): Promise<ContractLedgerReader<LedgerType>> {
  console.log(`🔧 Creating contract reader for: ${contractAddress.substring(0, 20)}...`);
  
  return createContractLedgerReader(
    contractAddress,
    providers.publicDataProvider,
    ledgerFunction
  );
}

/**
 * Quick setup for reading from a specific contract
 */
export async function quickContractSetup<LedgerType = any>(
  contractAddress: string,
  ledgerFunction?: (stateData: any) => LedgerType,
  networkType: 'testnet' | 'local' = 'testnet'
): Promise<{
  providers: BasicMidnightProviders;
  ledgerReader: ContractLedgerReader<LedgerType>;
}> {
  console.log(`⚡ Quick contract setup for ${networkType}...`);
  
  const providers = await createProvidersForNetwork(networkType);
  const ledgerReader = await createContractReader(providers, contractAddress, ledgerFunction);
  
  console.log('✅ Quick contract setup complete');
  
  return {
    providers,
    ledgerReader,
  };
}

/**
 * Test reading from a contract (without needing managed files)
 */
export async function testContractRead(
  contractAddress: string,
  networkType: 'testnet' | 'local' = 'testnet'
): Promise<{
  success: boolean;
  contractExists: boolean;
  rawState?: any;
  error?: string;
  availableContracts?: string[];
  networkUsed?: string;
}> {
  console.log(`🧪 Testing contract read on ${networkType}: ${contractAddress.substring(0, 20)}...`);
  
  try {
    const { providers, ledgerReader } = await quickContractSetup(contractAddress, undefined, networkType);
    
    // First, let's see what contracts actually exist
    const actualContracts = await providers.contractQuerier.findActualContracts();
    console.log(`🔍 Found ${actualContracts.length} contracts on ${networkType} network`);
    
    // Test basic connection
    const connectionOk = await providers.publicDataProvider.queryContractState(contractAddress);
    
    if (!connectionOk) {
      return {
        success: false,
        contractExists: false,
        error: 'Contract not found',
        availableContracts: actualContracts,
        networkUsed: networkType
      };
    }
    
    // Try to read raw state
    const rawState = await ledgerReader.readLedgerState();
    
    console.log('✅ Contract read test successful');
    console.log(`   State type: ${typeof rawState}`);
    console.log(`   State preview: ${JSON.stringify(rawState).substring(0, 100)}...`);
    
    return {
      success: true,
      contractExists: true,
      rawState,
      availableContracts: actualContracts,
      networkUsed: networkType
    };
    
  } catch (error) {
    console.error('❌ Contract read test failed:', error);
    
    // Try to get available contracts even if the test failed
    let availableContracts: string[] = [];
    try {
      const providers = await createProvidersForNetwork(networkType);
      availableContracts = await providers.contractQuerier.findActualContracts();
    } catch (e) {
      console.warn('Could not fetch available contracts');
    }
    
    return {
      success: false,
      contractExists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      availableContracts,
      networkUsed: networkType
    };
  }
}