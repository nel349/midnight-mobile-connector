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
  read: ['get_', 'verify_', 'check_', 'query_', 'read_'],
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
 */
export async function loadContractInfo(contractPath: string = 'contracts/compiler/contract-info.json'): Promise<ContractMap> {
  try {
    console.log(`📂 Loading contract info from: ${contractPath}`);
    
    // In a real app, you'd use fetch or require
    // For now, we'll assume the contract info is available
    const contractInfoModule = await import(`../${contractPath}`);
    const contractInfo: ContractInfo = contractInfoModule.default || contractInfoModule;
    
    return parseContractInfo(contractInfo);
  } catch (error) {
    console.error('❌ Failed to load contract info:', error);
    throw new Error(`Failed to load contract from ${contractPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 */
export function convertUserInputToParameters(circuit: ParsedCircuit, userInputs: Record<string, string>): any[] {
  return circuit.arguments.map(arg => {
    const value = userInputs[arg.name];
    if (!value) throw new Error(`Missing parameter: ${arg.name}`);
    
    if (arg.inputType === 'hex') {
      // Convert hex string to Uint8Array
      const hex = value.startsWith('0x') ? value.slice(2) : value;
      if (hex.length % 2 !== 0) throw new Error(`Invalid hex string for ${arg.name}: ${value}`);
      return new Uint8Array(hex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
    } else if (arg.inputType === 'number') {
      const num = Number(value);
      if (isNaN(num)) throw new Error(`Invalid number for ${arg.name}: ${value}`);
      return BigInt(num);
    } else {
      return value;
    }
  });
}

/**
 * Validate user input for a circuit parameter
 */
export function validateParameter(arg: ParsedCircuit['arguments'][0], value: string): { valid: boolean; error?: string } {
  if (!value.trim()) {
    return { valid: false, error: 'Parameter is required' };
  }

  if (arg.inputType === 'hex') {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    if (!/^[0-9a-fA-F]*$/.test(hex)) {
      return { valid: false, error: 'Must be a valid hex string' };
    }
    if (hex.length % 2 !== 0) {
      return { valid: false, error: 'Hex string must have even length' };
    }
    // Check byte length if specified
    const expectedLength = arg.type.match(/Bytes\[(\d+)\]/)?.[1];
    if (expectedLength && hex.length !== parseInt(expectedLength) * 2) {
      return { valid: false, error: `Must be exactly ${expectedLength} bytes (${parseInt(expectedLength) * 2} hex chars)` };
    }
  } else if (arg.inputType === 'number') {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return { valid: false, error: 'Must be a positive number' };
    }
    // Check max value if specified
    const maxMatch = arg.type.match(/max: (\d+)/);
    if (maxMatch && num > parseInt(maxMatch[1])) {
      return { valid: false, error: `Must be ≤ ${maxMatch[1]}` };
    }
  }

  return { valid: true };
}
