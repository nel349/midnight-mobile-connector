console.log('Testing fake StateValue creation...');

try {
  const compactRuntime = require('@midnight-ntwrk/compact-runtime');
  console.log('✅ Compact runtime loaded in Node.js');
  
  // Get the StateValue class
  const StateValue = compactRuntime.StateValue;
  console.log('StateValue class:', StateValue);
  
  // Create a fake StateValue that might pass instanceof checks
  const fakeStateValue = Object.create(StateValue.prototype);
  fakeStateValue.__wbg_ptr = 12345; // Fake pointer
  
  // Add required methods
  fakeStateValue.type = function() { return 'null'; };
  fakeStateValue.free = function() { /* no-op */ };
  fakeStateValue.toString = function() { return 'FakeStateValue(null)'; };
  
  console.log('✅ Fake StateValue created');
  console.log('instanceof StateValue:', fakeStateValue instanceof StateValue);
  console.log('type():', fakeStateValue.type());
  
  // Test if this passes the _assertClass check by trying to use it
  console.log('\n=== Testing fake StateValue with contract ===');
  try {
    const contract = require('./contracts/contract/index.cjs');
    const ledgerResult = contract.ledger(fakeStateValue);
    console.log('🎉 SUCCESS! Fake StateValue worked with ledger!');
    console.log('Ledger result keys:', Object.keys(ledgerResult));
  } catch (e) {
    console.log('❌ Fake StateValue failed with ledger:', e.message);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

