/**
 * Midnight Mobile Wallet SDK
 * 
 * Clean, reusable SDK for creating Midnight-compatible wallets in mobile environments.
 * Uses Web Crypto API for deterministic key generation - NO WASM dependencies.
 * 
 * Architecture:
 * - BIP-32 HD Wallet with official Midnight derivation path: m/44'/2400'/account'/role/index
 * - Ed25519 keys for coin operations and transaction signing
 * - X25519 keys for encryption and privacy features
 */

import { HDWallet, generateRandomSeed, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { createIntegratedKeySet } from './keyDerivationUtils';

export interface MidnightKeyPair {
  role: string;
  hdSeed: string;
  coinPublicKey: string;      // Ed25519 public key (hex)
  coinSecretKey: any;         // Ed25519 private key
  encryptionPublicKey: string; // X25519 public key (hex)
  encryptionSecretKey: any;   // X25519 private key
}

export interface MidnightWallet {
  seedHex: string;
  hdWallet: any;
  keyPairs: MidnightKeyPair[];
}

export const MidnightRoles = [
  { name: 'NightExternal', value: Roles.NightExternal },
  { name: 'NightInternal', value: Roles.NightInternal },
  { name: 'Dust', value: Roles.Dust },
  { name: 'Zswap', value: Roles.Zswap },
  { name: 'Metadata', value: Roles.Metadata }
];

/**
 * Generate a new Midnight wallet from a random seed
 */
export const generateWallet = async (): Promise<MidnightWallet> => {
  const randomSeed = generateRandomSeed();
  return createWalletFromSeed(randomSeed);
};

/**
 * Create a Midnight wallet from an existing seed
 */
export const createWalletFromSeed = async (seed: Uint8Array): Promise<MidnightWallet> => {
  console.log('🏗️ Creating Midnight wallet from seed...');
  
  const seedHex = Array.from(seed)
    .map(b => b.toString(16).padStart(2, '0')).join('');
  console.log(`🎲 Seed: ${seedHex.substring(0, 16)}...`);

  console.log('🏦 Creating BIP-32 HD wallet...');
  const hdWalletResult = HDWallet.fromSeed(seed);
  if (hdWalletResult.type === 'seedError') {
    throw new Error(`HD wallet creation failed: ${hdWalletResult.error}`);
  }

  const hdWallet = hdWalletResult.hdWallet;
  const accountKey = hdWallet.selectAccount(0);
  const keyPairs: MidnightKeyPair[] = [];
  console.log('✅ BIP-32 HD wallet created');

  console.log('🔑 Generating key pairs for all Midnight roles...');
  for (const role of MidnightRoles) {
    console.log(`  → Processing ${role.name} role...`);
    
    const roleKey = accountKey.selectRole(role.value);
    const keyResult = roleKey.deriveKeyAt(0);
    
    if (keyResult.type !== 'keyDerived') {
      console.warn(`    ⚠️ Skipping ${role.name}: key derivation failed`);
      continue;
    }

    const hdSeedHex = Array.from(keyResult.key)
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const integratedKeys = await createIntegratedKeySet(keyResult.key, role.name);
    
    keyPairs.push({
      role: role.name,
      hdSeed: hdSeedHex,
      coinPublicKey: integratedKeys.ed25519.publicKey,
      coinSecretKey: integratedKeys.ed25519.privateKey,
      encryptionPublicKey: integratedKeys.x25519.publicKey,
      encryptionSecretKey: integratedKeys.x25519.privateKey,
    });
    
    console.log(`    ✅ ${role.name}: Ed25519 + X25519 keys generated`);
  }

  console.log(`🎉 Wallet created with ${keyPairs.length} key pairs`);
  return {
    seedHex,
    hdWallet,
    keyPairs
  };
};

/**
 * Get a specific key pair by role name
 */
export const getKeyPairByRole = (wallet: MidnightWallet, role: string): MidnightKeyPair | null => {
  return wallet.keyPairs.find(kp => kp.role === role) || null;
};

/**
 * Test wallet determinism by re-creating from the same seed
 */
export const testWalletConsistency = async (originalWallet: MidnightWallet): Promise<boolean> => {
  console.log('🔄 Testing wallet consistency...');
  console.log(`📊 Original wallet has ${originalWallet.keyPairs.length} key pairs`);

  try {
    console.log('🔧 Re-creating wallet from same seed...');
    const seedBytes = new Uint8Array(
      originalWallet.seedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const newWallet = await createWalletFromSeed(seedBytes);
    console.log(`📊 Regenerated wallet has ${newWallet.keyPairs.length} key pairs`);
    
    // Test first key pair consistency
    if (originalWallet.keyPairs.length === 0 || newWallet.keyPairs.length === 0) {
      console.log('❌ No key pairs to compare');
      return false;
    }

    const original = originalWallet.keyPairs[0];
    const regenerated = newWallet.keyPairs[0];

    console.log('🔍 Testing key consistency for first role:', original.role);
    
    const hdSeedMatch = original.hdSeed === regenerated.hdSeed;
    const coinKeyMatch = original.coinPublicKey === regenerated.coinPublicKey;
    const encKeyMatch = original.encryptionPublicKey === regenerated.encryptionPublicKey;
    
    console.log(`📝 HD Seed consistent: ${hdSeedMatch ? 'PASS' : 'FAIL'}`);
    console.log(`📝 Coin key consistent: ${coinKeyMatch ? 'PASS' : 'FAIL'}`);
    console.log(`📝 Encryption key consistent: ${encKeyMatch ? 'PASS' : 'FAIL'}`);
    
    if (hdSeedMatch && coinKeyMatch && encKeyMatch) {
      console.log('✅ WALLET CONSISTENCY TEST PASSED - Keys are deterministic!');
      return true;
    } else {
      console.log('❌ WALLET CONSISTENCY TEST FAILED - Keys are not deterministic!');
      return false;
    }

  } catch (error) {
    console.error('❌ Wallet consistency test failed with error:', error);
    return false;
  }
};

/**
 * Export wallet for storage (without private keys)
 */
export const exportWalletPublic = (wallet: MidnightWallet) => {
  return {
    seedHex: wallet.seedHex,
    keyPairs: wallet.keyPairs.map(kp => ({
      role: kp.role,
      hdSeed: kp.hdSeed,
      coinPublicKey: kp.coinPublicKey,
      encryptionPublicKey: kp.encryptionPublicKey
    }))
  };
};

/**
 * Get wallet statistics
 */
export const getWalletStats = (wallet: MidnightWallet) => {
  return {
    seedLength: wallet.seedHex.length / 2, // bytes
    totalKeyPairs: wallet.keyPairs.length,
    availableRoles: wallet.keyPairs.map(kp => kp.role),
    hasValidKeys: wallet.keyPairs.every(kp => 
      kp.coinPublicKey.length > 0 && kp.encryptionPublicKey.length > 0
    )
  };
};