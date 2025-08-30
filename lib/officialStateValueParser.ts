/**
 * Official StateValue-based ledger parser with React Native compatibility
 * 
 * This combines:
 * 1. StateValue.newNull() for proper ledger structure
 * 2. ContractState string parsing for real account data
 * 3. React Native WASM compatibility check
 */

interface OfficialBankLedgerState {
  all_accounts: {
    member: (userId: string) => boolean;
    lookup: (userId: string) => any;
  };
  total_accounts: any;
  encrypted_balances: any;
  last_global_transaction: any;
  active_authorizations: any;
  pending_auth_requests: any;
  user_as_recipient_auths: any;
  user_as_sender_auths: any;
  encrypted_amount_mappings: any;
  bank_token_id: any;
  encrypted_user_balances: any;
  user_balance_mappings: any;
  shared_balance_access: any;
  total_token_supply: any;
  token_mint_authority: any;
  current_timestamp: any;
}

export interface StateValueParserResult {
  success: boolean;
  ledgerState: OfficialBankLedgerState | null;
  fallbackUsed: boolean;
  error?: string;
}

/**
 * Parse ContractState string to extract account data
 */
function parseAccountsFromContractState(contractStateString: string): Map<string, any> {
  console.log('🔍 Parsing accounts from ContractState string...');
  
  const accounts = new Map<string, any>();
  
  try {
    // Look for the account data pattern in the string
    // Format: Map {<[6e656c333439]: b32>: <[account_data...]>}
    
    const mapPattern = /Map\s*\{([^}]+)\}/g;
    let mapMatch;
    
    while ((mapMatch = mapPattern.exec(contractStateString)) !== null) {
      const mapContent = mapMatch[1];
      
      // Look for key-value pairs: <[hexkey]: b32>: <[value...]>
      const entryPattern = /<\[([0-9a-f]+)\]:\s*b32>\s*:\s*<\[([^\]]+)\]/g;
      let entryMatch;
      
      while ((entryMatch = entryPattern.exec(mapContent)) !== null) {
        const hexKey = entryMatch[1];
        const valueStr = entryMatch[2];
        
        // Convert hex key to original string (if possible)
        try {
          const keyBytes = new Uint8Array(hexKey.length / 2);
          for (let i = 0; i < hexKey.length; i += 2) {
            keyBytes[i / 2] = parseInt(hexKey.substr(i, 2), 16);
          }
          
          // Check if this looks like a username (printable ASCII)
          const decoded = new TextDecoder().decode(keyBytes).replace(/\0/g, '');
          
          if (decoded.match(/^[a-zA-Z0-9_-]+$/)) {
            console.log(`   Found account: ${decoded} (hex: ${hexKey})`);
            
            // Parse the account value (simplified for now)
            const accountData = {
              exists: true,
              raw: valueStr,
              decoded: decoded,
              hexKey: hexKey.padEnd(64, '0'), // Ensure 32-byte hex key
              // Add more parsing as needed
            };
            
            accounts.set(accountData.hexKey, accountData);
          }
          
        } catch (error) {
          // Skip non-text keys
        }
      }
    }
    
    console.log(`   ✅ Found ${accounts.size} accounts`);
    return accounts;
    
  } catch (error) {
    console.log(`   ❌ Account parsing failed: ${(error as Error).message}`);
    return accounts;
  }
}

/**
 * Create official StateValue-based ledger parser
 */
export async function createOfficialStateValueParser(): Promise<(rawStateHex: string, contractStateString?: string) => Promise<StateValueParserResult>> {
  console.log('🏗️ Creating official StateValue-based parser...');
  
  try {
    // Try to load WASM modules
    const compactRuntime = await import('@midnight-ntwrk/compact-runtime');
    const contractModule = await import('../contracts/contract/index.cjs');
    
    console.log('✅ WASM modules loaded successfully');
    console.log('✅ Official StateValue approach available');
    
    return async (rawStateHex: string, contractStateString?: string): Promise<StateValueParserResult> => {
      try {
        // Approach 1: Use StateValue.newNull() for structure, parse string for data
        const StateValue = compactRuntime.StateValue;
        const nullState = StateValue.newNull();
        const baseLedger = contractModule.ledger(nullState);
        
        console.log('✅ Base ledger structure created with StateValue.newNull()');
        
        // Parse accounts from ContractState string if available
        let accountsMap = new Map<string, any>();
        if (contractStateString) {
          accountsMap = parseAccountsFromContractState(contractStateString);
        }
        
        console.log('🔍 Checking base ledger properties...');
        console.log('   Base ledger keys:', Object.keys(baseLedger));
        
        // Test accessing properties individually to find the problematic one
        let safeProperties: any = {};
        Object.keys(baseLedger).forEach(key => {
          try {
            const value = (baseLedger as any)[key];
            safeProperties[key] = value;
            console.log(`   ✅ Property ${key}: accessible`);
          } catch (error) {
            console.log(`   ❌ Property ${key}: ${(error as Error).message}`);
            safeProperties[key] = null; // Use null as fallback
          }
        });
        
        // Create enhanced ledger with real data using only safe properties
        const enhancedLedger: OfficialBankLedgerState = {
          all_accounts: {
            member: (userId: string): boolean => {
              // Ensure userId is properly formatted (32-byte hex)
              const normalizedUserId = userId.padEnd(64, '0');
              const exists = accountsMap.has(normalizedUserId);
              console.log(`   Checking account ${userId} (${normalizedUserId}): ${exists}`);
              return exists;
            },
            lookup: (userId: string): any => {
              const normalizedUserId = userId.padEnd(64, '0');
              const account = accountsMap.get(normalizedUserId);
              console.log(`   Looking up account ${userId}: ${account ? 'found' : 'not found'}`);
              return account || null;
            }
          },
          // Use safe properties
          total_accounts: safeProperties.total_accounts || null,
          encrypted_balances: safeProperties.encrypted_balances || null,
          last_global_transaction: safeProperties.last_global_transaction || null,
          active_authorizations: safeProperties.active_authorizations || null,
          pending_auth_requests: safeProperties.pending_auth_requests || null,
          user_as_recipient_auths: safeProperties.user_as_recipient_auths || null,
          user_as_sender_auths: safeProperties.user_as_sender_auths || null,
          encrypted_amount_mappings: safeProperties.encrypted_amount_mappings || null,
          bank_token_id: safeProperties.bank_token_id || null,
          encrypted_user_balances: safeProperties.encrypted_user_balances || null,
          user_balance_mappings: safeProperties.user_balance_mappings || null,
          shared_balance_access: safeProperties.shared_balance_access || null,
          total_token_supply: safeProperties.total_token_supply || null,
          token_mint_authority: safeProperties.token_mint_authority || null,
          current_timestamp: safeProperties.current_timestamp || null
        };
        
        return {
          success: true,
          ledgerState: enhancedLedger,
          fallbackUsed: false
        };
        
      } catch (error) {
        console.log(`❌ Official StateValue parsing failed: ${(error as Error).message}`);
        
        return {
          success: false,
          ledgerState: null,
          fallbackUsed: false,
          error: (error as Error).message
        };
      }
    };
    
  } catch (error) {
    console.log(`❌ WASM modules not available: ${(error as Error).message}`);
    console.log('🔄 Falling back to string-only parsing...');
    
    // Fallback: Pure string parsing (no WASM)
    return async (rawStateHex: string, contractStateString?: string): Promise<StateValueParserResult> => {
      try {
        let accountsMap = new Map<string, any>();
        if (contractStateString) {
          accountsMap = parseAccountsFromContractState(contractStateString);
        }
        
        // Create a mock ledger structure that mimics the official one
        const mockLedger: OfficialBankLedgerState = {
          all_accounts: {
            member: (userId: string): boolean => {
              const normalizedUserId = userId.padEnd(64, '0');
              return accountsMap.has(normalizedUserId);
            },
            lookup: (userId: string): any => {
              const normalizedUserId = userId.padEnd(64, '0');
              return accountsMap.get(normalizedUserId) || null;
            }
          },
          total_accounts: null,
          encrypted_balances: null,
          last_global_transaction: null,
          active_authorizations: null,
          pending_auth_requests: null,
          user_as_recipient_auths: null,
          user_as_sender_auths: null,
          encrypted_amount_mappings: null,
          bank_token_id: null,
          encrypted_user_balances: null,
          user_balance_mappings: null,
          shared_balance_access: null,
          total_token_supply: null,
          token_mint_authority: null,
          current_timestamp: null
        };
        
        return {
          success: true,
          ledgerState: mockLedger,
          fallbackUsed: true
        };
        
      } catch (error) {
        return {
          success: false,
          ledgerState: null,
          fallbackUsed: true,
          error: (error as Error).message
        };
      }
    };
  }
}

/**
 * React Native compatibility check
 */
export async function checkReactNativeCompatibility(): Promise<{wasmSupported: boolean, recommendation: string}> {
  try {
    const compactRuntime = await import('@midnight-ntwrk/compact-runtime');
    const StateValue = compactRuntime.StateValue;
    
    // Try to create a simple StateValue
    const testState = StateValue.newNull();
    const type = testState.type();
    
    console.log('✅ React Native WASM compatibility: SUPPORTED');
    console.log(`   Test StateValue type: ${type}`);
    
    return {
      wasmSupported: true,
      recommendation: 'Use official StateValue approach for best performance and accuracy'
    };
    
  } catch (error) {
    console.log('❌ React Native WASM compatibility: NOT SUPPORTED');
    console.log(`   Error: ${(error as Error).message}`);
    
    return {
      wasmSupported: false,
      recommendation: 'Use string parsing fallback for React Native deployment'
    };
  }
}
