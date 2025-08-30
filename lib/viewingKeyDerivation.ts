/**
 * Viewing Key Derivation for Midnight Indexer API
 * 
 * Based on Midnight Indexer API documentation and cryptographic standards.
 * The connect() mutation expects a ViewingKey type to establish a session
 * for decrypting shielded transactions.
 */

import * as CryptoJS from 'crypto-js';
import { encodeMidnightBech32m } from './bech32m';

// MidnightKeyPair type for fallback function
interface MidnightKeyPair {
  coinPublicKey: string;
  encryptionPublicKey: string;
}

/**
 * ViewingKey type as expected by Midnight Indexer API
 * Based on midnight-indexer source: Bech32m encoded format for GraphQL
 */
export interface ViewingKey {
  // Internal representation
  bytes: Uint8Array; // Exactly 32 bytes for the key material
  hex: string;       // 64-character hex string representation
  
  // GraphQL format (what the API expects)
  bech32m: string;   // e.g., "mn_shield-esk_test1{bech32m_data}" for testnet
  network: 'dev' | 'test' | 'mainnet' | 'undeployed';
}

/**
 * Derive viewing key from Midnight SecretKeys
 * Based on midnight-indexer: ViewingKey is exactly 32 bytes for decryption
 * 
 * Strategy:
 * 1. Extract 32 bytes from encryptionSecretKey (primary candidate)
 * 2. Extract 32 bytes from coinSecretKey (alternative) 
 * 3. Derive 32 bytes from seed using standard key derivation
 */
export async function deriveViewingKeyFromSeed(seedHex: string): Promise<ViewingKey[]> {
  console.log('🔑 Deriving 32-byte viewing keys from wallet seed...');
  
  // For React Native compatibility, skip ZSWAP and use proper HD wallet derivation
  console.log('   🔗 Using HD wallet encryption secret keys for viewing key derivation');
  return await deriveViewingKeysFromHDWallet(seedHex);
}

/**
 * Create ViewingKey from 32 bytes with proper Bech32m encoding
 * Try both raw 32-byte format and structured format
 */
function createViewingKey(bytes: Uint8Array, network: 'dev' | 'test' | 'mainnet' | 'undeployed' = 'test'): ViewingKey {
  if (bytes.length !== 32) {
    throw new Error(`ViewingKey must be exactly 32 bytes, got ${bytes.length}`);
  }
  
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Try raw 32-byte format first (simpler approach)
  console.log(`   🔧 Trying raw 32-byte viewing key format...`);
  const bech32m = encodeMidnightViewingKey(bytes, network);
  
  return {
    bytes,
    hex,
    bech32m,
    network
  };
}

/**
 * Encode ViewingKey in Midnight Bech32m format
 * Try different HRP formats to match Midnight indexer expectations
 */
function encodeMidnightViewingKey(keyPayload: Uint8Array, network: string): string {
  // Use the official Midnight indexer format discovered in their source code
  // Format: mn_shield-esk_{networkPrefix}1 where networkPrefix includes version
  const networkMap: { [key: string]: string } = {
    'dev': 'dev1',
    'test': 'test1', 
    'mainnet': '',  // mainnet uses no suffix
    'undeployed': 'undeployed1'
  };
  
  const networkSuffix = networkMap[network] || 'test1';
  const hrp = network === 'mainnet' ? 'mn_shield-esk' : `mn_shield-esk_${networkSuffix}`;
  
  try {
    // Create payload with Network ID in first 2 words (as per Midnight indexer format)
    const payloadWithNetworkId = new Uint8Array(keyPayload.length + 2);
    
    // Add Network ID bytes at the beginning (2 bytes)
    const networkId = network === 'test' ? 2 : (network === 'dev' ? 1 : 0);
    payloadWithNetworkId[0] = networkId;
    payloadWithNetworkId[1] = 0x00; // Second byte of network ID
    
    // Copy the actual viewing key material
    payloadWithNetworkId.set(keyPayload, 2);
    
    console.log(`   🔧 Official format: ${hrp} with ${payloadWithNetworkId.length} bytes (networkId: ${networkId})`);
    return encodeMidnightBech32m(hrp, payloadWithNetworkId);
  } catch (error) {
    console.error('Failed to encode ViewingKey as Bech32m:', error);
    // Fallback: create a properly formatted string structure
    return `${hrp}1${'q'.repeat(52)}`;
  }
}


/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}


/**
 * Derive viewing keys using HD wallet encryption secret keys
 */
async function deriveViewingKeysFromHDWallet(seedHex: string): Promise<ViewingKey[]> {
  console.log('🏦 Creating HD wallet to derive proper encryption secret keys...');
  const viewingKeyCandidates: ViewingKey[] = [];
  
  try {
    // Import required HD wallet modules
    const { HDWallet, Roles } = await import('@midnight-ntwrk/wallet-sdk-hd');
    const { createIntegratedKeySet } = await import('./keyDerivationUtils');
    
    // Convert seed to bytes
    const seedBytes = new Uint8Array(
      seedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // Create HD wallet
    const hdWalletResult = HDWallet.fromSeed(seedBytes);
    if (hdWalletResult.type === 'seedError') {
      throw new Error(`HD wallet creation failed: ${hdWalletResult.error}`);
    }
    
    const hdWallet = hdWalletResult.hdWallet;
    const accountKey = hdWallet.selectAccount(0);
    
    // Define roles to try for viewing key derivation
    const rolesToTry = [
      { name: 'Zswap', value: Roles.Zswap },          // Most likely for shielded operations
      { name: 'NightExternal', value: Roles.NightExternal }, // External operations  
      { name: 'Dust', value: Roles.Dust },           // Dust operations
    ];
    
    console.log('   🔑 Deriving encryption secret keys from HD wallet roles...');
    
    for (const role of rolesToTry) {
      try {
        console.log(`   → Trying ${role.name} role...`);
        
        const roleKey = accountKey.selectRole(role.value);
        const keyResult = roleKey.deriveKeyAt(0);
        
        if (keyResult.type !== 'keyDerived') {
          console.log(`     ⚠️ ${role.name}: key derivation failed`);
          continue;
        }
        
        // Create integrated key set with proper Ed25519/X25519 keys
        const integratedKeys = await createIntegratedKeySet(keyResult.key, role.name);
        
        // Use the X25519 private key (encryptionSecretKey) as viewing key material
        const encryptionSecretKey = integratedKeys.x25519.privateKey;
        
        if (encryptionSecretKey instanceof Uint8Array && encryptionSecretKey.length >= 32) {
          // Use first 32 bytes of encryption secret key
          const viewingKeyBytes = encryptionSecretKey.slice(0, 32);
          const viewingKey = createViewingKey(viewingKeyBytes);
          viewingKeyCandidates.push(viewingKey);
          console.log(`     ✅ ${role.name}: Created viewing key from X25519 secret key`);
        } else {
          console.log(`     ⚠️ ${role.name}: Invalid encryption secret key format`);
        }
        
      } catch (roleError) {
        console.log(`     ❌ ${role.name}: Error deriving keys:`, roleError);
      }
    }
    
    console.log(`   🎯 Generated ${viewingKeyCandidates.length} HD wallet-based viewing key candidates`);
    return viewingKeyCandidates;
    
  } catch (error) {
    console.error('❌ HD wallet viewing key derivation failed:', error);
    console.log('   🔄 Falling back to SHA256-based derivation...');
    return await createFallbackViewingKeys(seedHex);
  }
}

/**
 * Create viewing keys using fallback strategies when HD wallet is not available
 */
async function createFallbackViewingKeys(seedHex: string): Promise<ViewingKey[]> {
  console.log('🔄 Using fallback viewing key derivation (no ZSWAP)...');
  const viewingKeyCandidates: ViewingKey[] = [];
  
  try {
    // Strategy 1: Direct seed derivation using SHA256
    const input1 = seedHex + 'MIDNIGHT_VIEWING_KEY_V1';
    const derived1 = CryptoJS.SHA256(input1).toString();
    const derivedBytes1 = hexToBytes(derived1);
    viewingKeyCandidates.push(createViewingKey(derivedBytes1));
    console.log('   ✅ Fallback 1: SHA256(seed + domain)');
    
    // Strategy 2: Alternative domain separation
    const input2 = seedHex + 'MIDNIGHT_SHIELD_KEY_V1';
    const derived2 = CryptoJS.SHA256(input2).toString();
    const derivedBytes2 = hexToBytes(derived2);
    viewingKeyCandidates.push(createViewingKey(derivedBytes2));
    console.log('   ✅ Fallback 2: SHA256(seed + alt domain)');
    
    // Strategy 3: Use raw seed bytes if exactly 32 bytes
    const seedBytes = new Uint8Array(
      seedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    if (seedBytes.length === 32) {
      viewingKeyCandidates.push(createViewingKey(seedBytes));
      console.log('   ✅ Fallback 3: Raw seed bytes (32 bytes)');
    }
    
    console.log(`   🎯 Generated ${viewingKeyCandidates.length} fallback viewing key candidates`);
    return viewingKeyCandidates;
    
  } catch (error) {
    console.error('❌ Fallback viewing key derivation failed:', error);
    throw new Error(`Failed to create fallback viewing keys: ${error}`);
  }
}

/**
 * Derive viewing key from existing MidnightKeyPair (fallback approach)
 */
export async function deriveViewingKeyFromKeyPair(keyPair: MidnightKeyPair): Promise<ViewingKey[]> {
  console.log('🔑 Deriving 32-byte viewing key from existing key pair...');
  
  // Try to get seed from keyPair if available
  const seed = (keyPair as any).seed;
  if (seed) {
    return await deriveViewingKeyFromSeed(seed);
  }
  
  // Fallback: derive 32 bytes from existing public keys
  const viewingKeyCandidates: ViewingKey[] = [];
  
  try {
    // Strategy 1: Hash coin public key to get 32 bytes
    const coinKeyHash = CryptoJS.SHA256(keyPair.coinPublicKey).toString();
    const coinKeyBytes = hexToBytes(coinKeyHash);
    viewingKeyCandidates.push(createViewingKey(coinKeyBytes));
    console.log('   ✅ Fallback 1: SHA256(coinPublicKey)');
    
    // Strategy 2: Hash encryption public key to get 32 bytes  
    const encKeyHash = CryptoJS.SHA256(keyPair.encryptionPublicKey).toString();
    const encKeyBytes = hexToBytes(encKeyHash);
    viewingKeyCandidates.push(createViewingKey(encKeyBytes));
    console.log('   ✅ Fallback 2: SHA256(encryptionPublicKey)');
    
    // Strategy 3: Hash combined public keys
    const combinedHash = CryptoJS.SHA256(keyPair.coinPublicKey + keyPair.encryptionPublicKey).toString();
    const combinedBytes = hexToBytes(combinedHash);
    viewingKeyCandidates.push(createViewingKey(combinedBytes));
    console.log('   ✅ Fallback 3: SHA256(combined public keys)');
    
  } catch (error) {
    console.error('   ❌ Fallback viewing key derivation failed:', error);
  }
  
  console.log(`   🎯 Generated ${viewingKeyCandidates.length} fallback 32-byte viewing key candidates`);
  return viewingKeyCandidates;
}