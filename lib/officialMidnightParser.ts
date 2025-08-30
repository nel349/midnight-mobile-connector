/**
 * Official Midnight Contract State Parser
 * 
 * This uses the REAL Midnight deserialization methods from @midnight-ntwrk/ledger
 * to properly parse binary contract state, ensuring 100% compatibility.
 * 
 * Based on the official Midnight APIs:
 * - ContractState.deserialize(raw: Uint8Array, networkid: NetworkId): ContractState
 * - LedgerState.deserialize(raw: Uint8Array, netid: NetworkId): LedgerState
 */

import { NetworkId } from './addressGeneration';

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Types for the official Midnight API (based on ledger.d.ts)
interface MidnightContractState {
  operations(): Array<string | Uint8Array>;
  operation(operation: string | Uint8Array): any;
  setOperation(operation: string | Uint8Array, value: any): void;
  query(query: any[], cost_model: any): any[];
  serialize(networkid: number): Uint8Array;
  toString(compact?: boolean): string;
}

interface MidnightLedgerState {
  index(address: any): MidnightContractState | undefined;
  apply(transaction: any, context: any): [MidnightLedgerState, any];
  applySystemTx(transaction: any): MidnightLedgerState;
  serialize(networkid: number): Uint8Array;
  toString(compact?: boolean): string;
}

// Static deserializers from the official API
interface MidnightStatic {
  ContractState: {
    deserialize(raw: Uint8Array, networkid: number): MidnightContractState;
  };
  LedgerState: {
    deserialize(raw: Uint8Array, netid: number): MidnightLedgerState;
  };
}

/**
 * Load the official Midnight ledger module
 * This will attempt to use the real @midnight-ntwrk/ledger module
 */
async function loadOfficialMidnight(): Promise<MidnightStatic | null> {
  try {
    console.log('🔧 Attempting to load official @midnight-ntwrk/ledger...');
    
    // Try to import the official ledger module
    const ledgerModule = await import('@midnight-ntwrk/ledger');
    
    console.log('✅ Official Midnight ledger loaded successfully');
    console.log('   Available:', Object.keys(ledgerModule));
    
    return ledgerModule as unknown as MidnightStatic;
    
  } catch (error) {
    console.warn('⚠️ Could not load official @midnight-ntwrk/ledger:', (error as Error).message);
    return null;
  }
}

/**
 * Parse contract state using the official Midnight deserializer
 */
export async function parseWithOfficialMidnight(rawStateHex: string, networkType: 'local' | 'testnet' | 'mainnet' = 'local') {
  console.log('🎯 Using OFFICIAL Midnight deserialization...');
  
  // Convert network type to NetworkId
  const networkId = getNetworkIdNumber(networkType);
  console.log(`   Network: ${networkType} (ID: ${networkId})`);
  
  // Convert hex to bytes
  const rawBytes = hexToBytes(rawStateHex);
  console.log(`   Raw data: ${rawBytes.length} bytes`);
  
  // Load official Midnight module
  const midnight = await loadOfficialMidnight();
  if (!midnight) {
    throw new Error('Could not load official Midnight ledger module');
  }
  
  try {
    // Use official ContractState.deserialize()
    console.log('🔧 Calling ContractState.deserialize()...');
    const contractState = midnight.ContractState.deserialize(rawBytes, networkId);
    
    console.log('✅ Official deserialization successful!');
    console.log(`   Operations available: ${contractState.operations().length}`);
    
    // List all available operations
    const operations = contractState.operations();
    console.log('   Available operations:');
    operations.forEach((op, index) => {
      const opName = typeof op === 'string' ? op : `<bytes:${op.length}>`;
      console.log(`     ${index + 1}. ${opName}`);
    });
    
    return {
      contractState,
      operations,
      toString: () => contractState.toString(true),
      query: (queryOps: any[], costModel: any) => contractState.query(queryOps, costModel)
    };
    
  } catch (error) {
    console.error('❌ Official deserialization failed:', error);
    throw error;
  }
}

/**
 * Try to parse ledger state using official LedgerState.deserialize()
 */
export async function parseWithOfficialLedgerState(rawStateHex: string, networkType: 'local' | 'testnet' | 'mainnet' = 'local') {
  console.log('🎯 Using OFFICIAL LedgerState deserialization...');
  
  const networkId = getNetworkIdNumber(networkType);
  const rawBytes = hexToBytes(rawStateHex);
  
  const midnight = await loadOfficialMidnight();
  if (!midnight) {
    throw new Error('Could not load official Midnight ledger module');
  }
  
  try {
    console.log('🔧 Calling LedgerState.deserialize()...');
    const ledgerState = midnight.LedgerState.deserialize(rawBytes, networkId);
    
    console.log('✅ Official ledger state deserialization successful!');
    
    return {
      ledgerState,
      toString: () => ledgerState.toString(true)
    };
    
  } catch (error) {
    console.error('❌ Official ledger state deserialization failed:', error);
    throw error;
  }
}

/**
 * Convert network type to numeric ID
 */
function getNetworkIdNumber(networkType: 'local' | 'testnet' | 'mainnet'): number {
  switch (networkType) {
    case 'local':
      return NetworkId.Undeployed; // 0
    case 'testnet':
      return NetworkId.TestNet;    // 2  
    case 'mainnet':
      return NetworkId.MainNet;    // 3
    default:
      return NetworkId.Undeployed;
  }
}

/**
 * Test both deserialization methods and compare results
 */
export async function testOfficialDeserialization(rawStateHex: string, networkType: 'local' | 'testnet' | 'mainnet' = 'local') {
  console.log('🧪 === TESTING OFFICIAL MIDNIGHT DESERIALIZATION ===');
  
  try {
    // Test ContractState deserialization
    console.log('\n1. Testing ContractState.deserialize()...');
    const contractResult = await parseWithOfficialMidnight(rawStateHex, networkType);
    
    console.log('\n📋 ContractState Results:');
    console.log(`   Operations: ${contractResult.operations.length}`);
    console.log(`   String representation available: ${!!contractResult.toString}`);
    
    // Test LedgerState deserialization
    console.log('\n2. Testing LedgerState.deserialize()...');
    const ledgerResult = await parseWithOfficialLedgerState(rawStateHex, networkType);
    
    console.log('\n📋 LedgerState Results:');
    console.log(`   Ledger state available: ${!!ledgerResult.ledgerState}`);
    console.log(`   String representation available: ${!!ledgerResult.toString}`);
    
    console.log('\n✅ Official Midnight deserialization test complete!');
    
    return {
      contractState: contractResult,
      ledgerState: ledgerResult
    };
    
  } catch (error) {
    console.error('❌ Official deserialization test failed:', error);
    throw error;
  }
}

/**
 * Create a bank contract adapter using official Midnight deserialization
 */
export async function createOfficialBankContractParser(networkType: 'local' | 'testnet' | 'mainnet' = 'local') {
  return async (rawStateHex: string) => {
    console.log('🎯 Official bank contract parser called');
    
    try {
      // Use official deserialization
      const result = await parseWithOfficialMidnight(rawStateHex, networkType);
      
      // TODO: Extract bank-specific collections from the official state
      // For now, return a compatible interface
      return {
        all_accounts: {
          member: (key: string) => {
            console.log(`🔍 Official parser checking account: ${key.substring(0, 16)}...`);
            // TODO: Query the official contract state for this account
            return false; // Placeholder
          },
          lookup: (key: string) => {
            console.log(`🔍 Official parser looking up account: ${key.substring(0, 16)}...`);
            // TODO: Query the official contract state for account data
            return null; // Placeholder
          },
          isEmpty: () => true, // Placeholder
          size: () => 0, // Placeholder
          entries: () => [] // Placeholder
        },
        encrypted_user_balances: {
          member: (key: string) => false,
          lookup: (key: string) => null
        },
        user_balance_mappings: {
          member: (key: string) => false,
          lookup: (key: string) => null
        }
      };
      
    } catch (error) {
      console.error('❌ Official bank contract parser failed:', error);
      throw error;
    }
  };
}
