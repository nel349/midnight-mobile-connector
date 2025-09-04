import WamrModuleInstance, { WamrModule } from './index';
import { 
  SecretKeys,
  CoinInfo,
  TokenType,
  Transaction,
  ExternrefArg,
  SignedData,
  ContractAddress
} from './types';
// Dynamic imports to avoid build-time dependencies
let bip39: any = null;
let HDKey: any = null;

// Initialize dependencies lazily
const initializeDependencies = async () => {
  if (!bip39) {
    try {
      bip39 = require('bip39');
      const bip32Module = require('@scure/bip32');
      HDKey = bip32Module.HDKey;
    } catch (error) {
      throw new Error('Failed to load HD wallet dependencies. Make sure bip39 and @scure/bip32 are installed in the main project.');
    }
  }
};

// HD wallet SDK constants (define locally to avoid import issues in turbomodule)
const Roles = {
  NightExternal: 0,
  NightInternal: 1,
  Dust: 2,
  Zswap: 3,
  Metadata: 4
};

/**
 * Midnight Network SDK - High-level wrapper around WAMR WASM modules
 * Provides convenient access to Midnight Network functionality
 */
export class MidnightSDK {
  private onchainModuleId: number | null = null;
  private zswapModuleId: number | null = null;
  private isInitialized = false;

  /**
   * Initialize the SDK by loading Midnight WASM modules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load onchain runtime module
      const onchainResponse = await fetch('/midnight_onchain_runtime_wasm_bg.wasm');
      if (!onchainResponse.ok) {
        throw new Error('Failed to fetch onchain WASM module');
      }
      const onchainBytes = new Uint8Array(await onchainResponse.arrayBuffer());
      this.onchainModuleId = await WamrModuleInstance.loadModule(onchainBytes);

      // Load zswap module
      const zswapResponse = await fetch('/midnight_zswap_wasm_bg.wasm');
      if (!zswapResponse.ok) {
        throw new Error('Failed to fetch zswap WASM module');
      }
      const zswapBytes = new Uint8Array(await zswapResponse.arrayBuffer());
      this.zswapModuleId = await WamrModuleInstance.loadModule(zswapBytes);

      this.isInitialized = true;
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Cleanup and release loaded modules
   */
  async cleanup(): Promise<void> {
    if (this.onchainModuleId !== null) {
      await WamrModuleInstance.releaseModule(this.onchainModuleId);
      this.onchainModuleId = null;
    }
    if (this.zswapModuleId !== null) {
      await WamrModuleInstance.releaseModule(this.zswapModuleId);
      this.zswapModuleId = null;
    }
    this.isInitialized = false;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || this.zswapModuleId === null) {
      throw new Error('MidnightSDK not initialized. Call initialize() first.');
    }
  }

  // ========== Mnemonic & Seed Generation ==========

  /**
   * Generate a new BIP39 mnemonic phrase
   * @param strength - 128 for 12 words, 256 for 24 words
   * @returns Mnemonic phrase
   */
  async generateMnemonic(strength: 128 | 256 = 256): Promise<string> {
    await initializeDependencies();
    return bip39.generateMnemonic(strength);
  }

  /**
   * Validate a BIP39 mnemonic phrase
   * @param mnemonic - The mnemonic to validate
   * @returns True if valid
   */
  async validateMnemonic(mnemonic: string): Promise<boolean> {
    await initializeDependencies();
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * Convert mnemonic to seed bytes
   * @param mnemonic - BIP39 mnemonic phrase
   * @param passphrase - Optional passphrase
   * @returns Seed as Uint8Array
   */
  async mnemonicToSeed(mnemonic: string, passphrase?: string): Promise<Uint8Array> {
    await initializeDependencies();
    const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
    return new Uint8Array(seed);
  }

  // ========== SecretKeys Generation ==========

  /**
   * Generate new random SecretKeys
   * @returns SecretKeys object from WASM
   */
  async generateSecretKeys(): Promise<any> {
    this.ensureInitialized();
    
    // Call secretkeys_new() which generates new random keys
    return await WamrModuleInstance.callFunctionWithExternref(
      this.zswapModuleId!,
      'secretkeys_new',
      []
    );
  }

  /**
   * Generate SecretKeys from a seed
   * @param seed - Seed bytes (32 bytes recommended)
   * @returns SecretKeys object from WASM
   */
  async generateSecretKeysFromSeed(seed: Uint8Array): Promise<any> {
    this.ensureInitialized();
    
    // Call secretkeys_fromSeed() with the seed
    return await WamrModuleInstance.callFunctionWithExternref(
      this.zswapModuleId!,
      'secretkeys_fromSeed',
      [WamrModule.externref(seed)]
    );
  }

  /**
   * Generate SecretKeys from a mnemonic phrase
   * @param mnemonic - BIP39 mnemonic phrase
   * @param passphrase - Optional passphrase
   * @returns SecretKeys object from WASM
   */
  async generateSecretKeysFromMnemonic(mnemonic: string, passphrase?: string): Promise<any> {
    const seed = await this.mnemonicToSeed(mnemonic, passphrase);
    return await this.generateSecretKeysFromSeed(seed);
  }

  /**
   * Generate Lace-compatible SecretKeys using HD wallet derivation
   * Uses CIP-1852 derivation path like Lace wallet: m/1852'/2400'/0'/0/0
   * @param mnemonic - BIP39 mnemonic phrase
   * @param passphrase - Optional passphrase
   * @param accountIndex - Account index (default: 0)
   * @param role - Role (default: NightExternal for addresses)
   * @param addressIndex - Address index (default: 0)
   * @returns SecretKeys object from WASM compatible with Lace
   */
  async generateLaceCompatibleSecretKeys(
    mnemonic: string, 
    passphrase?: string,
    accountIndex: number = 0,
    role: number = Roles.NightExternal,
    addressIndex: number = 0
  ): Promise<any> {
    this.ensureInitialized();
    
    // Generate master seed from mnemonic (same as Lace)
    const masterSeed = await this.mnemonicToSeed(mnemonic, passphrase);
    
    // Use HD wallet with CIP-1852 derivation path (same as Lace)
    await initializeDependencies();
    const rootKey = HDKey.fromMasterSeed(masterSeed);
    
    // CIP-1852 derivation: m/1852'/2400'/account'/role/addressIndex
    const PURPOSE_CIP1852 = 1852;
    const COIN_TYPE = 2400;
    
    const derivationPath = `m/${PURPOSE_CIP1852}'/${COIN_TYPE}'/${accountIndex}'/${role}/${addressIndex}`;
    console.log(`🔑 Using Lace-compatible derivation path: ${derivationPath}`);
    
    const derivedKey = rootKey.derive(derivationPath);
    const derivedSeed = derivedKey.privateKey;
    
    if (!derivedSeed) {
      throw new Error('Failed to derive private key from HD wallet');
    }
    
    // Now use the derived seed with WASM SecretKeys (same approach as Lace)
    return await this.generateSecretKeysFromSeed(new Uint8Array(derivedSeed));
  }

  /**
   * Generate SecretKeys using internal RNG
   * @returns SecretKeys object from WASM
   */
  async generateSecretKeysFromRng(): Promise<any> {
    this.ensureInitialized();
    
    // Call secretkeys_fromSeedRng() which uses internal RNG
    return await WamrModuleInstance.callFunctionWithExternref(
      this.zswapModuleId!,
      'secretkeys_fromSeedRng',
      []
    );
  }

  /**
   * Get coin public key from SecretKeys
   * @param secretKeys - SecretKeys object
   * @returns Coin public key as hex string
   */
  async getCoinPublicKey(secretKeys: any): Promise<string> {
    this.ensureInitialized();
    
    const key = await WamrModuleInstance.callFunctionWithExternref(
      this.zswapModuleId!,
      'secretkeys_coinPublicKey',
      [WamrModule.externref(secretKeys)]
    );
    
    // Convert to hex string - handle both Uint8Array and plain objects with numeric keys
    if (key instanceof Uint8Array) {
      return Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (typeof key === 'object' && key !== null) {
      // Handle plain objects with numeric indices (returned by WASM)
      const bytes: number[] = [];
      for (let i = 0; i < Object.keys(key).length; i++) {
        if (key.hasOwnProperty(i.toString())) {
          bytes.push(key[i.toString()]);
        }
      }
      return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return key;
  }

  /**
   * Get encryption public key from SecretKeys
   * @param secretKeys - SecretKeys object
   * @returns Encryption public key as hex string
   */
  async getEncryptionPublicKey(secretKeys: any): Promise<string> {
    this.ensureInitialized();
    
    const key = await WamrModuleInstance.callFunctionWithExternref(
      this.zswapModuleId!,
      'secretkeys_encryptionPublicKey',
      [WamrModule.externref(secretKeys)]
    );
    
    // Convert to hex string - handle both Uint8Array and plain objects with numeric keys
    if (key instanceof Uint8Array) {
      return Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (typeof key === 'object' && key !== null) {
      // Handle plain objects with numeric indices (returned by WASM)
      const bytes: number[] = [];
      for (let i = 0; i < Object.keys(key).length; i++) {
        if (key.hasOwnProperty(i.toString())) {
          bytes.push(key[i.toString()]);
        }
      }
      return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return key;
  }

  // ========== Token & Coin Operations ==========

  /**
   * Encode coin information
   * @param coinInfo - Coin information object
   * @returns Encoded coin info
   */
  async encodeCoinInfo(coinInfo: CoinInfo): Promise<any> {
    this.ensureInitialized();
    
    return await WamrModuleInstance.callFunctionWithExternref(
      this.onchainModuleId!,
      'encodeCoinInfo',
      [WamrModule.externref(coinInfo)]
    );
  }

  /**
   * Decode coin information
   * @param encoded - Encoded coin info
   * @returns Decoded CoinInfo
   */
  async decodeCoinInfo(encoded: any): Promise<CoinInfo> {
    this.ensureInitialized();
    
    return await WamrModuleInstance.callFunctionWithExternref(
      this.onchainModuleId!,
      'decodeCoinInfo',
      [WamrModule.externref(encoded)]
    );
  }

  /**
   * Get native token information
   * @returns Native token type
   */
  async getNativeToken(): Promise<TokenType> {
    this.ensureInitialized();
    
    return await WamrModuleInstance.callFunctionWithExternref(
      this.zswapModuleId!,
      'nativeToken',
      []
    );
  }

  /**
   * Sample token type (for testing)
   * @returns Sample token type
   */
  async getSampleTokenType(): Promise<TokenType> {
    this.ensureInitialized();
    
    return await WamrModuleInstance.callFunctionWithExternref(
      this.onchainModuleId!,
      'sampleTokenType',
      []
    );
  }

  // ========== Cryptographic Operations ==========

  /**
   * Sign data with SecretKeys
   * @param data - Data to sign
   * @param secretKeys - SecretKeys for signing
   * @returns Signed data
   */
  async signData(data: any, secretKeys?: any): Promise<SignedData> {
    this.ensureInitialized();
    
    const args = secretKeys 
      ? [WamrModule.externref(data), WamrModule.externref(secretKeys)]
      : [WamrModule.externref(data)];
    
    return await WamrModuleInstance.callFunctionWithExternref(
      this.onchainModuleId!,
      'signData',
      args
    );
  }

  /**
   * Verify a signature
   * @param signedData - Signed data to verify
   * @returns Verification result
   */
  async verifySignature(signedData: SignedData): Promise<boolean> {
    this.ensureInitialized();
    
    const result = await WamrModuleInstance.callFunctionWithExternref(
      this.onchainModuleId!,
      'verifySignature',
      [WamrModule.externref(signedData)]
    );
    
    return result === true || result === 1;
  }

  // ========== Transaction Operations ==========

  /**
   * Create a new transaction
   * @param params - Transaction parameters
   * @returns Unproven transaction
   */
  async createTransaction(params: any): Promise<any> {
    this.ensureInitialized();
    
    return await WamrModuleInstance.callFunctionWithExternref(
      this.zswapModuleId!,
      'unproventransaction_new',
      [WamrModule.externref(params)]
    );
  }

  /**
   * Serialize a transaction
   * @param transaction - Transaction to serialize
   * @returns Serialized transaction
   */
  async serializeTransaction(transaction: any): Promise<string> {
    this.ensureInitialized();
    
    return await WamrModuleInstance.callFunctionWithExternref(
      this.zswapModuleId!,
      'transaction_serialize',
      [WamrModule.externref(transaction)]
    );
  }

  // ========== Convenience Methods ==========

  /**
   * Create a complete wallet from mnemonic
   * @param mnemonic - BIP39 mnemonic phrase
   * @returns Object with mnemonic, seed, and SecretKeys
   */
  async createWallet(mnemonic?: string): Promise<{
    mnemonic: string;
    seed: Uint8Array;
    secretKeys: any;
    coinPublicKey: string;
    encryptionPublicKey: string;
  }> {
    // Generate or validate mnemonic
    const walletMnemonic = mnemonic || await this.generateMnemonic();
    if (!await this.validateMnemonic(walletMnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Generate seed and SecretKeys
    const seed = await this.mnemonicToSeed(walletMnemonic);
    const secretKeys = await this.generateSecretKeysFromSeed(seed);
    
    // Get public keys
    const coinPublicKey = await this.getCoinPublicKey(secretKeys);
    const encryptionPublicKey = await this.getEncryptionPublicKey(secretKeys);

    return {
      mnemonic: walletMnemonic,
      seed,
      secretKeys,
      coinPublicKey,
      encryptionPublicKey
    };
  }

  /**
   * Create a Lace-compatible wallet using HD derivation
   * @param mnemonic - BIP39 mnemonic phrase
   * @param useLaceCompatible - Whether to use Lace-compatible HD derivation (default: true)
   * @returns Object with mnemonic, HD-derived SecretKeys, and address info
   */
  async createLaceCompatibleWallet(mnemonic?: string, useLaceCompatible: boolean = true): Promise<{
    mnemonic: string;
    masterSeed: Uint8Array;
    derivationPath: string;
    secretKeys: any;
    coinPublicKey: string;
    encryptionPublicKey: string;
    isLaceCompatible: boolean;
  }> {
    // Generate or validate mnemonic
    const walletMnemonic = mnemonic || await this.generateMnemonic();
    if (!await this.validateMnemonic(walletMnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    let secretKeys: any;
    let derivationPath: string;
    const masterSeed = await this.mnemonicToSeed(walletMnemonic);

    if (useLaceCompatible) {
      // Use HD wallet derivation like Lace
      secretKeys = await this.generateLaceCompatibleSecretKeys(walletMnemonic);
      derivationPath = "m/1852'/2400'/0'/0/0"; // NightExternal role, first address
    } else {
      // Use direct seed derivation (old method)
      secretKeys = await this.generateSecretKeysFromSeed(masterSeed);
      derivationPath = "direct"; // Not HD-derived
    }
    
    // Get public keys
    const coinPublicKey = await this.getCoinPublicKey(secretKeys);
    const encryptionPublicKey = await this.getEncryptionPublicKey(secretKeys);

    return {
      mnemonic: walletMnemonic,
      masterSeed,
      derivationPath,
      secretKeys,
      coinPublicKey,
      encryptionPublicKey,
      isLaceCompatible: useLaceCompatible
    };
  }

  /**
   * Quick test of all major functions
   */
  async testAllFunctions(): Promise<void> {
    console.log('🧪 Testing MidnightSDK...');
    
    // Test mnemonic generation
    const mnemonic = await this.generateMnemonic(128); // 12 words
    console.log('✅ Generated mnemonic:', mnemonic.split(' ').slice(0, 3).join(' ') + '...');
    
    // Test wallet creation
    const wallet = await this.createWallet(mnemonic);
    console.log('✅ Created wallet from mnemonic');
    console.log('  - Coin public key:', wallet.coinPublicKey);
    console.log('  - Encryption public key:', wallet.encryptionPublicKey);
    
    // Test coin encoding
    const coinInfo: CoinInfo = {
      tokenType: 'MIDNIGHT',
      amount: 1000,
      owner: wallet.coinPublicKey,
      metadata: { created: Date.now() }
    };
    
    const encoded = await this.encodeCoinInfo(coinInfo);
    console.log('✅ Encoded coin info');
    
    const decoded = await this.decodeCoinInfo(encoded);
    console.log('✅ Decoded coin info:', decoded);
    
    // Test signing
    const data = { message: 'Hello Midnight!', timestamp: Date.now() };
    const signed = await this.signData(data, wallet.secretKeys);
    console.log('✅ Signed data');
    
    const verified = await this.verifySignature(signed);
    console.log('✅ Signature verified:', verified);
    
    console.log('🎉 All tests passed!');
  }
}

// Export singleton instance
export const midnightSDK = new MidnightSDK();
export default midnightSDK;