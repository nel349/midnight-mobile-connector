/**
 * Test Indexer Connection
 * 
 * Test script to validate Phase 2: Indexer Connection
 * Tests ViewingKey derivation and connect mutation
 */

import { deriveViewingKeyFromSeed } from './viewingKeyDerivation';
import { createTestnetIndexerConnection } from './indexerConnection';

/**
 * Test the complete indexer connection flow
 */
export async function testCompleteIndexerConnection(): Promise<void> {
  console.log('🧪 Testing complete indexer connection flow...');
  console.log('');

  try {
    // Phase 1: Test ViewingKey derivation
    console.log('📋 Phase 1: ViewingKey Derivation');
    console.log('=====================================');
    
    // Use the genesis mint wallet seed for testing
    const testSeed = '0000000000000000000000000000000000000000000000000000000000000001';
    console.log(`🔑 Test seed: ${testSeed}`);
    
    const viewingKeys = await deriveViewingKeyFromSeed(testSeed);
    console.log(`✅ Derived ${viewingKeys.length} ViewingKey candidates`);
    
    // Display viewing key candidates
    for (let i = 0; i < viewingKeys.length; i++) {
      const vk = viewingKeys[i];
      console.log(`   Candidate ${i + 1}:`);
      console.log(`     Network: ${vk.network}`);
      console.log(`     Bech32m: ${vk.bech32m.substring(0, 50)}...`);
      console.log(`     Hex: ${vk.hex.substring(0, 40)}...`);
      console.log(`     Bytes: ${vk.bytes.length} bytes`);
    }
    
    console.log('');
    
    // Phase 2: Test Indexer Connection
    console.log('📋 Phase 2: Indexer Connection');
    console.log('================================');
    
    const indexer = createTestnetIndexerConnection();
    console.log('✅ Created testnet indexer connection');
    
    // Try connecting with viewing key candidates
    console.log('🔌 Attempting connection with ViewingKey candidates...');
    
    try {
      const sessionId = await indexer.connectWithCandidates(viewingKeys);
      console.log('✅ Successfully connected to indexer!');
      console.log(`   Session ID: ${sessionId}`);
      
      // Test session info
      const session = indexer.getSession();
      if (session) {
        console.log(`   Connected at: ${session.connectedAt.toISOString()}`);
        console.log(`   Using ViewingKey: ${session.viewingKey.bech32m.substring(0, 40)}...`);
      }
      
      // Test disconnection
      console.log('🔌 Testing disconnection...');
      await indexer.disconnect();
      console.log('✅ Successfully disconnected');
      
      console.log('');
      console.log('🎉 Phase 2 Complete: Indexer Connection Working!');
      console.log('');
      console.log('📋 Next Steps:');
      console.log('   • Phase 3: Subscribe to shieldedTransactions');
      console.log('   • Phase 4: Calculate balance from decrypted UTXOs');
      console.log('   • Phase 5: Display real 1000 tDUST balance');
      
    } catch (connectionError) {
      console.error('❌ Indexer connection test failed:');
      console.error('   Error:', connectionError instanceof Error ? connectionError.message : connectionError);
      console.log('');
      console.log('🔍 Debugging Information:');
      console.log('   • ViewingKey format may need adjustment');
      console.log('   • Check if testnet indexer is accessible');
      console.log('   • Verify Bech32m encoding matches expected format');
      console.log('   • May need to investigate actual ViewingKey derivation method');
      
      throw connectionError;
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ Complete indexer connection test failed:', error);
    throw error;
  }
}

/**
 * Test just the ViewingKey derivation (Phase 1 only)
 */
export async function testViewingKeyDerivation(): Promise<void> {
  console.log('🧪 Testing ViewingKey derivation only...');
  
  try {
    const testSeed = '0000000000000000000000000000000000000000000000000000000000000001';
    const viewingKeys = await deriveViewingKeyFromSeed(testSeed);
    
    console.log('✅ ViewingKey derivation test passed');
    console.log(`   Generated ${viewingKeys.length} candidates`);
    
    for (const vk of viewingKeys) {
      console.log(`   • ${vk.network}: ${vk.bech32m.substring(0, 60)}...`);
      
      // Validate format
      const expectedPrefix = `mn_shield-esk_${vk.network}1`;
      if (vk.bech32m.startsWith(expectedPrefix)) {
        console.log(`     ✅ Format valid: starts with ${expectedPrefix}`);
      } else {
        console.log(`     ❌ Format invalid: expected ${expectedPrefix}`);
      }
    }
    
  } catch (error) {
    console.error('❌ ViewingKey derivation test failed:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
export async function runAllIndexerTests(): Promise<void> {
  console.log('🚀 Running All Indexer Connection Tests');
  console.log('==========================================');
  console.log('');
  
  try {
    // Test 1: ViewingKey derivation only
    await testViewingKeyDerivation();
    console.log('');
    
    // Test 2: Complete flow including connection
    await testCompleteIndexerConnection();
    
    console.log('');
    console.log('🎉 All tests passed! Phase 2 implementation is working.');
    
  } catch (error) {
    console.error('');
    console.error('❌ Test suite failed. Phase 2 needs debugging.');
    console.error('Error:', error);
  }
}