"use strict";
/**
 * Contract State Reader
 *
 * Enables reading from Midnight contract state using the indexer without creating transactions.
 * Based on the pattern from midnight-bank project.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractLedgerReader = exports.IndexerPublicDataProvider = void 0;
exports.createIndexerPublicDataProvider = createIndexerPublicDataProvider;
exports.createContractLedgerReader = createContractLedgerReader;
exports.setupContractReader = setupContractReader;
exports.createGenericContractLedgerReader = createGenericContractLedgerReader;
exports.createBankContractLedgerReader = createBankContractLedgerReader;
const genericStateValueParser_1 = require("./genericStateValueParser");
/**
 * PublicDataProvider that wraps existing ReactNativeContractQuerier
 * Uses the proven GraphQL queries that already work
 */
class IndexerPublicDataProvider {
    constructor(contractQuerier) {
        this.contractQuerier = contractQuerier;
        console.log('🔍 IndexerPublicDataProvider initialized (using existing querier)');
    }
    /**
     * Query the current state of a contract using the new dedicated method
     */
    async queryContractState(contractAddress) {
        var _a, _b, _c, _d;
        console.log(`📡 Querying contract state: ${contractAddress.substring(0, 20)}...`);
        try {
            // Use the new method that includes state data
            const result = await this.contractQuerier.queryContractStateWithData(contractAddress);
            if (!(result === null || result === void 0 ? void 0 : result.contractAction)) {
                console.log('ℹ️ No contract found at this address');
                return null;
            }
            const contractAction = result.contractAction;
            console.log(`✅ Contract state retrieved: ${contractAction.__typename}`);
            console.log(`   State data available: ${!!contractAction.state}`);
            // Return in the format expected by ledger readers
            return {
                data: contractAction.state, // Hex-encoded state data
                blockHeight: (_b = (_a = contractAction.transaction) === null || _a === void 0 ? void 0 : _a.block) === null || _b === void 0 ? void 0 : _b.height,
                timestamp: (_d = (_c = contractAction.transaction) === null || _c === void 0 ? void 0 : _c.block) === null || _d === void 0 ? void 0 : _d.timestamp,
            };
        }
        catch (error) {
            console.error('❌ Contract state query failed:', error);
            throw error;
        }
    }
    /**
     * Create an observable for contract state changes (simplified version)
     */
    contractStateObservable(contractAddress, options) {
        console.log(`📡 Creating state observable for: ${contractAddress.substring(0, 20)}...`);
        // Simple observable that emits current state
        return {
            pipe: (mapFn) => ({
                subscribe: async (callback) => {
                    try {
                        const state = await this.queryContractState(contractAddress);
                        if (state) {
                            const mappedState = mapFn ? mapFn(state) : state;
                            callback(mappedState);
                        }
                    }
                    catch (error) {
                        console.error('❌ Observable error:', error);
                    }
                }
            })
        };
    }
    /**
     * Query contract history using existing exploration logic
     */
    async queryContractHistory(contractAddress, limit = 10) {
        console.log(`📜 Querying contract history: ${contractAddress.substring(0, 20)}...`);
        try {
            // Use existing exploration method and filter for this contract
            const exploration = await this.contractQuerier.exploreExistingContracts();
            if (!(exploration === null || exploration === void 0 ? void 0 : exploration.transactions)) {
                return [];
            }
            // Filter transactions that affect this contract
            const relevantActions = [];
            exploration.transactions.forEach((tx) => {
                if (tx.contractActions) {
                    tx.contractActions.forEach((action) => {
                        if (action.address === contractAddress) {
                            relevantActions.push(action);
                        }
                    });
                }
            });
            console.log(`✅ Found ${relevantActions.length} actions for contract`);
            return relevantActions.slice(0, limit);
        }
        catch (error) {
            console.error('❌ Contract history query failed:', error);
            return [];
        }
    }
}
exports.IndexerPublicDataProvider = IndexerPublicDataProvider;
/**
 * Contract Ledger Reader
 *
 * Provides typed access to contract state using the ledger() function pattern
 */
class ContractLedgerReader {
    constructor(contractAddress, publicDataProvider, ledgerFunction, circuitFunctions // Add support for pure circuit functions
    ) {
        this.contractAddress = contractAddress;
        this.publicDataProvider = publicDataProvider;
        this.ledgerFunction = ledgerFunction;
        this.circuitFunctions = circuitFunctions;
        console.log(`📖 ContractLedgerReader created for: ${contractAddress.substring(0, 20)}...`);
        if (this.circuitFunctions) {
            console.log(`🔧 Circuit functions available: ${Object.keys(this.circuitFunctions).join(', ')}`);
        }
    }
    /**
     * Read the current ledger state
     */
    async readLedgerState() {
        console.log(`📖 Reading ledger state...`);
        try {
            const contractState = await this.publicDataProvider.queryContractState(this.contractAddress);
            if (!contractState) {
                console.log('ℹ️ No contract state found');
                return null;
            }
            if (!this.ledgerFunction) {
                console.log('⚠️ No ledger function provided, returning raw state');
                return contractState.data;
            }
            // Convert hex state to proper format and apply ledger function
            const ledgerState = this.ledgerFunction(contractState.data);
            console.log('✅ Ledger state successfully read');
            return ledgerState;
        }
        catch (error) {
            console.error('❌ Failed to read ledger state:', error);
            throw error;
        }
    }
    /**
     * Check if a specific field/collection exists in the ledger
     */
    async hasField(fieldName) {
        try {
            const ledgerState = await this.readLedgerState();
            return !!(ledgerState && typeof ledgerState === 'object' && fieldName in ledgerState);
        }
        catch (error) {
            console.error(`❌ Failed to check field ${fieldName}:`, error);
            return false;
        }
    }
    /**
     * Read a specific field from the ledger
     */
    async readField(fieldName) {
        try {
            const ledgerState = await this.readLedgerState();
            if (!ledgerState || typeof ledgerState !== 'object') {
                throw new Error('Invalid ledger state');
            }
            const fieldValue = ledgerState[fieldName];
            console.log(`📖 Read field ${fieldName}: ${typeof fieldValue}`);
            return fieldValue;
        }
        catch (error) {
            console.error(`❌ Failed to read field ${fieldName}:`, error);
            throw error;
        }
    }
    /**
     * Check if an item exists in a collection (like Map or Set)
     */
    async collectionHasMember(collectionName, key) {
        var _a;
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
                const hexBytes = ((_a = key.match(/.{2}/g)) === null || _a === void 0 ? void 0 : _a.map(byte => parseInt(byte, 16))) || [];
                // Pad to 32 bytes (Bytes<32> requirement)
                const paddedBytes = new Uint8Array(32);
                paddedBytes.set(hexBytes.slice(0, 32)); // Copy up to 32 bytes, rest remain zeros
                processedKey = paddedBytes;
                console.log(`   Converted to ${hexBytes.length} bytes, padded to ${paddedBytes.length} bytes`);
            }
            return collection.member(processedKey);
        }
        catch (error) {
            console.error(`❌ Failed to check collection member:`, error);
            return false;
        }
    }
    /**
     * Lookup an item in a collection
     */
    async collectionLookup(collectionName, key) {
        var _a;
        try {
            const collection = await this.readField(collectionName);
            if (!collection || typeof collection.lookup !== 'function') {
                throw new Error(`Collection ${collectionName} does not have lookup() function`);
            }
            // Convert hex string keys to Uint8Array if needed (for Bytes<32> parameters)
            let processedKey = key;
            if (typeof key === 'string' && key.match(/^[0-9a-fA-F]+$/)) {
                // Looks like a hex string - convert to Uint8Array and pad to 32 bytes
                console.log(`🔧 Converting hex string key to Uint8Array for lookup: ${key.substring(0, 16)}...`);
                const hexBytes = ((_a = key.match(/.{2}/g)) === null || _a === void 0 ? void 0 : _a.map(byte => parseInt(byte, 16))) || [];
                // Pad to 32 bytes (Bytes<32> requirement)
                const paddedBytes = new Uint8Array(32);
                paddedBytes.set(hexBytes.slice(0, 32)); // Copy up to 32 bytes, rest remain zeros
                processedKey = paddedBytes;
                console.log(`   Converted to ${hexBytes.length} bytes, padded to ${paddedBytes.length} bytes`);
            }
            return collection.lookup(processedKey);
        }
        catch (error) {
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
    async callPureCircuit(functionName, parameters = []) {
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
        }
        catch (error) {
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
    async callMultiplePureCircuits(calls) {
        console.log(`🔧 Calling ${calls.length} pure circuits in sequence...`);
        const results = [];
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
    getAvailableCircuitFunctions() {
        return this.circuitFunctions ? Object.keys(this.circuitFunctions) : [];
    }
}
exports.ContractLedgerReader = ContractLedgerReader;
/**
 * Create a PublicDataProvider using existing ReactNativeContractQuerier
 */
function createIndexerPublicDataProvider(contractQuerier) {
    return new IndexerPublicDataProvider(contractQuerier);
}
/**
 * Create a contract ledger reader
 */
function createContractLedgerReader(contractAddress, publicDataProvider, ledgerFunction, circuitFunctions) {
    return new ContractLedgerReader(contractAddress, publicDataProvider, ledgerFunction, circuitFunctions);
}
/**
 * Helper to create a complete setup for reading contract state
 */
async function setupContractReader(contractAddress, contractQuerier, ledgerFunction) {
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
async function createGenericContractLedgerReader(contractAddress, publicDataProvider, contractModulePath = '../contracts/contract/index.cjs') {
    console.log('🏗️ Setting up GENERIC StateValue contract ledger reader...');
    console.log(`📦 Contract module: ${contractModulePath}`);
    // Create the generic parser for this specific contract (handles WASM fallback internally)
    const genericParser = await (0, genericStateValueParser_1.createGenericStateValueParser)(contractModulePath);
    const ledgerFunction = async (rawStateHex) => {
        console.log('🔄 Using GENERIC StateValue parser (works for ANY contract)...');
        // Use the generic parser - no hardcoded logic!
        const parseResult = await genericParser(rawStateHex, 'undeployed');
        if (parseResult.success) {
            console.log(`✅ GENERIC parsing successful for contract type: ${parseResult.contractType}`);
            return parseResult.ledgerState;
        }
        else {
            console.log(`❌ GENERIC StateValue parsing failed: ${parseResult.error}`);
            throw new Error(`GENERIC StateValue parsing failed: ${parseResult.error}`);
        }
    };
    return new ContractLedgerReader(contractAddress, publicDataProvider, ledgerFunction);
}
/**
 * Convenience function for bank contract (but using generic approach)
 */
async function createBankContractLedgerReader(contractAddress, publicDataProvider) {
    return createGenericContractLedgerReader(contractAddress, publicDataProvider, '../contracts/contract/index.cjs');
}
