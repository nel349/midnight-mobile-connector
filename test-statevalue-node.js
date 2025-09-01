console.log('Testing StateValue creation in Node.js...');

try {
  const compactRuntime = require('@midnight-ntwrk/compact-runtime');
  console.log('✅ Compact runtime loaded');
  
  // Test StateValue.newNull()
  console.log('\n=== Creating StateValue.newNull() ===');
  const nullState = compactRuntime.StateValue.newNull();
  console.log('✅ StateValue.newNull() created');
  console.log('Type:', nullState.type());
  console.log('Constructor:', nullState.constructor.name);
  console.log('Prototype:', Object.getPrototypeOf(nullState));
  
  // Test ContractState
  console.log('\n=== Creating ContractState ===');
  const contractState = new compactRuntime.ContractState();
  console.log('✅ ContractState created');
  console.log('ContractState.data type:', contractState.data.type());
  
  // Test QueryContext
  console.log('\n=== Creating QueryContext ===');
  const queryContext = new compactRuntime.QueryContext(contractState.data, compactRuntime.dummyContractAddress());
  console.log('✅ QueryContext created');
  
  // Test calling ledger with proper StateValue
  console.log('\n=== Testing ledger function ===');
  const contract = require('./contracts/contract/index.cjs');
  const ledgerResult = contract.ledger(contractState.data);
  console.log('✅ Ledger function succeeded!');
  console.log('Ledger result keys:', Object.keys(ledgerResult));
  
  // Let's examine the StateValue object structure
  console.log('\n=== Examining StateValue structure ===');
  console.log('StateValue properties:', Object.getOwnPropertyNames(nullState));
  console.log('StateValue __wbg_ptr:', nullState.__wbg_ptr);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}


