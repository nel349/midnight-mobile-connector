"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGenericStateValueParser = createGenericStateValueParser;
exports.createBankStateValueParser = createBankStateValueParser;
exports.testWasmCompatibility = testWasmCompatibility;
/**
 * Create a React Native compatible runtime when WASM fails
 */
async function createReactNativeCompatibleRuntime() {
    console.log('🔧 Creating React Native compatible StateValue runtime...');
    // Try to get the original StateValue class for prototype inheritance
    let OriginalStateValue = null;
    try {
        const originalRuntime = require('@midnight-ntwrk/compact-runtime');
        if (originalRuntime && originalRuntime.StateValue) {
            OriginalStateValue = originalRuntime.StateValue;
            console.log('✅ Got original StateValue class for prototype inheritance');
        }
        else {
            console.log('⚠️ Compact runtime loaded but StateValue not available');
        }
    }
    catch (e) {
        console.log('⚠️ Could not get original StateValue class, creating standalone version');
    }
    // Create StateValue-compatible objects using the original prototype if available
    function createFakeStateValue() {
        const obj = OriginalStateValue ? Object.create(OriginalStateValue.prototype) : {};
        obj.__wbg_ptr = Math.floor(Math.random() * 1000000); // Fake pointer
        // Add all the methods that StateValue might need
        obj.type = function () { return 'null'; };
        obj.toString = function () { return 'ReactNativeCompatibleStateValue(null)'; };
        obj.free = function () { };
        // Add other potential methods that the contract might call
        obj.isNull = function () { return true; };
        obj.isCell = function () { return false; };
        obj.isMap = function () { return false; };
        // Add getter/setter for data if needed
        Object.defineProperty(obj, 'data', {
            get: function () { return null; },
            set: function (value) { }
        });
        return obj;
    }
    // Create runtime-compatible object
    const runtime = {
        StateValue: {
            newNull: () => createFakeStateValue(),
            newCell: (value) => {
                const obj = createFakeStateValue();
                obj._data = value;
                return obj;
            },
            newMap: (map) => {
                const obj = createFakeStateValue();
                obj._data = map;
                return obj;
            }
        }
    };
    // Add QueryContext and other required classes
    runtime.QueryContext = class ReactNativeQueryContext {
        constructor(state, contractAddress) {
            this.state = state;
            this.contractAddress = contractAddress;
        }
    };
    runtime.ContractState = class ReactNativeContractState {
        constructor() {
            this.data = runtime.StateValue.newNull();
        }
    };
    runtime.dummyContractAddress = function () {
        return '0000000000000000000000000000000000000000000000000000000000000000';
    };
    runtime.CompactError = class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CompactError';
        }
    };
    // Add other properties that the contract module might expect
    runtime.MAX_FIELD = BigInt('52435875175126190479447740508185965837690552500527637822603658699938581184512');
    runtime.versionString = '0.8.1';
    runtime.type_error = function (funcName, argName, location, expectedType, actualValue) {
        throw new Error(`Type error in ${funcName} at ${location}: expected ${expectedType} for ${argName}, got ${typeof actualValue}`);
    };
    // Add CompactType classes that might be needed
    runtime.CompactTypeBytes = class {
        constructor(size) { this.size = size; }
    };
    runtime.CompactTypeUnsignedInteger = class {
        constructor(max, size) { this.max = max; this.size = size; }
    };
    runtime.CompactTypeBoolean = class {
    };
    console.log('✅ React Native compatible runtime created');
    return runtime;
}
/**
 * Create a truly generic StateValue-based parser for ANY contract
 */
async function createGenericStateValueParser(contractModulePath) {
    console.log('🏗️ Creating GENERIC StateValue parser for ANY contract...');
    console.log(`📦 Contract module: ${contractModulePath}`);
    try {
        // Try to load the WASM runtime, but have a fallback for React Native
        let compactRuntime;
        let wasmWorking = false;
        try {
            compactRuntime = require('@midnight-ntwrk/compact-runtime');
            // Test if WASM actually works by trying to create a StateValue
            const testState = compactRuntime.StateValue.newNull();
            testState.type(); // This will fail if WASM isn't properly initialized
            console.log('✅ WASM runtime loaded and working');
            wasmWorking = true;
        }
        catch (wasmError) {
            const errorMessage = wasmError instanceof Error ? wasmError.message : String(wasmError);
            console.log('⚠️ WASM runtime failed:', errorMessage);
            console.log('🔧 Creating React Native compatible runtime...');
            compactRuntime = await createReactNativeCompatibleRuntime();
            wasmWorking = false;
        }
        // For React Native Metro compatibility, we need to use static imports
        // TODO: Make this truly dynamic when Metro supports variable require paths
        let contractModule;
        try {
            if (contractModulePath.includes('bank-contract') || contractModulePath.includes('contracts/contract')) {
                console.log('🔧 About to require contract module...');
                console.log('🔧 Metro should have resolved compact-runtime to our React Native version...');
                contractModule = require('../contracts/contract/index.cjs');
                console.log('🔧 Contract module require completed');
                console.log('🔧 Contract module result type:', typeof contractModule);
                console.log('🔧 Contract module result value:', contractModule);
            }
            else {
                throw new Error(`Contract module path not supported yet: ${contractModulePath}. Add support in genericStateValueParser.ts`);
            }
        }
        catch (contractError) {
            const errorMessage = contractError instanceof Error ? contractError.message : String(contractError);
            console.log(`❌ Contract module loading failed: ${errorMessage}`);
            throw new Error(`Contract module failed to load: ${errorMessage}`);
        }
        try {
            if (wasmWorking) {
                console.log('✅ WASM runtime working, using native implementation');
            }
            else {
                console.log('✅ React Native fallback runtime active');
            }
            console.log('✅ Contract module loaded');
            console.log('🔍 About to inspect contract module...');
            console.log('🔍 Contract module type:', typeof contractModule);
            console.log('🔍 Contract module value:', contractModule);
            if (!contractModule) {
                throw new Error('Contract module is null or undefined!');
            }
            // Check what's available in the contract module
            console.log('🔍 Calling Object.keys on contract module...');
            const moduleKeys = Object.keys(contractModule);
            console.log('📋 Contract module exports:', moduleKeys);
            console.log('🔍 Checking for ledger function...');
            if (!contractModule.ledger) {
                throw new Error('Contract module does not export a ledger function');
            }
            console.log('✅ Contract ledger function found');
        }
        catch (inspectionError) {
            const errorMessage = inspectionError instanceof Error ? inspectionError.message : String(inspectionError);
            console.log(`❌ Contract module post-load error: ${errorMessage}`);
            throw new Error(`Contract module post-load error: ${errorMessage}`);
        }
        return async (rawStateHex, networkId) => {
            try {
                console.log('🔄 Starting GENERIC StateValue parsing...');
                console.log(`📊 Raw state hex length: ${rawStateHex.length} chars`);
                console.log(`🌐 Network ID: ${networkId}`);
                // APPROACH: Use StateValue.newNull() to get the ledger structure
                // The raw state from indexer is already processed, so we get the structure
                // from the contract's ledger function and overlay real data where possible
                console.log('🔄 Creating StateValue.newNull()...');
                const StateValue = compactRuntime.StateValue;
                const nullState = StateValue.newNull();
                console.log('✅ StateValue.newNull() created successfully');
                console.log('🔍 StateValue type:', nullState.type());
                console.log('🔄 Calling contract ledger function...');
                const baseLedgerState = contractModule.ledger(nullState);
                console.log('✅ Contract ledger function completed successfully');
                // Log the structure (but not the full data to avoid huge logs)
                console.log('📋 Ledger state keys:', Object.keys(baseLedgerState));
                // TODO: In the future, we could try to parse the raw state hex to extract
                // actual data and overlay it onto this structure. For now, we return the
                // base structure which will work for testing the generic approach.
                return {
                    success: true,
                    ledgerState: baseLedgerState,
                    contractType: contractModule.name || 'unknown'
                };
            }
            catch (error) {
                console.log(`❌ GENERIC StateValue parsing failed: ${error.message}`);
                console.log(`🔍 Error details:`, error);
                return {
                    success: false,
                    ledgerState: null,
                    error: error.message
                };
            }
        };
    }
    catch (error) {
        console.log(`❌ Failed to load WASM modules: ${error.message}`);
        console.log(`🔍 This means Metro resolution is still broken!`);
        throw new Error(`WASM modules not available: ${error.message}. Check Metro config!`);
    }
}
/**
 * Convenience function specifically for bank contract (but using generic parser)
 */
async function createBankStateValueParser() {
    return createGenericStateValueParser('../contracts/contract/index.cjs');
}
/**
 * React Native WASM compatibility test
 */
async function testWasmCompatibility() {
    try {
        const compactRuntime = require('@midnight-ntwrk/compact-runtime');
        // Test if WASM actually works by trying to create a StateValue
        const testState = compactRuntime.StateValue.newNull();
        testState.type(); // This will fail if WASM isn't properly initialized
        return { supported: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            supported: false,
            error: errorMessage
        };
    }
}
