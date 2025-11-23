/**
 * Lace-Compatible Address Generation
 * 
 * Generates addresses exactly like Lace wallet does:
 * - Uses ONLY NightExternal role (first role)
 * - Uses index 0 for address generation
 * - Creates ONE address per wallet (not 5)
 * - Compatible with official @midnight-ntwrk/wallet-sdk-address-format
 */

import { MidnightKeyPair } from './midnightWallet';
import { NetworkType } from './networkConnection';

// Try to import official SDK first
let ShieldedAddress: any = null;
let ShieldedCoinPublicKey: any = null;
let ShieldedEncryptionPublicKey: any = null;

try {
  const addressFormat = require('@midnight-ntwrk/wallet-sdk-address-format');
  ShieldedAddress = addressFormat.ShieldedAddress;
  ShieldedCoinPublicKey = addressFormat.ShieldedCoinPublicKey;
  ShieldedEncryptionPublicKey = addressFormat.ShieldedEncryptionPublicKey;
  console.log('🏠 ✅ Using official @midnight-ntwrk/wallet-sdk-address-format');
} catch (error) {
  console.log('🏠 ⚠️ Official address format not available, falling back to custom implementation');
}

export interface LaceCompatibleAddress {
  address: string;
  coinPublicKey: string;
  encryptionPublicKey: string;
  network: string;
}

/**
 * Generate single address like Lace wallet does
 * Uses only NightExternal role at index 0
 */
export const generateLaceCompatibleAddress = async (
  nightExternalKeyPair: MidnightKeyPair,
  networkType: NetworkType = 'testnet'
): Promise<LaceCompatibleAddress> => {
  console.log(`🏠 Generating Lace-compatible ${networkType} address...`);
  
  if (nightExternalKeyPair.role !== 'NightExternal') {
    throw new Error('Lace-compatible address generation requires NightExternal role key pair');
  }

  const result = await generateMidnightAddressLaceStyle(nightExternalKeyPair, networkType);
  console.log(`✅ Generated Lace-compatible address: ${result.address.substring(0, 50)}...`);
  
  return result;
};

/**
 * Generate address using official SDK or fallback method
 */
async function generateMidnightAddressLaceStyle(
  keyPair: MidnightKeyPair,
  networkType: NetworkType = 'testnet'
): Promise<LaceCompatibleAddress> {
  
  if (ShieldedAddress && ShieldedCoinPublicKey && ShieldedEncryptionPublicKey) {
    return generateWithOfficialSDK(keyPair, networkType);
  } else {
    return generateWithFallbackMethod(keyPair, networkType);
  }
}

/**
 * Generate using official Midnight SDK (preferred method)
 */
function generateWithOfficialSDK(
  keyPair: MidnightKeyPair,
  networkType: NetworkType = 'testnet'
): LaceCompatibleAddress {
  console.log('🏠 Using official Midnight SDK for address generation');
  
  // Convert hex keys to Buffer
  const coinPubKeyBuffer = Buffer.from(keyPair.coinPublicKey, 'hex');
  const encPubKeyBuffer = Buffer.from(keyPair.encryptionPublicKey, 'hex');
  
  // Create official SDK objects
  const coinPublicKey = new ShieldedCoinPublicKey(coinPubKeyBuffer);
  const encryptionPublicKey = new ShieldedEncryptionPublicKey(encPubKeyBuffer);
  const shieldedAddress = new ShieldedAddress(coinPublicKey, encryptionPublicKey);
  
  // Get network ID for encoding
  const networkId = getOfficialNetworkId(networkType);
  
  // Encode address using official codec
  const bech32Address = ShieldedAddress.codec.encode(networkId, shieldedAddress);
  
  return {
    address: bech32Address.asString(),
    coinPublicKey: keyPair.coinPublicKey,
    encryptionPublicKey: keyPair.encryptionPublicKey,
    network: networkType.toLowerCase()
  };
}

/**
 * Generate using custom implementation (fallback)
 */
async function generateWithFallbackMethod(
  keyPair: MidnightKeyPair,
  networkType: NetworkType = 'testnet'
): Promise<LaceCompatibleAddress> {
  console.log('🏠 Using fallback address generation method');
  
  // Convert NetworkType to MidnightNetworks key format
  const addressGenNetworkType = convertToAddressGenNetworkType(networkType);
  
  // Import our existing fallback implementation
  const { generateMidnightAddress } = await import('./addressGeneration');
  const result = await generateMidnightAddress(keyPair, addressGenNetworkType);
  
  return {
    address: result.address,
    coinPublicKey: result.coinPublicKey,
    encryptionPublicKey: result.encryptionPublicKey,
    network: result.network
  };
}

/**
 * Convert NetworkType to MidnightNetworks key format
 */
function convertToAddressGenNetworkType(networkType: NetworkType): 'TestNet' | 'Undeployed' | 'MainNet' {
  switch (networkType) {
    case 'testnet': return 'TestNet';
    case 'undeployed': return 'Undeployed';
    case 'mainnet': return 'MainNet';
    default: return 'TestNet';
  }
}

/**
 * Get network ID for official SDK
 */
function getOfficialNetworkId(networkType: string) {
  // Import NetworkId enum from zswap if available
  try {
    const { NetworkId } = require('@midnight-ntwrk/zswap');
    switch (networkType.toLowerCase()) {
      case 'testnet': return NetworkId.TestNet;
      case 'mainnet': return NetworkId.MainNet;
      case 'devnet': return NetworkId.DevNet;
      case 'undeployed': return NetworkId.Undeployed;
      default: return NetworkId.TestNet;
    }
  } catch (error) {
    // Fallback to string-based network IDs
    return networkType.toLowerCase();
  }
}

/**
 * Create Lace-compatible wallet with single address
 * This matches the official Wallet API structure
 */
export interface LaceCompatibleWallet {
  address: string;
  coinPublicKey: string;
  encryptionPublicKey: string;
  network: string;
  // Include the key pair for transaction signing
  keyPair: MidnightKeyPair;
}

/**
 * Create a wallet structure that matches Lace/official Midnight wallet
 */
export const createLaceCompatibleWallet = async (
  nightExternalKeyPair: MidnightKeyPair,
  networkType: NetworkType = 'testnet'
): Promise<LaceCompatibleWallet> => {
  console.log('🏦 Creating Lace-compatible wallet...');
  
  const addressInfo = await generateLaceCompatibleAddress(nightExternalKeyPair, networkType);
  
  const wallet: LaceCompatibleWallet = {
    address: addressInfo.address,
    coinPublicKey: addressInfo.coinPublicKey,
    encryptionPublicKey: addressInfo.encryptionPublicKey,
    network: addressInfo.network,
    keyPair: nightExternalKeyPair
  };
  
  console.log(`✅ Created Lace-compatible wallet with address: ${wallet.address}`);
  return wallet;
};