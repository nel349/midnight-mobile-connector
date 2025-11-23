/**
 * Tests for HD Wallet Generation (Step 3 functionality)
 * 
 * Tests the WORKING wallet generation that's used in components/Step3_KeyDerivation.tsx
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateWallet, createWalletFromSeed, getWalletStats, type MidnightWallet } from '../../lib/midnightWallet';
import { generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';

describe('HD Wallet Generation (Step 3)', () => {
  beforeAll(async () => {
    // Ensure crypto is set up
    const { setupCrypto } = await import('../../lib/cryptoSetup');
    setupCrypto();
  });

  describe('generateWallet()', () => {
    it('should generate a wallet with random seed', async () => {
      const wallet = await generateWallet();
      
      expect(wallet).toBeDefined();
      expect(wallet.seedHex).toMatch(/^[0-9a-f]{64}$/); // 32 bytes as hex
      expect(wallet.hdWallet).toBeDefined();
      expect(wallet.keyPairs).toBeInstanceOf(Array);
      expect(wallet.keyPairs.length).toBeGreaterThan(0);
    });

    it('should generate different wallets each time', async () => {
      const wallet1 = await generateWallet();
      const wallet2 = await generateWallet();
      
      expect(wallet1.seedHex).not.toBe(wallet2.seedHex);
      expect(wallet1.keyPairs[0].coinPublicKey).not.toBe(wallet2.keyPairs[0].coinPublicKey);
    });
  });

  describe('createWalletFromSeed()', () => {
    it('should create wallet from existing seed', async () => {
      const originalSeed = generateRandomSeed();
      const wallet = await createWalletFromSeed(originalSeed);
      
      expect(wallet).toBeDefined();
      expect(wallet.seedHex).toMatch(/^[0-9a-f]{64}$/);
      expect(wallet.keyPairs.length).toBeGreaterThan(0);
    });

    it('should create identical wallets from same seed', async () => {
      const seed = generateRandomSeed();
      const wallet1 = await createWalletFromSeed(seed);
      const wallet2 = await createWalletFromSeed(seed);
      
      expect(wallet1.seedHex).toBe(wallet2.seedHex);
      expect(wallet1.keyPairs[0].coinPublicKey).toBe(wallet2.keyPairs[0].coinPublicKey);
      expect(wallet1.keyPairs[0].encryptionPublicKey).toBe(wallet2.keyPairs[0].encryptionPublicKey);
    });
  });

  describe('Key Pairs', () => {
    let wallet: MidnightWallet;

    beforeAll(async () => {
      wallet = await generateWallet();
    });

    it('should generate key pair for NightExternal role (Lace compatible)', () => {
      // After Lace compatibility changes, we only generate NightExternal role
      expect(wallet.keyPairs.length).toBe(1);
      
      // Check that we have the NightExternal role (the only one Lace uses)
      const roleNames = wallet.keyPairs.map(kp => kp.role);
      expect(roleNames).toContain('NightExternal');
      expect(roleNames[0]).toBe('NightExternal');
    });

    it('should have valid Ed25519 coin keys', () => {
      wallet.keyPairs.forEach(keyPair => {
        expect(keyPair.coinPublicKey).toMatch(/^[0-9a-f]+$/);
        expect(keyPair.coinPublicKey.length).toBeGreaterThan(0);
        expect(keyPair.coinSecretKey).toBeDefined();
      });
    });

    it('should have valid X25519 encryption keys', () => {
      wallet.keyPairs.forEach(keyPair => {
        expect(keyPair.encryptionPublicKey).toMatch(/^[0-9a-f]+$/);
        expect(keyPair.encryptionPublicKey.length).toBeGreaterThan(0);
        expect(keyPair.encryptionSecretKey).toBeDefined();
      });
    });
  });

  describe('getWalletStats()', () => {
    it('should provide accurate wallet statistics', async () => {
      const wallet = await generateWallet();
      const stats = getWalletStats(wallet);
      
      expect(stats.totalKeyPairs).toBe(wallet.keyPairs.length);
      expect(stats.availableRoles).toBeInstanceOf(Array);
      expect(stats.availableRoles.length).toBe(wallet.keyPairs.length);
      expect(stats.hasValidKeys).toBe(true);
      
      // All roles should be strings
      stats.availableRoles.forEach(role => {
        expect(typeof role).toBe('string');
      });
    });
  });
});