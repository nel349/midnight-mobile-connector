console.log('Testing React Native fallback approach...');

async function testReactNativeFallback() {
  try {
    // Import our new parser
    const { createGenericStateValueParser } = require('./lib/genericStateValueParser.ts');
    
    console.log('✅ Parser imported successfully');
    
    // Create the parser (this should use Node.js WASM)
    const parser = await createGenericStateValueParser('../contracts/contract/index.cjs');
    console.log('✅ Parser created');
    
    // Test parsing with dummy data
    const result = await parser('0000000000000000', 'undeployed');
    console.log('✅ Parser execution successful');
    console.log('Result:', result.success);
    
    if (result.success) {
      console.log('📋 Ledger state keys:', Object.keys(result.ledgerState));
    } else {
      console.log('❌ Parsing failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testReactNativeFallback();


