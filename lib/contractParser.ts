/**
 * Contract Parser & Circuit Function Mapper
 * 
 * 🚀 This is the fucking REAL DEAL - parses actual @managed/ contract files
 * and creates a dynamic mapping for both pure and impure circuits.
 * 
 * Future mobile developers will thank us for this! 🎯
 */

export interface CircuitArgument {
  name: string;
  type: {
    'type-name': string;
    length?: number;
    maxval?: number;
  };
}

export interface CircuitDefinition {
  name: string;
  pure: boolean;
  arguments: CircuitArgument[];
  'result-type': {
    'type-name': string;
    types?: any[];
    length?: number;
  };
}

export interface ContractInfo {
  circuits: CircuitDefinition[];
}

export interface ParsedCircuit {
  name: string;
  isPure: boolean;
  arguments: {
    name: string;
    type: string;
    description: string;
    inputType: 'hex' | 'number' | 'string';
    placeholder: string;
  }[];
  resultType: string;
  category: 'read' | 'write' | 'utility';
  description: string;
}

export interface ContractMap {
  pure: ParsedCircuit[];
  impure: ParsedCircuit[];
  all: ParsedCircuit[];
}

/**
 * Type mapping from Compact types to user-friendly descriptions
 */
const TYPE_MAPPINGS = {
  'Bytes': (length?: number) => ({
    type: `Bytes${length ? `[${length}]` : ''}`,
    inputType: 'hex' as const,
    description: length === 32 ? 'User ID or Hash (32 bytes)' : `Byte array${length ? ` (${length} bytes)` : ''}`,
    placeholder: length === 32 ? '0x1234567890abcdef...' : '0x...',
  }),
  'Uint': (maxval?: number) => ({
    type: `Uint${maxval ? `(max: ${maxval})` : ''}`,
    inputType: 'number' as const,
    description: 'Unsigned integer',
    placeholder: maxval ? `0 - ${maxval}` : '0',
  }),
  'Tuple': () => ({
    type: 'Tuple',
    inputType: 'string' as const,
    description: 'Complex data structure',
    placeholder: '{}',
  }),
};

/**
 * Function categorization based on name patterns
 */
const FUNCTION_CATEGORIES = {
  read: ['get_', 'verify_', 'check_', 'query_', 'read_', 'account_exists'],
  write: ['create_', 'deposit', 'withdraw', 'send_', 'claim_', 'approve_', 'grant_', 'set_'],
  utility: ['public_key', 'hash_', 'encode_', 'decode_'],
};

/**
 * Generate user-friendly descriptions for functions
 */
const FUNCTION_DESCRIPTIONS: Record<string, string> = {
  'create_account': '🏦 Create a new bank account with initial deposit',
  'deposit': '💰 Deposit tokens into your account',
  'withdraw': '💸 Withdraw tokens from your account',
  'get_token_balance': '💵 Check your current token balance',
  'verify_account_status': '✅ Verify account exists and is active',
  'send_to_authorized_user': '📤 Send tokens to an authorized recipient',
  'request_transfer_authorization': '🔐 Request permission to transfer tokens',
  'approve_transfer_authorization': '✅ Approve a transfer request',
  'claim_authorized_transfer': '📥 Claim tokens from an approved transfer',
  'grant_disclosure_permission': '🔓 Grant permission to view account details',
  'set_timestamp': '⏰ Set blockchain timestamp (admin function)',
  'account_exists': '👤 Check if an account exists and validate credentials',
  'get_contract_name': '📝 Get contract name (simple test - no parameters)',
  'public_key': '🔑 Generate public key from private key',
};

/**
 * Parse contract-info.json into a usable map
 */
export function parseContractInfo(contractInfo: ContractInfo): ContractMap {
  console.log('🔍 Parsing contract info...');
  console.log(`   Found ${contractInfo.circuits.length} circuits`);

  const parsed: ParsedCircuit[] = contractInfo.circuits.map(circuit => {
    const args = circuit.arguments.map(arg => {
      const typeInfo = getTypeInfo(arg.type);
      return {
        name: arg.name,
        type: typeInfo.type,
        description: typeInfo.description,
        inputType: typeInfo.inputType,
        placeholder: typeInfo.placeholder,
      };
    });

    const category = categorizeFunction(circuit.name);
    
    return {
      name: circuit.name,
      isPure: circuit.pure,
      arguments: args,
      resultType: getResultTypeDescription(circuit['result-type']),
      category,
      description: FUNCTION_DESCRIPTIONS[circuit.name] || `Function: ${circuit.name}`,
    };
  });

  const pure = parsed.filter(c => c.isPure);
  const impure = parsed.filter(c => !c.isPure);

  console.log(`✅ Parsed: ${pure.length} pure, ${impure.length} impure circuits`);
  
  return {
    pure,
    impure,
    all: parsed,
  };
}

/**
 * Get type information for UI display
 */
function getTypeInfo(type: CircuitArgument['type']) {
  const typeName = type['type-name'];
  
  if (typeName === 'Bytes') {
    return TYPE_MAPPINGS.Bytes(type.length);
  } else if (typeName === 'Uint') {
    return TYPE_MAPPINGS.Uint(type.maxval);
  } else if (typeName === 'Tuple') {
    return TYPE_MAPPINGS.Tuple();
  } else {
    return {
      type: typeName,
      inputType: 'string' as const,
      description: `Type: ${typeName}`,
      placeholder: 'Enter value...',
    };
  }
}

/**
 * Categorize function based on name
 */
function categorizeFunction(name: string): 'read' | 'write' | 'utility' {
  for (const [category, patterns] of Object.entries(FUNCTION_CATEGORIES)) {
    if (patterns.some(pattern => name.startsWith(pattern))) {
      return category as 'read' | 'write' | 'utility';
    }
  }
  return 'write'; // Default to write for safety
}

/**
 * Get human-readable result type description
 */
function getResultTypeDescription(resultType: CircuitDefinition['result-type']): string {
  if (resultType['type-name'] === 'Tuple' && (!resultType.types || resultType.types.length === 0)) {
    return 'void (no return value)';
  } else if (resultType['type-name'] === 'Bytes') {
    return `Bytes${resultType.length ? `[${resultType.length}]` : ''}`;
  } else {
    return resultType['type-name'];
  }
}

/**
 * Load and parse contract from the contracts directory
 * 
 * 🚀 FIXED: No dynamic imports - React Native friendly!
 */
export function loadContractInfo(): ContractMap {
  try {
    console.log(`📂 Loading contract info from embedded data...`);
    
    // Import the contract info directly (no dynamic imports!)
    const contractInfo = require('../contracts/compiler/contract-info.json') as ContractInfo;
    
    return parseContractInfo(contractInfo);
  } catch (error) {
    console.error('❌ Failed to load contract info:', error);
    throw new Error(`Failed to load contract info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate TypeScript parameter types for a circuit
 */
export function generateParameterTypes(circuit: ParsedCircuit): string {
  const params = circuit.arguments.map(arg => {
    let tsType: string;
    if (arg.inputType === 'hex') {
      tsType = 'Uint8Array | string'; // Accept both hex strings and Uint8Arrays
    } else if (arg.inputType === 'number') {
      tsType = 'bigint | number';
    } else {
      tsType = 'string';
    }
    return `${arg.name}: ${tsType}`;
  });
  
  return `(${params.join(', ')})`;
}

/**
 * Convert user input to proper circuit parameters
 * 🚀 USER-FRIENDLY: Handles string inputs and converts to required types automatically
 */
export function convertUserInputToParameters(circuit: ParsedCircuit, userInputs: Record<string, string>): any[] {
  return circuit.arguments.map(arg => {
    const value = userInputs[arg.name];
    if (!value && value !== '0') throw new Error(`Missing parameter: ${arg.name}`);
    
    console.log(`🔧 Converting parameter ${arg.name} (${arg.type}) from "${value}"`);
    
    if (arg.inputType === 'hex') {
      // For user_id, pins, passwords, public keys, etc. - convert string to hex bytes
      if (arg.name.includes('user_id') || arg.name.includes('pin') || arg.name.includes('password') || arg.name.includes('public_key') || arg.name.includes('pk')) {
        // Convert string to UTF-8 bytes then to hex
        const encoder = new TextEncoder();
        const bytes = encoder.encode(value);
        console.log(`   String "${value}" → ${bytes.length} bytes → Uint8Array`);
        return bytes;
      } else {
        // Handle manual hex input (with or without 0x prefix)
        let hex = value.trim();
        if (hex.startsWith('0x')) hex = hex.slice(2);
        
        // Pad to required length if needed
        const requiredLength = (arg.type as any).length || 32; // Default to 32 bytes
        if (hex.length < requiredLength * 2) {
          hex = hex.padEnd(requiredLength * 2, '0');
        }
        
        if (hex.length % 2 !== 0) hex = '0' + hex;
        
        const bytes = new Uint8Array(hex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
        console.log(`   Hex "${value}" → ${bytes.length} bytes → Uint8Array`);
        return bytes;
      }
    } else if (arg.inputType === 'number') {
      const num = Number(value);
      if (isNaN(num)) throw new Error(`Invalid number for ${arg.name}: ${value}`);
      const result = BigInt(num);
      console.log(`   Number "${value}" → ${result}n (BigInt)`);
      return result;
    } else {
      console.log(`   String "${value}" → unchanged`);
      return value;
    }
  });
}

/**
 * Validate user input for a circuit parameter
 * 🚀 USER-FRIENDLY: More lenient validation with helpful error messages
 */
export function validateParameter(arg: ParsedCircuit['arguments'][0], value: string): { valid: boolean; error?: string } {
  if (!value.trim()) {
    return { valid: false, error: 'Required field' };
  }

  if (arg.inputType === 'hex') {
    // For user_id and similar fields - accept any string (will be converted to bytes)
    if (arg.name.includes('user_id') || arg.name.includes('public_key') || arg.name.includes('pk') || arg.name.includes('pin')) {
      if (value.length > 50) { // Reasonable limit for string inputs
        return { valid: false, error: 'String too long (max 50 characters)' };
      }
      return { valid: true }; // Accept any reasonable string
    } else {
      // For manual hex inputs - validate hex format but be more lenient
      let hex = value.trim();
      if (hex.startsWith('0x')) hex = hex.slice(2);
      
      if (!/^[0-9a-fA-F]*$/.test(hex)) {
        return { valid: false, error: 'Invalid hex. Use 0-9, a-f, A-F only' };
      }
      
      // Check length requirements for bytes (but allow auto-padding)
      const expectedLength = arg.type.match(/Bytes\[(\d+)\]/)?.[1];
      if (expectedLength) {
        const maxHexLength = parseInt(expectedLength) * 2;
        if (hex.length > maxHexLength) {
          return { valid: false, error: `Too long. Max ${maxHexLength} hex chars (${expectedLength} bytes)` };
        }
        // Auto-padding will handle shorter inputs
      }
    }
  } else if (arg.inputType === 'number') {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Enter a valid number' };
    }
    if (num < 0) {
      return { valid: false, error: 'Must be 0 or positive' };
    }
    
    // Check max value if specified
    const maxMatch = arg.type.match(/max: (\d+)/);
    if (maxMatch && num > parseInt(maxMatch[1])) {
      return { valid: false, error: `Too large. Max: ${maxMatch[1]}` };
    }
  }

  return { valid: true };
}
