/**
 * Tests for WalletService - Integration of HD wallet and Contract Platform
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock fetch for network calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WalletService Integration', () => {
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

  describe('createWalletService()', () => {
    it('should create a wallet service instance', async () => {
      const { createWalletService } = await import('../../lib/walletService');
      
      const service = createWalletService({
        networkType: 'local'
      });
      
      expect(service).toBeDefined();
      expect(typeof service.createWallet).toBe('function');
      expect(typeof service.restoreWallet).toBe('function');
    });
  });

  describe('WalletService.createWallet()', () => {
    it('should create an integrated wallet', async () => {
      const { createWalletService } = await import('../../lib/walletService');
      
      const service = createWalletService({
        networkType: 'local'
      });
      
      const integratedWallet = await service.createWallet();
      
      expect(integratedWallet).toBeDefined();
      expect(integratedWallet.wallet).toBeDefined();
      expect(integratedWallet.addresses).toBeDefined();
      expect(integratedWallet.providers).toBeDefined();
      expect(integratedWallet.config).toBeDefined();
      
      // Should have addresses for all networks
      expect(integratedWallet.addresses.testnet).toBeInstanceOf(Array);
      expect(integratedWallet.addresses.mainnet).toBeInstanceOf(Array);
      expect(integratedWallet.addresses.devnet).toBeInstanceOf(Array);
      expect(integratedWallet.addresses.undeployed).toBeInstanceOf(Array);
      
      // Should have providers
      expect(integratedWallet.providers.publicDataProvider).toBeDefined();
      expect(integratedWallet.providers.contractQuerier).toBeDefined();
    });

    it('should create wallet with contract executor when address provided', async () => {
      const { createWalletService } = await import('../../lib/walletService');
      const { DEFAULT_CONTRACT_ADDRESS } = await import('../../lib/constants');
      
      const service = createWalletService({
        networkType: 'local',
        contractAddress: DEFAULT_CONTRACT_ADDRESS
      });
      
      const integratedWallet = await service.createWallet();
      
      expect(integratedWallet.contractExecutor).toBeDefined();
      expect(typeof integratedWallet.contractExecutor!.executeCircuit).toBe('function');
    });
  });

  describe('WalletService.restoreWallet()', () => {
    it('should restore wallet from seed hex', async () => {
      const { createWalletService } = await import('../../lib/walletService');
      
      const service = createWalletService({
        networkType: 'local'
      });
      
      // First create a wallet to get a seed
      const originalWallet = await service.createWallet();
      const seedHex = originalWallet.wallet.seedHex;
      
      // Then restore from that seed
      const restoredWallet = await service.restoreWallet(seedHex);
      
      expect(restoredWallet).toBeDefined();
      expect(restoredWallet.wallet.seedHex).toBe(originalWallet.wallet.seedHex);
      
      // Should have same key pairs
      expect(restoredWallet.wallet.keyPairs.length).toBe(originalWallet.wallet.keyPairs.length);
      
      // Should have same addresses
      expect(restoredWallet.addresses.testnet[0].address).toBe(originalWallet.addresses.testnet[0].address);
    });
  });

  describe('WalletService.getBalance()', () => {
    it('should have addresses structure', async () => {
      const { createWalletService } = await import('../../lib/walletService');
      
      const service = createWalletService({
        networkType: 'local'
      });
      
      const integratedWallet = await service.createWallet();
      
      // Check that we have addresses structure
      expect(integratedWallet.addresses).toBeDefined();
      expect(integratedWallet.addresses.undeployed).toBeDefined();
      expect(integratedWallet.addresses.testnet).toBeDefined();
      expect(integratedWallet.addresses.mainnet).toBeDefined();
      expect(integratedWallet.addresses.devnet).toBeDefined();
    });
  });

  describe('WalletService.executeCircuit()', () => {
    it('should execute circuit when contract executor available', async () => {
      const { createWalletService } = await import('../../lib/walletService');
      const { DEFAULT_CONTRACT_ADDRESS } = await import('../../lib/constants');
      
      const service = createWalletService({
        networkType: 'local',
        contractAddress: DEFAULT_CONTRACT_ADDRESS
      });
      
      const integratedWallet = await service.createWallet();
      
      // Execute get_contract_name circuit (known to work)
      const result = await service.executeCircuit(integratedWallet, 'get_contract_name');
      
      expect(result).toBeDefined();
    });

    it('should throw error when contract executor not available', async () => {
      const { createWalletService } = await import('../../lib/walletService');
      
      const service = createWalletService({
        networkType: 'local'
        // No contractAddress provided
      });
      
      const integratedWallet = await service.createWallet();
      
      await expect(
        service.executeCircuit(integratedWallet, 'get_contract_name')
      ).rejects.toThrow('Contract executor not configured');
    });
  });

  describe('WalletService.getWalletSummary()', () => {
    it('should provide wallet summary', async () => {
      const { createWalletService } = await import('../../lib/walletService');
      const { DEFAULT_CONTRACT_ADDRESS } = await import('../../lib/constants');
      
      const service = createWalletService({
        networkType: 'local',
        contractAddress: DEFAULT_CONTRACT_ADDRESS
      });
      
      const integratedWallet = await service.createWallet();
      const summary = service.getWalletSummary(integratedWallet);
      
      expect(summary).toBeDefined();
      expect(summary.seedHex).toBeDefined();
      expect(summary.keyPairs).toBeGreaterThan(0);
      expect(summary.addresses).toBeGreaterThan(0);
      expect(summary.network).toBe('local');
      expect(summary.hasContractExecutor).toBe(true);
      expect(summary.primaryAddress).toBeDefined();
      expect(summary.roles).toBeInstanceOf(Array);
    });
  });
});