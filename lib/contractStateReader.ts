/**
 * Contract State Reader
 * 
 * Enables reading from Midnight contract state using the indexer without creating transactions.
 * Based on the pattern from midnight-bank project.
 */

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

      return collection.member(key);

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
        throw new Error(`Collection ${collectionName} does not have lookup() function`);
      }

      return collection.lookup(key);

    } catch (error) {
      console.error(`❌ Failed to lookup collection item:`, error);
      throw error;
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
      // Get current contract state first
      const contractState = await this.publicDataProvider.queryContractState(this.contractAddress);
      if (!contractState) {
        console.error(`❌ No contract state available for circuit call`);
        return null;
      }

      // Call the pure circuit function with current state and parameters
      const circuitFunction = this.circuitFunctions[functionName];
      const result = await circuitFunction(contractState.data, ...parameters);
      
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
