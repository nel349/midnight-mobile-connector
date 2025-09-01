/**
 * Tests for Address Generation (Step 4 functionality)
 * 
 * Tests the WORKING address generation that's used in components/Step4_AddressGeneration.tsx
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateWalletAddresses, type MidnightAddress, MidnightNetworks } from '../../lib/addressGeneration';
import { generateWallet, type MidnightWallet } from '../../lib/midnightWallet';

describe('Address Generation (Step 4)', () => {
  let wallet: MidnightWallet;

  beforeAll(async () => {
    // Set up crypto and generate test wallet
    const { setupCrypto } = await import('../../lib/cryptoSetup');
    setupCrypto();
    wallet = await generateWallet();
  });

  describe('generateWalletAddresses()', () => {
    it('should generate TestNet addresses', async () => {
      const addresses = await generateWalletAddresses(wallet.keyPairs, 'TestNet');
      
      expect(addresses).toBeInstanceOf(Array);
      expect(addresses.length).toBeGreaterThan(0);
      
      addresses.forEach(addr => {
        expect(addr.role).toBeDefined();
        expect(addr.address).toMatch(/^mn_shield-addr_test1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/);
        expect(addr.network).toBe('test'); // Network uses lowercase name
        expect(addr.coinPublicKey).toMatch(/^[0-9a-f]+$/);
        expect(addr.encryptionPublicKey).toMatch(/^[0-9a-f]+$/);
      });
    });

    it('should generate MainNet addresses', async () => {
      const addresses = await generateWalletAddresses(wallet.keyPairs, 'MainNet');
      
      expect(addresses).toBeInstanceOf(Array);
      expect(addresses.length).toBeGreaterThan(0);
      
      addresses.forEach(addr => {
        expect(addr.address).toMatch(/^mn_shield-addr_mainnet1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/);
        expect(addr.network).toBe('mainnet'); // Network uses lowercase name
      });
    });

    it('should generate DevNet addresses', async () => {
      const addresses = await generateWalletAddresses(wallet.keyPairs, 'DevNet');
      
      addresses.forEach(addr => {
        expect(addr.address).toMatch(/^mn_shield-addr_dev1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/);
        expect(addr.network).toBe('dev'); // Network uses lowercase name
      });
    });

    it('should generate Undeployed addresses', async () => {
      const addresses = await generateWalletAddresses(wallet.keyPairs, 'Undeployed');
      
      addresses.forEach(addr => {
        expect(addr.address).toMatch(/^mn_shield-addr_undeployed1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/);
        expect(addr.network).toBe('undeployed'); // Network uses lowercase name
      });
    });
  });

  describe('Network Support', () => {
    it('should have all expected networks defined', () => {
      expect(MidnightNetworks.TestNet).toBeDefined();
      expect(MidnightNetworks.MainNet).toBeDefined();
      expect(MidnightNetworks.DevNet).toBeDefined();
      expect(MidnightNetworks.Undeployed).toBeDefined();
      
      // Check network configuration structure
      Object.values(MidnightNetworks).forEach(network => {
        expect(network.id).toBeDefined();
        expect(network.name).toBeDefined();
        expect(typeof network.id).toBe('number');
        expect(typeof network.name).toBe('string');
      });
    });

    it('should generate different addresses for different networks', async () => {
      const testNetAddresses = await generateWalletAddresses(wallet.keyPairs, 'TestNet');
      const mainNetAddresses = await generateWalletAddresses(wallet.keyPairs, 'MainNet');
      
      // Same role should have different addresses on different networks
      const testNetRole = testNetAddresses[0];
      const mainNetRole = mainNetAddresses.find(addr => addr.role === testNetRole.role);
      
      expect(mainNetRole).toBeDefined();
      expect(testNetRole.address).not.toBe(mainNetRole!.address);
      expect(testNetRole.coinPublicKey).toBe(mainNetRole!.coinPublicKey); // Same keys
      expect(testNetRole.encryptionPublicKey).toBe(mainNetRole!.encryptionPublicKey); // Same keys
    });
  });

  describe('Address Structure', () => {
    let addresses: MidnightAddress[];

    beforeAll(async () => {
      addresses = await generateWalletAddresses(wallet.keyPairs, 'TestNet');
    });

    it('should have consistent structure across all addresses', () => {
      addresses.forEach(addr => {
        expect(addr).toHaveProperty('role');
        expect(addr).toHaveProperty('address'); 
        expect(addr).toHaveProperty('network');
        expect(addr).toHaveProperty('coinPublicKey');
        expect(addr).toHaveProperty('encryptionPublicKey');
        
        expect(typeof addr.role).toBe('string');
        expect(typeof addr.address).toBe('string');
        expect(typeof addr.network).toBe('string');
        expect(typeof addr.coinPublicKey).toBe('string');
        expect(typeof addr.encryptionPublicKey).toBe('string');
      });
    });

    it('should maintain role consistency', () => {
      const walletRoles = wallet.keyPairs.map(kp => kp.role);
      const addressRoles = addresses.map(addr => addr.role);
      
      expect(addressRoles).toEqual(walletRoles);
    });
  });

  describe('Deterministic Generation', () => {
    it('should generate identical addresses from same wallet', async () => {
      const addresses1 = await generateWalletAddresses(wallet.keyPairs, 'TestNet');
      const addresses2 = await generateWalletAddresses(wallet.keyPairs, 'TestNet');
      
      expect(addresses1.length).toBe(addresses2.length);
      
      addresses1.forEach((addr1, index) => {
        const addr2 = addresses2[index];
        expect(addr1.address).toBe(addr2.address);
        expect(addr1.role).toBe(addr2.role);
        expect(addr1.coinPublicKey).toBe(addr2.coinPublicKey);
        expect(addr1.encryptionPublicKey).toBe(addr2.encryptionPublicKey);
      });
    });
  });
});