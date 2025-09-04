// Quick test to analyze available signature functions in WASM modules
const { midnightSDK } = require('./modules/wamr-turbomodule/dist/commonjs/index.js');

async function analyzeFunctions() {
  try {
    console.log('🔧 Initializing SDK...');
    await midnightSDK.initialize();
    
    console.log('🔍 Analyzing WASM functions for signature operations...');
    const analysis = await midnightSDK.analyzeWasmForHDCapabilities();
    
    console.log('📋 Signing Functions:', analysis.signingFunctions);
    console.log('🔑 Key Functions:', analysis.keyFunctions);
    console.log('📝 All Functions Count:', analysis.allFunctions.length);
    
    // Look specifically for signData and verifySignature
    const signDataExists = analysis.allFunctions.includes('signData');
    const verifySignatureExists = analysis.allFunctions.includes('verifySignature');
    
    console.log('🔍 signData function exists:', signDataExists);
    console.log('🔍 verifySignature function exists:', verifySignatureExists);
    
    // Search for functions that might be related to signing
    const signRelated = analysis.allFunctions.filter(f => 
      f.toLowerCase().includes('sign') || 
      f.toLowerCase().includes('verify')
    );
    
    console.log('🔍 Sign/Verify related functions:', signRelated);
    
  } catch (error) {
    console.error('❌ Error analyzing functions:', error);
  }
}

analyzeFunctions();