/**
 * Generic Circuit Executor
 * 
 * This module provides a reusable circuit execution engine that can work
 * with any contract's circuits, handling parameter conversion, validation,
 * and result formatting in a consistent way.
 */

import { ContractLedgerReader } from './contractStateReader';
import { BankContractCircuits, CircuitResult } from './bankContractCircuits';
import { type ParsedCircuit, convertUserInputToParameters } from './contractParser';

/**
 * Circuit execution context
 */
export interface CircuitExecutionContext {
  contractAddress: string;
  networkType: 'local' | 'testnet';
  contractReader: ContractLedgerReader;
  circuitImplementations: any; // Generic circuit implementations
}

/**
 * Circuit execution result with metadata
 */
export interface CircuitExecutionResult {
  success: boolean;
  circuit: string;
  parameters: any[];
  parameterPreview: string;
  resultType: string;
  timestamp: string;
  isActualCall: boolean;
  duration: number;
  data: CircuitResult;
}

/**
 * Generic Circuit Executor class
 * 
 * This class can execute circuits for any contract by providing the appropriate
 * circuit implementations and ledger parser.
 */
export class CircuitExecutor {
  private context: CircuitExecutionContext;

  constructor(context: CircuitExecutionContext) {
    this.context = context;
  }

  /**
   * Execute a circuit with user-provided parameters
   * 
   * @param circuit - Parsed circuit definition
   * @param userParameters - User inputs as strings
   * @returns Circuit execution result
   */
  async executeCircuit(
    circuit: ParsedCircuit, 
    userParameters: Record<string, string>
  ): Promise<CircuitExecutionResult> {
    const startTime = Date.now();
    
    console.log('🔧 Executing circuit:', circuit.name);
    console.log('   Parameters:', userParameters);
    console.log('   Contract:', this.context.contractAddress);
    console.log('   Network:', this.context.networkType);

    try {
      // Convert user inputs to proper parameter types
      const convertedParams = convertUserInputToParameters(circuit, userParameters);
      console.log('   Converted params:', convertedParams);

      // Create parameter preview
      const parameterPreview = this.createParameterPreview(circuit, userParameters, convertedParams);

      // Execute the circuit
      const circuitFunction = this.context.circuitImplementations[circuit.name];
      if (!circuitFunction) {
        throw new Error(`Circuit function '${circuit.name}' not available`);
      }

      console.log('📞 Executing circuit:', circuit.name, 'with params:', convertedParams);
      const circuitResult = await circuitFunction(...convertedParams);

      const duration = Date.now() - startTime;

      return {
        success: circuitResult.success,
        circuit: circuit.name,
        parameters: convertedParams,
        parameterPreview,
        resultType: circuit.resultType,
        timestamp: new Date().toISOString(),
        isActualCall: true,
        duration,
        data: circuitResult,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        circuit: circuit.name,
        parameters: [],
        parameterPreview: '',
        resultType: circuit.resultType,
        timestamp: new Date().toISOString(),
        isActualCall: false,
        duration,
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Create a user-friendly preview of parameter conversion
   */
  private createParameterPreview(
    circuit: ParsedCircuit, 
    userInputs: Record<string, string>, 
    convertedParams: any[]
  ): string {
    return circuit.arguments.map((arg, index) => {
      const originalValue = userInputs[arg.name];
      const convertedValue = convertedParams[index];
      let preview = '';
      
      if (convertedValue instanceof Uint8Array) {
        preview = `Uint8Array[${convertedValue.length}] (${Array.from(convertedValue.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ')}${convertedValue.length > 4 ? '...' : ''})`;
      } else if (typeof convertedValue === 'bigint') {
        preview = `${convertedValue}n (BigInt)`;
      } else {
        preview = `"${convertedValue}" (string)`;
      }
      
      return `  ${arg.name}: "${originalValue}" → ${preview}`;
    }).join('\n');
  }
}

/**
 * Factory function to create a circuit executor for the bank contract
 * 
 * @param contractAddress - Contract address
 * @param networkType - Network type ('local' | 'testnet')
 * @returns Promise<CircuitExecutor>
 */
export async function createBankContractExecutor(
  contractAddress: string,
  networkType: 'local' | 'testnet' = 'local'
): Promise<CircuitExecutor> {
  console.log('🔧 Creating bank contract circuit executor...');
  
  // Import providers
  const { createProvidersForNetwork } = await import('./midnightProviders');
  const { createBankContractLedgerReader } = await import('./contractStateReader');
  
  // Create providers and contract reader
  const providers = await createProvidersForNetwork(networkType);
  
  // Use generic StateValue-based parser for maximum accuracy
  console.log('🔧 Using GENERIC StateValue-based parser with React Native compatibility');
  
  const contractReader = await createBankContractLedgerReader(
    contractAddress,
    providers.publicDataProvider
  );

  // Create circuit implementations
  const bankCircuits = new BankContractCircuits(contractReader);
  
  // Create execution context
  const context: CircuitExecutionContext = {
    contractAddress,
    networkType,
    contractReader,
    circuitImplementations: {
      public_key: bankCircuits.public_key.bind(bankCircuits),
      account_exists: bankCircuits.account_exists.bind(bankCircuits),
      get_token_balance: bankCircuits.get_token_balance.bind(bankCircuits),
      verify_account_status: bankCircuits.verify_account_status.bind(bankCircuits),
    }
  };

  console.log('✅ Bank contract circuit executor ready');
  return new CircuitExecutor(context);
}
