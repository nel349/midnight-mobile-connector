export const wasmLoaderScript = `
window.loadMidnightWasm = async function(wasmBase64, jsCode) {
    try {
        console.log('🎯 FOCUS: Testing ONLY zswap SecretKeys.fromSeed()');
        
        if (!jsCode) {
            return { success: false, message: 'jsCode is undefined or null' };
        }
        
        console.log('Zswap JS glue code first 200 chars:', jsCode.substring(0, 200));
        
        // Transform JS code (ES6 to CommonJS)
        let step1 = jsCode.replace(/export function ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1 = function');
        let step2 = step1.replace(/export const ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1');
        let step3 = step2.replace(/export let ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1');
        let step4 = step3.replace(/export var ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1');
        let step5 = step4.replace(/export class ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1 = class $1');
        const transformedCode = step5;
        
        console.log('✅ JS code transformed, length:', transformedCode.length);
        
        // Handle module.require patterns 
        const moduleCode = transformedCode.replace(/\\\\(0, module\\\\.require\\\\)\\\\('util'\\\\)/g, 'util').replace(/\\\\(0, module\\\\.require\\\\)\\\\("util"\\\\)/g, 'util');
        console.log('✅ Module require patterns replaced');
        
        console.log('Code ready for execution');
        
        const result = new Object();
        result.success = true;
        
        // Test executing the transformed glue code
        try {
            // Create execution environment
            const exports = new Object();
            const util = new Object();
            util.TextEncoder = TextEncoder;
            util.TextDecoder = TextDecoder;
            function require(name) { 
                if (name === 'util') return util; 
                return new Object(); 
            }
            
            // Execute the transformed glue code
            eval(moduleCode);
            console.log('✅ Glue code executed, exports:', Object.keys(exports).length);
            
            // Decode and instantiate WASM
            const binaryString = atob(wasmBase64);
            const wasmBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                wasmBytes[i] = binaryString.charCodeAt(i);
            }
            
            const imports = new Object();
            imports['./midnight_zswap_wasm_bg.js'] = exports;
            
            // Re-adding snippet imports with object structures as required
            imports['./snippets/midnight-zswap-wasm-41bcd0561f7a9007/inline0.js'] = {
                UnprovenOffer_: exports.__wbg_unprovenoffer_new,
                UnprovenInput_: exports.__wbg_unproveninput_new,
                UnprovenOutput_: exports.__wbg_unprovenoutput_new,
                UnprovenTransaction_: exports.__wbg_unproventransaction_new,
                ProofErasedOffer_: exports.__wbg_prooferasedoffer_new,
                ProofErasedInput_: exports.__wbg_prooferasedinput_new,
                ProofErasedOutput_: exports.__wbg_prooferasedoutput_new,
                ProofErasedTransaction_: exports.__wbg_prooferasedtransaction_new,
                SecretKeys_: exports.SecretKeys, // Maps directly to the class
                LocalState_: exports.__wbg_localstate_new,
                ZswapChainState_: exports.__wbg_zswapchainstate_new,
                LedgerParameters_: exports.__wbg_ledgerparameters_new,
                AuthorizedMint_: exports.__wbg_authorizedmint_new,
                CoinSecretKey_: exports.__wbg_coinsecretkey_new,
                EncryptionSecretKey_: exports.__wbg_encryptionsecretkey_new,
                UnprovenTransient_: exports.__wbg_unproventransient_new,
                Offer_: exports.__wbg_offer_new,
                Input_: exports.__wbg_input_new,
                Output_: exports.__wbg_output_new,
                Transaction_: exports.__wbg_transaction_new,
                ProofErasedTransient_: exports.__wbg_prooferasedtransient_new,
                SystemTransaction_: exports.__wbg_systemtransaction_new,
                TransactionCostModel_: exports.__wbg_transactioncostmodel_new,
                Transient_: exports.__wbg_transient_new,
                ProofErasedAuthorizedMint_: exports.__wbg_prooferasedauthorizedmint_new
            };
            
            const wasmModule = await WebAssembly.instantiate(wasmBytes.buffer, imports);
            
            // Initialize wasm-bindgen
            if (exports.__wbg_set_wasm) {
                exports.__wbg_set_wasm(wasmModule.instance.exports);
            }
            
            console.log('WASM loaded, testing SecretKeys.fromSeed...');
            
            // STEP 1: Test SecretKeys.fromSeed - THE CORE FUNCTION WE NEED
            try {
                if (exports.SecretKeys && exports.SecretKeys.fromSeed) {
                    const testSeed = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
                    const secretKeys = exports.SecretKeys.fromSeed(testSeed);
                    console.log('SecretKeys generated from seed:', typeof secretKeys, secretKeys ? 'SUCCESS' : 'FAILED');
                    
                    result.message = '🎉 SUCCESS! SecretKeys.fromSeed() works - wallet building ready!';
                } else {
                    result.message = '❌ SecretKeys.fromSeed not found';
                }
                
            } catch (keyError) {
                console.log('DEBUG: keyError object:', keyError);
                console.log('DEBUG: keyError.name:', keyError ? keyError.name : 'N/A');
                result.message = '❌ SecretKeys.fromSeed failed: ' + (keyError && keyError.message ? keyError.message : 'Unknown error');
            }
        } catch (evalError) {
            // Find remaining export statements
            const remainingExports = transformedCode.match(/export [^;]*/g);
            const exportInfo = remainingExports ? ' | Remaining exports: ' + remainingExports.slice(0, 3).join('; ') : ' | No remaining exports found';
            result.message = 'EVAL ERROR: ' + evalError.message + exportInfo;
        }
        return result;
        
    } catch (error) {
        console.error('❌ WASM loading failed:', error);
        const errorResult = new Object();
        errorResult.success = false;
        errorResult.message = 'WASM loading failed: ' + error.message;
        return errorResult;
    }
};`;