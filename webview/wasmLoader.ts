export const wasmLoaderScript = `
window.loadMidnightWasm = async function(wasmBase64, jsCode) {
    console.log('STEP 1: wasmLoaderScript function called');
    
    try {
        console.log('STEP 2: Inside try block');
        
        if (!jsCode) {
            console.log('STEP 2a: jsCode is null/undefined');
            return { success: false, message: 'jsCode is undefined or null' };
        }
        console.log('STEP 3: jsCode exists, length:', jsCode.length);
        
        if (!wasmBase64) {
            console.log('STEP 3a: wasmBase64 is null/undefined');
            return { success: false, message: 'wasmBase64 is undefined or null' };
        }
        console.log('STEP 4: wasmBase64 exists, length:', wasmBase64.length);
        
        console.log('STEP 5: Starting JS transformation...');
        
        // Transform all export types
        let transformedCode;
        try {
            // Transform export function
            let step1 = jsCode.replace(/export function ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1 = function');
            console.log('STEP 6a: export function transformed');
            
            // Transform export const
            let step2 = step1.replace(/export const ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1');
            console.log('STEP 6b: export const transformed');
            
            // Transform export class
            let step3 = step2.replace(/export class ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1 = class $1');
            console.log('STEP 6c: export class transformed');
            
            transformedCode = step3;
            console.log('STEP 6: All transformations done, new length:', transformedCode.length);
        } catch (transformError) {
            console.log('STEP 6 ERROR: Transform failed:', transformError.message);
            return { success: false, message: 'Transform failed: ' + transformError.message };
        }
        
        console.log('STEP 7: Creating result object...');
        const result = { success: false, message: 'Test not completed' };
        
        console.log('STEP 8: Creating execution environment...');
        try {
            const exports = {};
            console.log('STEP 9: exports object created');
            
            const util = {
                TextEncoder: typeof TextEncoder !== 'undefined' ? TextEncoder : null,
                TextDecoder: typeof TextDecoder !== 'undefined' ? TextDecoder : null
            };
            console.log('STEP 10: util object created');
            
            function require(name) { 
                console.log('STEP 10a: require called for:', name);
                if (name === 'util') return util; 
                return {}; 
            }
            console.log('STEP 11: require function created');
            
            console.log('STEP 12: About to eval transformed code...');
            eval(transformedCode);
            console.log('STEP 13: eval completed, exports keys:', Object.keys(exports).length);
            
            // Now try WASM instantiation
            console.log('STEP 14: Starting WASM instantiation...');
            
            // Decode WASM binary
            const binaryString = atob(wasmBase64);
            const wasmBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                wasmBytes[i] = binaryString.charCodeAt(i);
            }
            console.log('STEP 15: WASM binary decoded, length:', wasmBytes.length);
            
            // Create imports object with proxy to catch missing functions
            const imports = {};
            
            // Create a proxy that logs any missing function calls
            const exportsProxy = new Proxy(exports, {
                get: function(target, prop) {
                    if (prop in target) {
                        return target[prop];
                    } else {
                        console.log('MISSING FUNCTION CALLED:', prop);
                        // Return a stub function that throws with the function name
                        return function(...args) {
                            throw new Error('Missing function: ' + prop + ' (called with ' + args.length + ' args)');
                        };
                    }
                }
            });
            
            imports['./midnight_zswap_wasm_bg.js'] = exportsProxy;
            
            // Add snippet imports
            imports['./snippets/midnight-zswap-wasm-41bcd0561f7a9007/inline0.js'] = {
                UnprovenOffer_: exports.__wbg_unprovenoffer_new || (() => ({})),
                UnprovenInput_: exports.__wbg_unproveninput_new || (() => ({})),
                UnprovenOutput_: exports.__wbg_unprovenoutput_new || (() => ({})),
                UnprovenTransaction_: exports.__wbg_unproventransaction_new || (() => ({})),
                ProofErasedOffer_: exports.__wbg_prooferasedoffer_new || (() => ({})),
                ProofErasedInput_: exports.__wbg_prooferasedinput_new || (() => ({})),
                ProofErasedOutput_: exports.__wbg_prooferasedoutput_new || (() => ({})),
                ProofErasedTransaction_: exports.__wbg_prooferasedtransaction_new || (() => ({})),
                SecretKeys_: exports.SecretKeys || (() => ({})),
                LocalState_: exports.__wbg_localstate_new || (() => ({})),
                ZswapChainState_: exports.__wbg_zswapchainstate_new || (() => ({})),
                LedgerParameters_: exports.__wbg_ledgerparameters_new || (() => ({})),
                AuthorizedMint_: exports.__wbg_authorizedmint_new || (() => ({})),
                CoinSecretKey_: exports.__wbg_coinsecretkey_new || (() => ({})),
                EncryptionSecretKey_: exports.__wbg_encryptionsecretkey_new || (() => ({})),
                UnprovenTransient_: exports.__wbg_unproventransient_new || (() => ({})),
                Offer_: exports.__wbg_offer_new || (() => ({})),
                Input_: exports.__wbg_input_new || (() => ({})),
                Output_: exports.__wbg_output_new || (() => ({})),
                Transaction_: exports.__wbg_transaction_new || (() => ({})),
                ProofErasedTransient_: exports.__wbg_prooferasedtransient_new || (() => ({})),
                SystemTransaction_: exports.__wbg_systemtransaction_new || (() => ({})),
                TransactionCostModel_: exports.__wbg_transactioncostmodel_new || (() => ({})),
                Transient_: exports.__wbg_transient_new || (() => ({})),
                ProofErasedAuthorizedMint_: exports.__wbg_prooferasedauthorizedmint_new || (() => ({}))
            };
            console.log('STEP 16: Imports object created with snippets');
            
            // Try WASM instantiation
            const wasmModule = await WebAssembly.instantiate(wasmBytes.buffer, imports);
            console.log('STEP 17: WASM instantiated successfully!');
            
            // Set up a global error handler to catch missing function errors
            const originalConsoleError = console.error;
            console.error = function(...args) {
                console.log('CAUGHT ERROR:', ...args);
                originalConsoleError.apply(console, args);
            };
            
            // Initialize wasm-bindgen
            if (exports.__wbg_set_wasm) {
                console.log('STEP 18a: About to call __wbg_set_wasm...');
                exports.__wbg_set_wasm(wasmModule.instance.exports);
                console.log('STEP 18b: __wbg_set_wasm called');
                console.log('STEP 18c: exports.wasm exists now?', !!exports.wasm);
                
                // Try to access wasm directly from the global scope
                console.log('STEP 18d: Global wasm exists?', typeof wasm !== 'undefined');
                
                // Manually set exports.wasm if it's not set
                if (!exports.wasm && typeof wasm !== 'undefined') {
                    exports.wasm = wasm;
                    console.log('STEP 18e: Manually set exports.wasm');
                } else if (!exports.wasm) {
                    // If wasm is still not available, set it directly
                    exports.wasm = wasmModule.instance.exports;
                    console.log('STEP 18f: Set exports.wasm to wasmModule.instance.exports');
                }
                
                // CRITICAL: Also set up global wasm variable for the glue code
                console.log('STEP 18f.1: Setting up global wasm variable...');
                if (typeof window !== 'undefined') {
                    window.wasm = wasmModule.instance.exports;
                    console.log('STEP 18f.2: Set window.wasm for browser');
                } else if (typeof global !== 'undefined') {
                    global.wasm = wasmModule.instance.exports;
                    console.log('STEP 18f.3: Set global.wasm for node');
                } else {
                    // Use eval to set global wasm - works in most contexts
                    eval('wasm = wasmModule.instance.exports');
                    console.log('STEP 18f.4: Set wasm via eval');
                }
                
                console.log('STEP 18g: Final exports.wasm status:', !!exports.wasm);
                const allExports = Object.keys(wasmModule.instance.exports);
                console.log('STEP 18h: wasmModule.instance.exports count:', allExports.length);
                console.log('STEP 18i: Looking for secret-related exports:', allExports.filter(k => k.toLowerCase().includes('secret')));
                console.log('STEP 18: wasm-bindgen initialized');
            } else {
                console.log('STEP 18: WARNING - __wbg_set_wasm not found');
            }
            
            // Test SecretKeys.fromSeed
            console.log('STEP 19: Testing SecretKeys.fromSeed...');
            console.log('STEP 19a: exports.SecretKeys exists?', !!exports.SecretKeys);
            console.log('STEP 19b: exports.SecretKeys type:', typeof exports.SecretKeys);
            
            if (exports.SecretKeys) {
                console.log('STEP 19c: SecretKeys.fromSeed exists?', !!exports.SecretKeys.fromSeed);
                console.log('STEP 19d: SecretKeys.fromSeed type:', typeof exports.SecretKeys.fromSeed);
                
                if (exports.SecretKeys.fromSeed) {
                    // FIRST: Try the constructor without seed - this might work!
                    console.log('STEP 20c: Trying SecretKeys constructor (no seed)...');
                    try {
                        const secretKeys = new exports.SecretKeys();
                        console.log('STEP 20c SUCCESS: ✅ SecretKeys constructor worked!', typeof secretKeys);
                        console.log('STEP 20c SUCCESS: secretKeys has __wbg_ptr?', !!secretKeys.__wbg_ptr);
                        result.success = true;
                        result.message = '🎉 SUCCESS! SecretKeys constructor works - wallet building ready!';
                        return result;
                    } catch (constructorError) {
                        console.log('STEP 20c ERROR: SecretKeys constructor failed:', constructorError);
                    }
                    
                    // Generate proper entropy - Common patterns for crypto seeds
                    const cryptoSeed32 = new Uint8Array(32);
                    const cryptoSeed64 = new Uint8Array(64);  // Some systems use 64 bytes (512 bits)
                    
                    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                        crypto.getRandomValues(cryptoSeed32);
                        crypto.getRandomValues(cryptoSeed64);
                    } else {
                        // Fallback: use Math.random for testing
                        for (let i = 0; i < 32; i++) {
                            cryptoSeed32[i] = Math.floor(Math.random() * 256);
                        }
                        for (let i = 0; i < 64; i++) {
                            cryptoSeed64[i] = Math.floor(Math.random() * 256);
                        }
                    }
                    
                    // Test known entropy patterns that work with many crypto libraries
                    const seedFormats = [
                        cryptoSeed32,  // 32 bytes crypto random
                        cryptoSeed64,  // 64 bytes crypto random  
                        new Uint8Array(32).fill(1),  // All ones (sometimes works as test seed)
                        // BIP39-style: 128 bits entropy (16 bytes) padded to 32
                        new Uint8Array([...new Uint8Array(16).map(() => Math.floor(Math.random() * 256)), ...new Array(16).fill(0)]),
                    ];
                    
                    for (let i = 0; i < seedFormats.length; i++) {
                        const testSeed = seedFormats[i];
                        console.log('STEP 20a.' + i + ': Trying seed format', i + ':', typeof testSeed, testSeed instanceof Uint8Array ? 'Uint8Array[' + testSeed.length + ']' : testSeed.toString().substring(0, 16) + '...');
                        
                                                try {
                            const wasmResult = exports.wasm.secretkeys_fromSeed(testSeed);
                            console.log('STEP 20a.' + i + 'r: WASM result:', wasmResult);

                            if (wasmResult[2] === 0) {  // Success!
                                console.log('STEP 20a.' + i + 's: 🎉 SUCCESS! This seed format works!');
                                
                                // Now test the full SecretKeys.fromSeed()
                                try {
                                    const secretKeys = exports.SecretKeys.fromSeed(testSeed);
                                    console.log('STEP 20SUCCESS: ✅ SecretKeys.fromSeed() succeeded!', typeof secretKeys);
                                    console.log('STEP 20SUCCESS: secretKeys has __wbg_ptr?', !!secretKeys.__wbg_ptr);
                                    result.success = true;
                                    result.message = '🎉 SUCCESS! SecretKeys.fromSeed() works - wallet building ready!';
                                    return result;
                                } catch (secretError) {
                                    console.log('STEP 20ERROR: SecretKeys.fromSeed failed despite WASM success:', secretError);
                                }
                                break;
                            }
                        } catch (err) {
                            console.log('STEP 20a.' + i + 'e: Error with this format:', err);
                        }
                    }
                    
                    const testSeed = seedFormats[0];  // Start with simple string
                    
                    try {
                        console.log('STEP 20a1: Checking wasm object...');
                        console.log('STEP 20a2: wasm exists?', !!exports.wasm);
                        console.log('STEP 20a3: wasm.secretkeys_fromSeed exists?', exports.wasm && !!exports.wasm.secretkeys_fromSeed);
                        
                        // Debug what memory management functions are available
                        if (exports.wasm) {
                            console.log('STEP 20a3.1: wasm.__wbindgen_malloc exists?', typeof exports.wasm.__wbindgen_malloc === 'function');
                            console.log('STEP 20a3.2: wasm.__wbindgen_free exists?', typeof exports.wasm.__wbindgen_free === 'function');
                            console.log('STEP 20a3.3: wasm.__wbindgen_realloc exists?', typeof exports.wasm.__wbindgen_realloc === 'function');
                            
                            // List all wasm exports that contain 'malloc' or 'free'
                            const wasmKeys = Object.keys(exports.wasm).filter(key => key.includes('malloc') || key.includes('free') || key.includes('alloc'));
                            console.log('STEP 20a3.4: Memory-related WASM exports:', wasmKeys);
                            
                            // Also check for memory property
                            console.log('STEP 20a3.5: wasm.memory exists?', !!exports.wasm.memory);
                            if (exports.wasm.memory) {
                                console.log('STEP 20a3.6: wasm.memory.buffer size:', exports.wasm.memory.buffer.byteLength);
                            }
                            
                            // Test calling malloc directly
                            try {
                                console.log('STEP 20a3.7: Testing direct malloc call...');
                                const testPtr = exports.wasm.__wbindgen_malloc(32);
                                console.log('STEP 20a3.8: Direct malloc SUCCESS! ptr:', testPtr);
                                exports.wasm.__wbindgen_free(testPtr, 32);
                                console.log('STEP 20a3.9: Direct free SUCCESS!');
                            } catch (mallocError) {
                                console.log('STEP 20a3.8: Direct malloc FAILED:', mallocError);
                                console.log('STEP 20a3.9: malloc error type:', typeof mallocError);
                                console.log('STEP 20a3.10: malloc error message:', mallocError.message);
                            }
                        }
                        
                        if (exports.wasm && exports.wasm.secretkeys_fromSeed) {
                            console.log('STEP 20a4: Testing wasm.secretkeys_fromSeed directly...');
                            try {
                                // Convert testSeed to Uint8Array if it isn't already
                                let seedBytes;
                                if (testSeed instanceof Uint8Array) {
                                    seedBytes = testSeed;
                                } else if (typeof testSeed === 'string') {
                                    seedBytes = new TextEncoder().encode(testSeed);
                                } else {
                                    seedBytes = new Uint8Array(testSeed);
                                }
                                
                                console.log('STEP 20a4.1: Seed bytes length:', seedBytes.length);
                                console.log('STEP 20a4.2: Seed bytes type:', seedBytes.constructor.name);
                                
                                // Ensure we have exactly 32 bytes
                                if (seedBytes.length !== 32) {
                                    console.log('STEP 20a4.2.1: Seed not 32 bytes, padding/truncating...');
                                    const properSeed = new Uint8Array(32);
                                    properSeed.set(seedBytes.slice(0, 32)); // Copy up to 32 bytes
                                    seedBytes = properSeed;
                                    console.log('STEP 20a4.2.2: Seed now has length:', seedBytes.length);
                                }
                                
                                // WASM function expects (ptr, len) - need to allocate memory first
                                console.log('STEP 20a4.2.5: About to call exports.wasm.__wbindgen_malloc');
                                console.log('STEP 20a4.2.6: exports.wasm is:', typeof exports.wasm);
                                console.log('STEP 20a4.2.7: exports.wasm.__wbindgen_malloc is:', typeof exports.wasm.__wbindgen_malloc);
                                const ptr = exports.wasm.__wbindgen_malloc(seedBytes.length);
                                console.log('STEP 20a4.3: Allocated ptr:', ptr);
                                
                                // Copy seed data to WASM memory
                                const memory = new Uint8Array(exports.wasm.memory.buffer);
                                memory.set(seedBytes, ptr);
                                console.log('STEP 20a4.4: Copied seed to WASM memory');
                                
                                // Call with (ptr, len) format
                                const wasmResult = exports.wasm.secretkeys_fromSeed(ptr, seedBytes.length);
                                console.log('STEP 20a4.5: Called secretkeys_fromSeed with ptr/len format');
                                
                                // Free the allocated memory
                                exports.wasm.__wbindgen_free(ptr, seedBytes.length);
                                console.log('STEP 20a5: wasm.secretkeys_fromSeed returned:', wasmResult);
                                console.log('STEP 20a6: wasm result type:', typeof wasmResult);
                                console.log('STEP 20a7: wasm result is array?', Array.isArray(wasmResult));
                                if (Array.isArray(wasmResult)) {
                                    console.log('STEP 20a8: wasm result length:', wasmResult.length);
                                    console.log('STEP 20a9: wasm result[0]:', wasmResult[0]);
                                    console.log('STEP 20a10: wasm result[1]:', wasmResult[1]);
                                    console.log('STEP 20a11: wasm result[2]:', wasmResult[2]);
                                    
                                    // Check what's at the error index
                                    if (wasmResult[2] === 1) {
                                        console.log('STEP 20a12: Error detected! Checking heap[' + wasmResult[1] + ']');
                                        if (exports.getObject_exported) {
                                            const errorObj = exports.getObject_exported(wasmResult[1]);
                                            console.log('STEP 20a13: getObject_exported(' + wasmResult[1] + ') returned:', errorObj);
                                            console.log('STEP 20a14: Error object type:', typeof errorObj);
                                            console.log('STEP 20a15: Error object is:', errorObj);
                                            if (errorObj && errorObj.message) {
                                                console.log('STEP 20a16: Error message:', errorObj.message);
                                            }
                                            
                                            // Debug heap state
                                            console.log('STEP 20a17: Checking heap around index 132...');
                                            for (let i = 130; i <= 135; i++) {
                                                const obj = exports.getObject_exported(i);
                                                console.log('STEP 20a18: heap[' + i + '] =', obj, typeof obj);
                                            }
                                            
                                            // Test takeObject_debug
                                            if (exports.takeObject_debug) {
                                                console.log('STEP 20a19: Testing takeObject_debug(132)...');
                                                const takeResult = exports.takeObject_debug(132);
                                                console.log('STEP 20a20: takeObject_debug returned:', takeResult);
                                            }
                                            
                                                                        // Also test takeFromExternrefTable0_exported with the correct heap index
                            if (exports.takeFromExternrefTable0_exported) {
                                console.log('STEP 20a21: Testing takeFromExternrefTable0_exported(132)...');
                                try {
                                    const result21 = exports.takeFromExternrefTable0_exported(132);
                                    console.log('STEP 20a22: takeFromExternrefTable0_exported(132) returned:', result21);
                                } catch (err) {
                                    console.log('STEP 20a22: takeFromExternrefTable0_exported(132) error:', err);
                                }
                            }
                                        } else {
                                            console.log('STEP 20a13: getObject_exported function not available');
                                        }
                                    }
                                }
                            } catch (wasmError) {
                                console.log('STEP 20a ERROR: wasm.secretkeys_fromSeed failed:', wasmError);
                            }
                        }
                        
                        console.log('STEP 20b: Now calling SecretKeys.fromSeed...');
                        const secretKeys = exports.SecretKeys.fromSeed(testSeed);
                        console.log('STEP 20c: SecretKeys.fromSeed returned:', typeof secretKeys);
                        console.log('STEP 20d: SecretKeys result is truthy?', !!secretKeys);
                        
                        result.success = true;
                        result.message = '🎉 SUCCESS! SecretKeys.fromSeed() works - wallet building ready!';
                    } catch (keyError) {
                        console.log('STEP 20 ERROR: SecretKeys.fromSeed threw:', keyError);
                        console.log('STEP 20 ERROR: keyError type:', typeof keyError);
                        console.log('STEP 20 ERROR: keyError constructor:', keyError ? keyError.constructor : 'no constructor');
                        console.log('STEP 20 ERROR: keyError message:', keyError ? keyError.message : 'no message');
                        console.log('STEP 20 ERROR: keyError toString:', keyError ? keyError.toString() : 'no toString');
                        console.log('STEP 20 ERROR: keyError name:', keyError ? keyError.name : 'no name');
                        
                        // Check if it's a WASM RuntimeError or similar
                        if (keyError instanceof WebAssembly.RuntimeError) {
                            console.log('STEP 20 ERROR: This is a WebAssembly.RuntimeError');
                        }
                        
                        result.message = '❌ SecretKeys.fromSeed failed: ' + (keyError && keyError.message ? keyError.message : keyError ? String(keyError) : 'Unknown SecretKeys error');
                    }
                } else {
                    result.message = '❌ SecretKeys.fromSeed method not found';
                }
            } else {
                result.message = '❌ SecretKeys class not found in exports';
            }
            
        } catch (evalError) {
            console.log('STEP ERROR: Inner catch:', evalError);
            console.log('STEP ERROR: Inner catch message:', evalError ? evalError.message : 'No message');
            result.message = 'INNER ERROR: ' + (evalError && evalError.message ? evalError.message : evalError ? evalError.toString() : 'Unknown error');
        }
        
        console.log('STEP 14: Returning result:', result.message);
        return result;
        
    } catch (outerError) {
        console.log('STEP ERROR: Outer catch:', outerError);
        console.log('STEP ERROR: Outer catch type:', typeof outerError);
        return { success: false, message: 'Outer error: ' + (outerError && outerError.message ? outerError.message : outerError ? outerError.toString() : 'Unknown error') };
    }
};

console.log('wasmLoaderScript template compiled and ready');`;