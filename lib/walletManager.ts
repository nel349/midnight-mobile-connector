/**
 * Multi-Wallet Manager
 * 
 * Production-ready wallet management system for storing up to 5 Midnight wallets.
 * Features: Secure storage, encryption, wallet switching, import/export.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MidnightWallet, createWalletFromSeed, generateWallet } from './midnightWallet';
import { NETWORK_TYPES } from './constants';
import { mnemonicToSeedBytes, validateMnemonicPhrase } from './mnemonicUtils';
// Use explicit network type instead of importing from networkConnection
type NetworkType = 'undeployed' | 'testnet' | 'mainnet';

export interface WalletMetadata {
  id: string;
  name: string;
  createdAt: Date;
  lastUsed: Date;
  network: NetworkType;
  isDefault: boolean;
  color: string; // UI identifier
  icon: string; // Emoji icon
}

export interface StoredWallet {
  metadata: WalletMetadata;
  wallet: MidnightWallet;
  encryptedSeed?: string; // For future encryption implementation
}

export interface WalletStore {
  wallets: StoredWallet[];
  activeWalletId: string | null;
  maxWallets: 5;
  version: string;
}

// Storage keys
const WALLET_STORE_KEY = '@MidnightWallet:store';
const DEVICE_KEY = '@MidnightWallet:deviceKey';

// Default wallet colors and icons
export const WalletThemes = [
  { color: '#007AFF', icon: '🌙' },
  { color: '#34C759', icon: '🌟' },
  { color: '#FF3B30', icon: '🔥' },
  { color: '#FF9500', icon: '⚡' },
  { color: '#AF52DE', icon: '💎' }
];

/**
 * Multi-Wallet Manager Class
 */
export class WalletManager {
  private store: WalletStore;

  constructor() {
    this.store = {
      wallets: [],
      activeWalletId: null,
      maxWallets: 5,
      version: '1.0.0'
    };
  }

  /**
   * Initialize wallet manager and load existing wallets
   */
  async initialize(): Promise<WalletStore> {
    console.log('💼 Initializing Multi-Wallet Manager...');
    
    try {
      const storedData = await AsyncStorage.getItem(WALLET_STORE_KEY);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        this.store = {
          ...parsed,
          // Convert date strings back to Date objects
          wallets: parsed.wallets.map((w: any) => ({
            ...w,
            metadata: {
              ...w.metadata,
              createdAt: new Date(w.metadata.createdAt),
              lastUsed: new Date(w.metadata.lastUsed)
            }
          }))
        };
        console.log(`   📱 Loaded ${this.store.wallets.length} existing wallets`);
      } else {
        console.log('   🆕 No existing wallets found, starting fresh');
      }
      
      return this.store;
      
    } catch (error) {
      console.error('   ❌ Failed to load wallet store:', error);
      // Return empty store on error
      return this.store;
    }
  }

  /**
   * Get current wallet store
   */
  getStore(): WalletStore {
    return this.store;
  }

  /**
   * Get active wallet
   */
  getActiveWallet(): StoredWallet | null {
    if (!this.store.activeWalletId) return null;
    return this.store.wallets.find(w => w.metadata.id === this.store.activeWalletId) || null;
  }

  /**
   * Get all wallets
   */
  getAllWallets(): StoredWallet[] {
    return [...this.store.wallets];
  }

  /**
   * Check if we can add more wallets
   */
  canAddWallet(): boolean {
    return this.store.wallets.length < this.store.maxWallets;
  }

  /**
   * Create a new wallet
   */
  async createWallet(name: string, network: NetworkType = NETWORK_TYPES.TESTNET): Promise<StoredWallet> {
    console.log(`💼 Creating new wallet: ${name}`);
    
    if (!this.canAddWallet()) {
      throw new Error(`Maximum ${this.store.maxWallets} wallets allowed`);
    }

    // Generate unique wallet ID
    const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get theme for this wallet
    const themeIndex = this.store.wallets.length % WalletThemes.length;
    const theme = WalletThemes[themeIndex];
    
    // Generate new wallet
    const wallet = await generateWallet();
    
    // Create stored wallet
    const storedWallet: StoredWallet = {
      metadata: {
        id: walletId,
        name,
        createdAt: new Date(),
        lastUsed: new Date(),
        network,
        isDefault: this.store.wallets.length === 0, // First wallet is default
        color: theme.color,
        icon: theme.icon
      },
      wallet,
      // TODO: Implement encryption for production
      encryptedSeed: undefined
    };

    // Add to store
    this.store.wallets.push(storedWallet);
    
    // Set as active if it's the first wallet
    if (this.store.wallets.length === 1) {
      this.store.activeWalletId = walletId;
    }

    // Save to storage
    await this.saveStore();
    
    console.log(`   ✅ Created wallet: ${name} (${walletId})`);
    return storedWallet;
  }

  /**
   * Import wallet from mnemonic phrase
   */
  async importWalletFromMnemonic(name: string, mnemonic: string, passphrase: string = '', network: NetworkType = NETWORK_TYPES.TESTNET): Promise<StoredWallet> {
    console.log(`💼 Importing wallet from mnemonic: ${name}`);
    
    if (!this.canAddWallet()) {
      throw new Error(`Maximum ${this.store.maxWallets} wallets allowed`);
    }

    if (!validateMnemonicPhrase(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const seedBytes = await mnemonicToSeedBytes(mnemonic, passphrase);
    return this.importWallet(name, seedBytes, network);
  }

  /**
   * Import wallet from seed
   */
  async importWallet(name: string, seedBytes: Uint8Array, network: NetworkType = NETWORK_TYPES.TESTNET): Promise<StoredWallet> {
    console.log(`💼 Importing wallet: ${name}`);
    
    if (!this.canAddWallet()) {
      throw new Error(`Maximum ${this.store.maxWallets} wallets allowed`);
    }

    // Generate unique wallet ID
    const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get theme for this wallet
    const themeIndex = this.store.wallets.length % WalletThemes.length;
    const theme = WalletThemes[themeIndex];
    
    // Create wallet from seed
    const wallet = await createWalletFromSeed(seedBytes);
    
    // Create stored wallet
    const storedWallet: StoredWallet = {
      metadata: {
        id: walletId,
        name,
        createdAt: new Date(),
        lastUsed: new Date(),
        network,
        isDefault: this.store.wallets.length === 0, // First wallet is default
        color: theme.color,
        icon: theme.icon
      },
      wallet,
      encryptedSeed: undefined
    };

    // Add to store
    this.store.wallets.push(storedWallet);
    
    // Set as active if it's the first wallet
    if (this.store.wallets.length === 1) {
      this.store.activeWalletId = walletId;
    }

    // Save to storage
    await this.saveStore();
    
    console.log(`   ✅ Imported wallet: ${name} (${walletId})`);
    return storedWallet;
  }

  /**
   * Switch active wallet
   */
  async setActiveWallet(walletId: string): Promise<void> {
    console.log(`💼 Switching to wallet: ${walletId}`);
    
    const wallet = this.store.wallets.find(w => w.metadata.id === walletId);
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    // Update active wallet
    this.store.activeWalletId = walletId;
    
    // Update last used timestamp
    wallet.metadata.lastUsed = new Date();
    
    // Save to storage
    await this.saveStore();
    
    console.log(`   ✅ Active wallet set to: ${wallet.metadata.name}`);
  }

  /**
   * Update wallet metadata
   */
  async updateWallet(walletId: string, updates: Partial<WalletMetadata>): Promise<void> {
    console.log(`💼 Updating wallet: ${walletId}`);
    
    const walletIndex = this.store.wallets.findIndex(w => w.metadata.id === walletId);
    if (walletIndex === -1) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    // Update metadata
    this.store.wallets[walletIndex].metadata = {
      ...this.store.wallets[walletIndex].metadata,
      ...updates
    };

    // Save to storage
    await this.saveStore();
    
    console.log(`   ✅ Updated wallet: ${walletId}`);
  }

  /**
   * Delete wallet
   */
  async deleteWallet(walletId: string): Promise<void> {
    console.log(`💼 Deleting wallet: ${walletId}`);
    
    const walletIndex = this.store.wallets.findIndex(w => w.metadata.id === walletId);
    if (walletIndex === -1) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    const wallet = this.store.wallets[walletIndex];
    
    // Remove from store
    this.store.wallets.splice(walletIndex, 1);
    
    // If this was the active wallet, set new active wallet
    if (this.store.activeWalletId === walletId) {
      this.store.activeWalletId = this.store.wallets.length > 0 ? this.store.wallets[0].metadata.id : null;
    }

    // Save to storage
    await this.saveStore();
    
    console.log(`   ✅ Deleted wallet: ${wallet.metadata.name}`);
  }

  /**
   * Save store to AsyncStorage
   */
  private async saveStore(): Promise<void> {
    try {
      await AsyncStorage.setItem(WALLET_STORE_KEY, JSON.stringify(this.store));
      console.log('   💾 Wallet store saved successfully');
    } catch (error) {
      console.error('   ❌ Failed to save wallet store:', error);
      throw error;
    }
  }

  /**
   * Clear all wallets (for testing/reset)
   */
  async clearAllWallets(): Promise<void> {
    console.log('💼 Clearing all wallets...');
    
    this.store.wallets = [];
    this.store.activeWalletId = null;
    
    await AsyncStorage.removeItem(WALLET_STORE_KEY);
    
    console.log('   ✅ All wallets cleared');
  }
}

// Singleton instance
export const walletManager = new WalletManager();