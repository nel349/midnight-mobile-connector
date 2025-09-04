// Type definitions for Midnight Network WASM integration

// Core Midnight types
export interface CoinInfo {
  tokenType: string;
  amount: number;
  owner: string;
  metadata?: Record<string, any>;
}

export interface QualifiedCoinInfo extends CoinInfo {
  qualification: string;
}

export interface TokenType {
  symbol: string;
  decimals: number;
  contractAddress: string;
}

export interface ContractAddress {
  address: string;
  network?: string;
}

export interface CoinPublicKey {
  key: string;
  algorithm: string;
}

export interface SecretKeys {
  coinPublicKey: CoinPublicKey;
  encryptionPublicKey: string;
  coinSecretKey?: string; // Optional for security
  encryptionSecretKey?: string; // Optional for security
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
  tokenType: TokenType;
  nonce?: number;
  timestamp?: number;
}

export interface SignedData {
  message?: string; // Keep for backward compatibility
  signature: string;
  publicKey?: string; // Keep for backward compatibility
  timestamp?: number;
  nonce?: number;
  // New fields for proper WASM signature verification
  originalData?: any;
  dataBytes?: number[];
  signingKey?: string;
  verifyingKey?: string;
  // WASM-native SecretKeys approach fields
  coinSecretKey?: any;
  coinPublicKey?: any;
}

export interface QueryContext {
  state: any;
  address: string;
  effects?: any[];
  block?: number;
}

export interface ContractState {
  data: Record<string, any>;
  maintenanceAuthority?: string;
  operations: string[];
}

// WAMR Module types
export interface WamrModuleInstance {
  id: number;
  exports: string[];
}

// Externref wrapper type
export interface ExternrefArg<T = any> {
  type: 'externref';
  value: T;
}

// Function result types
export type WamrFunctionResult = any; // Can be number, object, or null

// Error types
export class WamrError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WamrError';
  }
}

export class ModuleNotFoundError extends WamrError {
  constructor(moduleId: number) {
    super(`Module with ID ${moduleId} not found`, 'MODULE_NOT_FOUND');
  }
}

export class FunctionNotFoundError extends WamrError {
  constructor(functionName: string) {
    super(`Function '${functionName}' not found`, 'FUNCTION_NOT_FOUND');
  }
}

export class InvalidArgumentError extends WamrError {
  constructor(message: string) {
    super(message, 'INVALID_ARG');
  }
}

// Midnight function signatures (for documentation)
export interface MidnightFunctions {
  // Encoding/Decoding functions
  encodeCoinInfo(coinInfo: ExternrefArg<CoinInfo>): Promise<any>;
  decodeCoinInfo(encoded: ExternrefArg): Promise<CoinInfo>;
  encodeQualifiedCoinInfo(coinInfo: ExternrefArg<QualifiedCoinInfo>): Promise<any>;
  decodeQualifiedCoinInfo(encoded: ExternrefArg): Promise<QualifiedCoinInfo>;
  encodeTokenType(tokenType: ExternrefArg<TokenType>): Promise<any>;
  decodeTokenType(encoded: ExternrefArg): Promise<TokenType>;
  encodeContractAddress(address: ExternrefArg<ContractAddress>): Promise<any>;
  decodeContractAddress(encoded: ExternrefArg): Promise<ContractAddress>;
  encodeCoinPublicKey(key: ExternrefArg<CoinPublicKey>): Promise<any>;
  decodeCoinPublicKey(encoded: ExternrefArg): Promise<CoinPublicKey>;
  
  // Cryptographic functions
  signData(data: ExternrefArg): Promise<SignedData>;
  verifySignature(signedData: ExternrefArg<SignedData>): Promise<boolean>;
  sampleSigningKey(): Promise<string>;
  signatureVerifyingKey(): Promise<string>;
  
  // Query and state functions
  querycontext_new(): Promise<number>;
  querycontext_query(context: ExternrefArg, params: ExternrefArg): Promise<any>;
  contractstate_new(): Promise<number>;
  contractstate_query(state: ExternrefArg, params: ExternrefArg): Promise<any>;
  
  // Transaction functions
  transaction_new(params: ExternrefArg): Promise<any>;
  transaction_serialize(tx: ExternrefArg): Promise<string>;
  transaction_deserialize(data: ExternrefArg<string>): Promise<any>;
}