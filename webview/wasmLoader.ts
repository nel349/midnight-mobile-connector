export const wasmLoaderScript = `
window.loadMidnightWasm = async function(wasmBase64, jsCode) {
    try {
        console.log('🔧 Starting WASM processing...');
        
        // Step 1: Basic transformations - test each step
        console.log('Original code first 200 chars:', jsCode.substring(0, 200));
        
        // Replace all export statements more systematically
        let step1 = jsCode.replace(/export function ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1 = function');
        let step2 = step1.replace(/export const ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1');
        let step3 = step2.replace(/export let ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1');
        let step4 = step3.replace(/export var ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1');
        let step5 = step4.replace(/export class ([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'exports.$1 = class $1');
        const transformedJsCode = step5;
        
        console.log('After all transformations:', transformedJsCode.substring(0, 200));
        
        console.log('✅ JS code transformed, length:', transformedJsCode.length);
        
        // Step 2: Handle module.require patterns
        const moduleExports = new Object();
        const moduleCode = transformedJsCode.replace(/\\\\(0, module\\\\.require\\\\)\\\\('util'\\\\)/g, 'util').replace(/\\\\(0, module\\\\.require\\\\)\\\\("util"\\\\)/g, 'util');
        console.log('Transformed code first 200 chars:', transformedJsCode.substring(0, 200));
        console.log('Module code first 200 chars:', moduleCode.substring(0, 200));
        console.log('✅ Module require patterns replaced');
        
        // Step 3: Examine the transformed glue code 
        console.log('✅ Examining transformed glue code...');
        console.log('First 500 characters of transformed code:');
        console.log(moduleCode.substring(0, 500));
        console.log('---');
        console.log('Characters around position 500-600:');
        console.log(moduleCode.substring(500, 600));
        console.log('---');
        
        // Look for problematic characters
        const firstBrace = moduleCode.indexOf('{');
        console.log('First { character at position:', firstBrace);
        if (firstBrace >= 0) {
            console.log('Context around first brace:', moduleCode.substring(Math.max(0, firstBrace-50), firstBrace+50));
        }
        
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
            
            // Step 4: Decode and instantiate WASM
            const binaryString = atob(wasmBase64);
            const wasmBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                wasmBytes[i] = binaryString.charCodeAt(i);
            }
            
            const imports = new Object();
            imports['./midnight_onchain_runtime_wasm_bg.js'] = exports;
            const wasmModule = await WebAssembly.instantiate(wasmBytes.buffer, imports);
            
            // Initialize wasm-bindgen
            if (exports.__wbg_set_wasm) {
                exports.__wbg_set_wasm(wasmModule.instance.exports);
            }
            
            const wasmExportCount = Object.keys(wasmModule.instance.exports).length;
            const jsExportCount = Object.keys(exports).length;
            
            // Test key generation functions
            const availableFunctions = Object.keys(exports).filter(name => 
                name.includes('key') || name.includes('Key') || name.includes('generate') || name.includes('wallet')
            );
            
            console.log('Available key-related functions:', availableFunctions);
            
            // Test key generation with available functions
            try {
                console.log('Testing sampleSigningKey generation...');
                
                if (exports.sampleSigningKey) {
                    const signingKey = exports.sampleSigningKey();
                    console.log('Signing key generated:', typeof signingKey, signingKey ? 'SUCCESS' : 'FAILED');
                    
                    if (exports.signatureVerifyingKey && signingKey) {
                        const verifyingKey = exports.signatureVerifyingKey(signingKey);
                        console.log('Verifying key generated:', typeof verifyingKey, verifyingKey ? 'SUCCESS' : 'FAILED');
                        
                        result.message = '🎉 KEY GENERATION SUCCESS! Generated signing + verifying keys using current WASM functions.';
                    } else {
                        result.message = '🎉 Signing key generated but verifying key failed. Need to test key pairs separately.';
                    }
                } else {
                    result.message = '🎉 sampleSigningKey not available. Available: encodeCoinPublicKey, decodeCoinPublicKey, etc.';
                }
                
            } catch (keyError) {
                console.error('Key generation test error:', keyError);
                result.message = '🎉 Key generation test failed: ' + keyError.message;
            }
        } catch (evalError) {
            // Find remaining export statements
            const remainingExports = transformedJsCode.match(/export [^;]*/g);
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