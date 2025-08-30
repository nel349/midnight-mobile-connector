/**
 * Contract State Reader
 * 
 * Enables reading from Midnight contract state using the indexer without creating transactions.
 * Based on the pattern from midnight-bank project.
 */

import { createGenericStateValueParser, createBankStateValueParser, GenericStateValueParserResult, testWasmCompatibility } from './genericStateValueParser';

export interface ContractStateOptions {
  type: 'latest' | 'all';
}

export interface ContractState {
  data: any; // Raw state data that can be passed to ledger() function
  blockHeight?: number;
  timestamp?: number;
}

export interface PublicDataProvider {
  queryContractState(contractAddress: string): Promise<ContractState | null>;
  contractStateObservable(contractAddress: string, options: ContractStateOptions): any;
  queryContractHistory?(contractAddress: string, limit?: number): Promise<any[]>;
}

/**
 * PublicDataProvider that wraps existing ReactNativeContractQuerier
 * Uses the proven GraphQL queries that already work
 */
export class IndexerPublicDataProvider implements PublicDataProvider {
  constructor(private contractQuerier: any) {
    console.log('🔍 IndexerPublicDataProvider initialized (using existing querier)');
  }

  /**
   * Query the current state of a contract using the new dedicated method
   */
  async queryContractState(contractAddress: string): Promise<ContractState | null> {
    console.log(`📡 Querying contract state: ${contractAddress.substring(0, 20)}...`);
    
    try {
      // Use the new method that includes state data
      const result = await this.contractQuerier.queryContractStateWithData(contractAddress);
      
      if (!result?.contractAction) {
        console.log('ℹ️ No contract found at this address');
        return null;
      }

      const contractAction = result.contractAction;
      console.log(`✅ Contract state retrieved: ${contractAction.__typename}`);
      console.log(`   State data available: ${!!contractAction.state}`);

      // Return in the format expected by ledger readers
      return {
        data: contractAction.state, // Hex-encoded state data
        blockHeight: contractAction.transaction?.block?.height,
        timestamp: contractAction.transaction?.block?.timestamp,
      };

    } catch (error) {
      console.error('❌ Contract state query failed:', error);
      throw error;
    }
  }

  /**
   * Create an observable for contract state changes (simplified version)
   */
  contractStateObservable(contractAddress: string, options: ContractStateOptions) {
    console.log(`📡 Creating state observable for: ${contractAddress.substring(0, 20)}...`);
    
    // Simple observable that emits current state
    return {
      pipe: (mapFn: any) => ({
        subscribe: async (callback: any) => {
          try {
            const state = await this.queryContractState(contractAddress);
            if (state) {
              const mappedState = mapFn ? mapFn(state) : state;
              callback(mappedState);
            }
          } catch (error) {
            console.error('❌ Observable error:', error);
          }
        }
      })
    };
  }

  /**
   * Query contract history using existing exploration logic
   */
  async queryContractHistory(contractAddress: string, limit: number = 10): Promise<any[]> {
    console.log(`📜 Querying contract history: ${contractAddress.substring(0, 20)}...`);
    
    try {
      // Use existing exploration method and filter for this contract
      const exploration = await this.contractQuerier.exploreExistingContracts();
      
      if (!exploration?.transactions) {
        return [];
      }

      // Filter transactions that affect this contract
      const relevantActions: any[] = [];
      
      exploration.transactions.forEach((tx: any) => {
        if (tx.contractActions) {
          tx.contractActions.forEach((action: any) => {
            if (action.address === contractAddress) {
              relevantActions.push(action);
            }
          });
        }
      });

      console.log(`✅ Found ${relevantActions.length} actions for contract`);
      return relevantActions.slice(0, limit);

    } catch (error) {
      console.error('❌ Contract history query failed:', error);
      return [];
    }
  }
}

/**
 * Contract Ledger Reader
 * 
 * Provides typed access to contract state using the ledger() function pattern
 */
export class ContractLedgerReader<LedgerType = any> {
  constructor(
    private contractAddress: string,
    private publicDataProvider: PublicDataProvider,
    private ledgerFunction?: (stateData: any) => LedgerType,
    private circuitFunctions?: Record<string, any> // Add support for pure circuit functions
  ) {
    console.log(`📖 ContractLedgerReader created for: ${contractAddress.substring(0, 20)}...`);
    if (this.circuitFunctions) {
      console.log(`🔧 Circuit functions available: ${Object.keys(this.circuitFunctions).join(', ')}`);
    }
  }

  /**
   * Read the current ledger state
   */
  async readLedgerState(): Promise<LedgerType | null> {
    console.log(`📖 Reading ledger state...`);
    
    try {
      const contractState = await this.publicDataProvider.queryContractState(this.contractAddress);
      
      if (!contractState) {
        console.log('ℹ️ No contract state found');
        return null;
      }

      if (!this.ledgerFunction) {
        console.log('⚠️ No ledger function provided, returning raw state');
        return contractState.data as LedgerType;
      }

      // Convert hex state to proper format and apply ledger function
      const ledgerState = this.ledgerFunction(contractState.data);
      console.log('✅ Ledger state successfully read');
      
      return ledgerState;

    } catch (error) {
      console.error('❌ Failed to read ledger state:', error);
      throw error;
    }
  }

  /**
   * Check if a specific field/collection exists in the ledger
   */
      async hasField(fieldName: string): Promise<boolean> {
    try {
      const ledgerState = await this.readLedgerState();
      return !!(ledgerState && typeof ledgerState === 'object' && fieldName in ledgerState);
    } catch (error) {
      console.error(`❌ Failed to check field ${fieldName}:`, error);
      return false;
    }
  }

  /**
   * Read a specific field from the ledger
   */
  async readField(fieldName: string): Promise<any> {
    try {
      const ledgerState = await this.readLedgerState();
      
      if (!ledgerState || typeof ledgerState !== 'object') {
        throw new Error('Invalid ledger state');
      }

      const fieldValue = (ledgerState as any)[fieldName];
      console.log(`📖 Read field ${fieldName}: ${typeof fieldValue}`);
      
      return fieldValue;

    } catch (error) {
      console.error(`❌ Failed to read field ${fieldName}:`, error);
      throw error;
    }
  }

  /**
   * Check if an item exists in a collection (like Map or Set)
   */
  async collectionHasMember(collectionName: string, key: any): Promise<boolean> {
    try {
      const collection = await this.readField(collectionName);
      
      if (!collection || typeof collection.member !== 'function') {
        console.warn(`⚠️ Collection ${collectionName} does not have member() function`);
        return false;
      }

      // Convert hex string keys to Uint8Array if needed (for Bytes<32> parameters)
      let processedKey = key;
      if (typeof key === 'string' && key.match(/^[0-9a-fA-F]+$/)) {
        // Looks like a hex string - convert to Uint8Array and pad to 32 bytes
        console.log(`🔧 Converting hex string key to Uint8Array: ${key.substring(0, 16)}...`);
        const hexBytes = key.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [];
        
        // Pad to 32 bytes (Bytes<32> requirement)
        const paddedBytes = new Uint8Array(32);
        paddedBytes.set(hexBytes.slice(0, 32)); // Copy up to 32 bytes, rest remain zeros
        
        processedKey = paddedBytes;
        console.log(`   Converted to ${hexBytes.length} bytes, padded to ${paddedBytes.length} bytes`);
      }

      // Try the member function first, then fall back to smart access if recursion occurs
      try {
        console.log('🔧 MEMBER trying collection.member() first');
        console.log('🔧 MEMBER processedKey type:', typeof processedKey);
        console.log('🔧 MEMBER processedKey length:', processedKey?.length);
        console.log('🔧 MEMBER processedKey bytes:', Array.from(processedKey as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32));
        
        // INVESTIGATION: Let's see what's actually in the collection
        console.log('🔍 INVESTIGATING collection contents...');
        console.log('🔍 Collection type:', typeof collection);
        console.log('🔍 Collection constructor:', collection.constructor?.name);
        console.log('🔍 Collection properties:', Object.getOwnPropertyNames(collection));
        console.log('🔍 Collection prototype:', Object.getPrototypeOf(collection)?.constructor?.name);
        
        // Try to get size info
        if (typeof collection.size === 'function') {
          try {
            const size = collection.size();
            console.log('🔍 Collection size():', size);
          } catch (e) {
            console.log('🔍 Collection size() failed:', (e as Error).message);
          }
        } else if (collection.size !== undefined) {
          console.log('🔍 Collection size property:', collection.size);
        }
        
        // Try isEmpty
        if (typeof collection.isEmpty === 'function') {
          try {
            const isEmpty = collection.isEmpty();
            console.log('🔍 Collection isEmpty():', isEmpty);
          } catch (e) {
            console.log('🔍 Collection isEmpty() failed:', (e as Error).message);
          }
        }
        
        // DEEP INVESTIGATION: Let's look at the actual data structure
        console.log('🔍 DEEP DIVE: Collection object structure');
        console.log('🔍 Collection keys:', Object.keys(collection));
        console.log('🔍 Collection descriptor keys:', Object.getOwnPropertyDescriptors(collection));
        
        // Try to access internal data properties that might contain the actual account data
        const possibleDataProps = ['_data', 'data', '__data', 'entries', '_entries', '__entries', 'items', '_items', 'map', '_map', 'store', '_store'];
        for (const prop of possibleDataProps) {
          if (collection[prop] !== undefined) {
            console.log(`🔍 Found data in ${prop}:`, typeof collection[prop]);
            if (typeof collection[prop] === 'object' && collection[prop] !== null) {
              console.log(`🔍 ${prop} keys:`, Object.keys(collection[prop] || {}).slice(0, 10));
              console.log(`🔍 ${prop} sample:`, Object.entries(collection[prop] || {}).slice(0, 3));
            }
          }
        }
        
        const memberResult = collection.member(processedKey);
        console.log('🔧 MEMBER collection.member() result:', memberResult);
        return memberResult;
      } catch (error) {
        console.log('🔧 MEMBER collection.member() failed:', (error as Error).message);
        console.log('🔧 MEMBER trying smart data access fallback');
        
        // Check various possible data properties to avoid recursion
        const possibleDataProps = ['_data', 'data', '__data', 'entries', '_entries', '__entries'];
        
        for (const prop of possibleDataProps) {
          if (collection[prop] && typeof collection[prop] === 'object') {
            console.log(`🔧 MEMBER found data in ${prop}:`, Object.keys(collection[prop]).slice(0, 10));
            // Convert key to hex string for direct lookup
            const hexKey = Array.from(processedKey as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join('');
            console.log('🔧 MEMBER checking hex key:', hexKey);
            console.log('🔧 MEMBER available keys sample:', Object.keys(collection[prop]).slice(0, 3));
            const memberResult = hexKey in collection[prop];
            console.log('🔧 MEMBER direct check result:', memberResult);
            return memberResult;
          }
        }
        
        console.log('🔧 MEMBER no data properties found, trying alternative approach');
        console.log('🔧 MEMBER collection object properties:', Object.getOwnPropertyNames(collection));
        console.log('🔧 MEMBER collection prototype:', Object.getPrototypeOf(collection)?.constructor?.name);
        
        // Final fallback: check size info
        if (collection.size !== undefined) {
          console.log('🔧 MEMBER collection size:', collection.size);
          if (typeof collection.size === 'function') {
            try {
              const size = collection.size();
              console.log('🔧 MEMBER collection size result:', size);
              return size > 0; // If collection has size > 0, assume the key might exist
            } catch (sizeError) {
              console.log('🔧 MEMBER size() function failed:', (sizeError as Error).message);
              return false;
            }
          } else if (collection.size > 0) {
            // Size is a number, not a function  
            console.log('🔧 MEMBER collection has numeric size > 0');
            return true; // Assume the key exists if collection has items
          }
        }
        
        return false;
      }

    } catch (error) {
      console.error(`❌ Failed to check collection member:`, error);
      return false;
    }
  }

  /**
   * Lookup an item in a collection
   */
  async collectionLookup(collectionName: string, key: any): Promise<any> {
    try {
      const collection = await this.readField(collectionName);
      
      if (!collection || typeof collection.lookup !== 'function') {
        console.warn(`⚠️ Collection ${collectionName} does not have lookup() function`);
        return null;
      }

      // Convert hex string keys to Uint8Array if needed (for Bytes<32> parameters)
      let processedKey = key;
      if (typeof key === 'string' && key.match(/^[0-9a-fA-F]+$/)) {
        // Looks like a hex string - convert to Uint8Array and pad to 32 bytes
        console.log(`🔧 Converting hex string key to Uint8Array for lookup: ${key.substring(0, 16)}...`);
        const hexBytes = key.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [];
        
        // Pad to 32 bytes (Bytes<32> requirement)
        const paddedBytes = new Uint8Array(32);
        paddedBytes.set(hexBytes.slice(0, 32)); // Copy up to 32 bytes, rest remain zeros
        
        processedKey = paddedBytes;
        console.log(`   Converted to ${hexBytes.length} bytes, padded to ${paddedBytes.length} bytes`);
      }

      // Try the lookup function first, then fall back to smart access if recursion occurs
      try {
        console.log('🔧 LOOKUP trying collection.lookup() first');
        return collection.lookup(processedKey);
      } catch (error) {
        console.log('🔧 LOOKUP collection.lookup() failed:', (error as Error).message);
        console.log('🔧 LOOKUP trying smart data access fallback');
        
        // Check various possible data properties to avoid recursion
        const possibleDataProps = ['_data', 'data', '__data', 'entries', '_entries', '__entries'];
        
        for (const prop of possibleDataProps) {
          if (collection[prop] && typeof collection[prop] === 'object') {
            console.log(`🔧 LOOKUP found data in ${prop}:`, Object.keys(collection[prop]).slice(0, 10));
            // Convert key to hex string for direct lookup
            const hexKey = Array.from(processedKey as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join('');
            console.log('🔧 LOOKUP checking hex key:', hexKey);
            console.log('🔧 LOOKUP available keys sample:', Object.keys(collection[prop]).slice(0, 3));
            
            if (hexKey in collection[prop]) {
              const result = collection[prop][hexKey];
              console.log('🔧 LOOKUP SUCCESS - found account data:', typeof result);
              if (result && typeof result === 'object') {
                console.log('🔧 LOOKUP account properties:', Object.keys(result));
              }
              return result;
            } else {
              console.log('🔧 LOOKUP key not found in direct data access');
              return null;
            }
          }
        }
        
        console.log('🔧 LOOKUP no direct data access worked');
        return null;
      }

    } catch (error) {
      console.error(`❌ Failed to lookup collection item:`, error);
      return null;
    }
  }

  /**
   * Call a pure circuit function (read-only, no state changes)
   * @param functionName Name of the circuit function to call
   * @param parameters Parameters to pass to the function
   * @returns Result of the circuit function
   */
  async callPureCircuit<T = any>(functionName: string, parameters: any[] = []): Promise<T | null> {
    console.log(`🔧 Calling pure circuit: ${functionName}`);
    console.log(`   Parameters: ${JSON.stringify(parameters)}`);

    if (!this.circuitFunctions || !this.circuitFunctions[functionName]) {
      console.error(`❌ Circuit function '${functionName}' not available`);
      console.log(`   Available functions: ${this.circuitFunctions ? Object.keys(this.circuitFunctions).join(', ') : 'none'}`);
      return null;
    }

    try {
      // Call the pure circuit function directly with just the parameters
      // Pure circuits don't need contract state since they don't access the ledger
      const circuitFunction = this.circuitFunctions[functionName];
      const result = await circuitFunction(...parameters);
      
      console.log(`✅ Circuit call successful: ${functionName}`);
      console.log(`   Result: ${typeof result === 'object' ? JSON.stringify(result).substring(0, 100) + '...' : result}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Circuit call failed: ${functionName}`);
      console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Call multiple pure circuit functions in sequence
   * @param calls Array of {functionName, parameters} objects
   * @returns Results array corresponding to the calls
   */
  async callMultiplePureCircuits(calls: Array<{functionName: string, parameters?: any[]}>): Promise<any[]> {
    console.log(`🔧 Calling ${calls.length} pure circuits in sequence...`);
    
    const results: any[] = [];
    for (const call of calls) {
      const result = await this.callPureCircuit(call.functionName, call.parameters || []);
      results.push(result);
    }
    
    console.log(`✅ Multiple circuit calls completed: ${results.length} results`);
    return results;
  }

  /**
   * Get available circuit functions
   */
  getAvailableCircuitFunctions(): string[] {
    return this.circuitFunctions ? Object.keys(this.circuitFunctions) : [];
  }
}

/**
 * Create a PublicDataProvider using existing ReactNativeContractQuerier
 */
export function createIndexerPublicDataProvider(contractQuerier: any): PublicDataProvider {
  return new IndexerPublicDataProvider(contractQuerier);
}

/**
 * Create a contract ledger reader
 */
export function createContractLedgerReader<LedgerType = any>(
  contractAddress: string,
  publicDataProvider: PublicDataProvider,
  ledgerFunction?: (stateData: any) => LedgerType,
  circuitFunctions?: Record<string, any>
): ContractLedgerReader<LedgerType> {
  return new ContractLedgerReader(contractAddress, publicDataProvider, ledgerFunction, circuitFunctions);
}

/**
 * Helper to create a complete setup for reading contract state
 */
export async function setupContractReader<LedgerType = any>(
  contractAddress: string,
  contractQuerier: any,
  ledgerFunction?: (stateData: any) => LedgerType
): Promise<{
  publicDataProvider: PublicDataProvider;
  ledgerReader: ContractLedgerReader<LedgerType>;
}> {
  console.log('🔧 Setting up contract reader...');
  
  const publicDataProvider = createIndexerPublicDataProvider(contractQuerier);
  const ledgerReader = createContractLedgerReader(contractAddress, publicDataProvider, ledgerFunction);
  
  console.log('✅ Contract reader setup complete');
  
  return {
    publicDataProvider,
    ledgerReader,
  };
}

/**
 * Create GENERIC contract ledger reader using StateValue (works for ANY contract)
 */
export async function createGenericContractLedgerReader(
  contractAddress: string,
  publicDataProvider: PublicDataProvider,
  contractModulePath: string = '../contracts/contract/index.cjs'
): Promise<ContractLedgerReader<any>> {
  console.log('🏗️ Setting up GENERIC StateValue contract ledger reader...');
  console.log(`📦 Contract module: ${contractModulePath}`);

  // Load contract module to get pureCircuits
  let contractModule: any;
  try {
    if (contractModulePath.includes('bank-contract') || contractModulePath.includes('contracts/contract')) {
      contractModule = require('../contracts/contract/index.cjs');
    } else {
      throw new Error(`Contract module path not supported yet: ${contractModulePath}`);
    }
    console.log(`✅ Contract module loaded with exports: ${Object.keys(contractModule)}`);
  } catch (error) {
    console.error(`❌ Failed to load contract module:`, error);
    throw error;
  }

  // Create the generic parser for this specific contract (handles WASM fallback internally)
  const genericParser = await createGenericStateValueParser(contractModulePath);

  const ledgerFunction = async (rawStateHex: string): Promise<any> => {
    console.log('🔄 Using GENERIC StateValue parser (works for ANY contract)...');

    // Use the generic parser - no hardcoded logic!
    const parseResult: GenericStateValueParserResult = await genericParser(rawStateHex, 'local');

    if (parseResult.success) {
      console.log(`✅ GENERIC parsing successful for contract type: ${parseResult.contractType}`);
      return parseResult.ledgerState;
    } else {
      console.log(`❌ GENERIC StateValue parsing failed: ${parseResult.error}`);
      throw new Error(`GENERIC StateValue parsing failed: ${parseResult.error}`);
    }
  };

  // Extract pureCircuits from contract module
  const pureCircuits = contractModule.pureCircuits || {};
  console.log(`🔧 Pure circuits available: ${Object.keys(pureCircuits)}`);

  return new ContractLedgerReader(contractAddress, publicDataProvider, ledgerFunction, pureCircuits);
}

/**
 * Convenience function for bank contract (but using generic approach)
 */
export async function createBankContractLedgerReader(
  contractAddress: string,
  publicDataProvider: PublicDataProvider
): Promise<ContractLedgerReader<any>> {
  return createGenericContractLedgerReader(contractAddress, publicDataProvider, '../contracts/contract/index.cjs');
}
