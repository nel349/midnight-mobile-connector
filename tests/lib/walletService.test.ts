/**
 * Tests for WalletManager - Multi-wallet storage and management
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NETWORK_TYPES } from '../../lib/constants';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock fetch for network calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WalletManager Integration', () => {
  beforeEach(() => {
    // Reset AsyncStorage mocks
    vi.clearAllMocks();
    (AsyncStorage.getItem as any).mockResolvedValue(null);
    (AsyncStorage.setItem as any).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as any).mockResolvedValue(undefined);
  });
  
  beforeAll(() => {
    // Mock successful contract responses
    mockFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        data: {
          contractAction: {
            __typename: 'ContractCall',
            address: 'test_address',
            transaction: { hash: 'test_hash' }
          }
        }
      })
    }));
  });

  describe('WalletManager initialization', () => {
    it('should initialize wallet manager', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      expect(manager).toBeDefined();
      expect(typeof manager.createWallet).toBe('function');
      expect(typeof manager.importWallet).toBe('function');
      expect(typeof manager.getActiveWallet).toBe('function');
      expect(typeof manager.getAllWallets).toBe('function');
    });
  });

  describe('WalletManager.createWallet()', () => {
    it('should create a new wallet', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      const storedWallet = await manager.createWallet('Test Wallet', NETWORK_TYPES.TESTNET);
      
      expect(storedWallet).toBeDefined();
      expect(storedWallet.metadata).toBeDefined();
      expect(storedWallet.wallet).toBeDefined();
      expect(storedWallet.metadata.name).toBe('Test Wallet');
      expect(storedWallet.metadata.network).toBe(NETWORK_TYPES.TESTNET);
      expect(storedWallet.metadata.isDefault).toBe(true); // First wallet
      
      // Should have wallet with key pairs
      expect(storedWallet.wallet.keyPairs).toBeDefined();
      expect(storedWallet.wallet.keyPairs.length).toBeGreaterThan(0);
      expect(storedWallet.wallet.seedHex).toBeDefined();
    });

    it('should set first wallet as active', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      const storedWallet = await manager.createWallet('First Wallet', NETWORK_TYPES.TESTNET);
      const activeWallet = manager.getActiveWallet();
      
      expect(activeWallet).toBeDefined();
      expect(activeWallet!.metadata.id).toBe(storedWallet.metadata.id);
    });

    it('should respect wallet limit', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      // Create 5 wallets (the limit)
      for (let i = 1; i <= 5; i++) {
        await manager.createWallet(`Wallet ${i}`, NETWORK_TYPES.TESTNET);
      }
      
      // 6th wallet should fail
      await expect(
        manager.createWallet('Wallet 6', NETWORK_TYPES.TESTNET)
      ).rejects.toThrow('Maximum 5 wallets allowed');
    });
  });

  describe('WalletManager.importWallet()', () => {
    it('should import wallet from seed bytes', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      const { generateRandomSeed } = await import('@midnight-ntwrk/wallet-sdk-hd');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      // Generate a seed to import
      const seedBytes = generateRandomSeed();
      
      const importedWallet = await manager.importWallet('Imported Wallet', seedBytes, NETWORK_TYPES.TESTNET);
      
      expect(importedWallet).toBeDefined();
      expect(importedWallet.metadata.name).toBe('Imported Wallet');
      expect(importedWallet.wallet).toBeDefined();
      expect(importedWallet.wallet.keyPairs.length).toBeGreaterThan(0);
      expect(importedWallet.wallet.seedHex).toBeDefined();
    });
  });

  describe('WalletManager.setActiveWallet()', () => {
    it('should switch active wallet', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      // Create two wallets
      const wallet1 = await manager.createWallet('Wallet 1', NETWORK_TYPES.TESTNET);
      const wallet2 = await manager.createWallet('Wallet 2', NETWORK_TYPES.TESTNET);
      
      // Initially, wallet1 should be active (first wallet)
      expect(manager.getActiveWallet()!.metadata.id).toBe(wallet1.metadata.id);
      
      // Switch to wallet2
      await manager.setActiveWallet(wallet2.metadata.id);
      expect(manager.getActiveWallet()!.metadata.id).toBe(wallet2.metadata.id);
    });
  });

  describe('WalletManager.deleteWallet()', () => {
    it('should delete a wallet', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      // Create two wallets
      const wallet1 = await manager.createWallet('Wallet 1', NETWORK_TYPES.TESTNET);
      const wallet2 = await manager.createWallet('Wallet 2', NETWORK_TYPES.TESTNET);
      
      expect(manager.getAllWallets().length).toBe(2);
      
      // Delete wallet2
      await manager.deleteWallet(wallet2.metadata.id);
      
      expect(manager.getAllWallets().length).toBe(1);
      expect(manager.getAllWallets()[0].metadata.id).toBe(wallet1.metadata.id);
    });

    it('should update active wallet when deleting active wallet', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      // Create two wallets
      const wallet1 = await manager.createWallet('Wallet 1', NETWORK_TYPES.TESTNET);
      const wallet2 = await manager.createWallet('Wallet 2', NETWORK_TYPES.TESTNET);
      
      // Switch to wallet2
      await manager.setActiveWallet(wallet2.metadata.id);
      expect(manager.getActiveWallet()!.metadata.id).toBe(wallet2.metadata.id);
      
      // Delete active wallet (wallet2)
      await manager.deleteWallet(wallet2.metadata.id);
      
      // Should fall back to wallet1
      expect(manager.getActiveWallet()!.metadata.id).toBe(wallet1.metadata.id);
    });
  });

  describe('WalletManager.updateWallet()', () => {
    it('should update wallet metadata', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      const wallet = await manager.createWallet('Original Name', NETWORK_TYPES.TESTNET);
      
      // Update wallet name
      await manager.updateWallet(wallet.metadata.id, {
        name: 'Updated Name'
      });
      
      const updatedWallet = manager.getActiveWallet();
      expect(updatedWallet!.metadata.name).toBe('Updated Name');
    });
  });

  describe('WalletManager storage', () => {
    it('should save and load wallet store', async () => {
      const { WalletManager } = await import('../../lib/walletManager');
      
      const manager = new WalletManager();
      await manager.initialize();
      
      await manager.createWallet('Test Wallet', NETWORK_TYPES.TESTNET);
      
      // Verify AsyncStorage was called
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});