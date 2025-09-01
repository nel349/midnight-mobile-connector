/**
 * Tests for Crypto Setup (Step 1 functionality)
 * 
 * Tests the WORKING crypto polyfills that are used in components/Step1_BasicCrypto.tsx
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { setupCrypto, testCryptoPolyfill } from '../../lib/cryptoSetup';

describe('Crypto Setup (Step 1)', () => {
  beforeAll(() => {
    setupCrypto();
  });

  describe('setupCrypto()', () => {
    it('should set up crypto polyfill without errors', () => {
      expect(() => setupCrypto()).not.toThrow();
    });

    it('should make crypto.subtle available', () => {
      expect(crypto).toBeDefined();
      expect(crypto.subtle).toBeDefined();
      expect(typeof crypto.subtle.generateKey).toBe('function');
      expect(typeof crypto.subtle.sign).toBe('function');
      expect(typeof crypto.subtle.verify).toBe('function');
      expect(typeof crypto.subtle.exportKey).toBe('function');
      expect(typeof crypto.subtle.importKey).toBe('function');
    });

    it('should make crypto.getRandomValues available', () => {
      expect(typeof crypto.getRandomValues).toBe('function');
    });
  });

  describe('testCryptoPolyfill()', () => {
    it('should validate crypto polyfill functionality', async () => {
      const result = await testCryptoPolyfill();
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.ed25519KeyPair).toBeDefined();
      expect(result.x25519KeyPair).toBeDefined();
    });

    it('should generate valid Ed25519 key pairs', async () => {
      const result = await testCryptoPolyfill();
      const { ed25519KeyPair } = result;
      
      expect(ed25519KeyPair.publicKey).toBeDefined();
      expect(ed25519KeyPair.privateKey).toBeDefined();
      expect(ed25519KeyPair.publicKey.algorithm.name).toBe('Ed25519');
      expect(ed25519KeyPair.privateKey.algorithm.name).toBe('Ed25519');
    });

    it('should generate valid X25519 key pairs', async () => {
      const result = await testCryptoPolyfill();
      const { x25519KeyPair } = result;
      
      expect(x25519KeyPair.publicKey).toBeDefined();
      expect(x25519KeyPair.privateKey).toBeDefined();
      expect(x25519KeyPair.publicKey.algorithm.name).toBe('X25519');
      expect(x25519KeyPair.privateKey.algorithm.name).toBe('X25519');
    });
  });

  describe('Ed25519 Operations', () => {
    it('should generate unique key pairs', async () => {
      const keyPair1 = await crypto.subtle.generateKey(
        { name: 'Ed25519' },
        true,
        ['sign', 'verify']
      );

      const keyPair2 = await crypto.subtle.generateKey(
        { name: 'Ed25519' },
        true,
        ['sign', 'verify']
      );

      const pubKey1 = await crypto.subtle.exportKey('raw', (keyPair1 as CryptoKeyPair).publicKey);
      const pubKey2 = await crypto.subtle.exportKey('raw', (keyPair2 as CryptoKeyPair).publicKey);

      expect(new Uint8Array(pubKey1)).not.toEqual(new Uint8Array(pubKey2));
    });

    it('should sign and verify messages', async () => {
      const keyPair = await crypto.subtle.generateKey(
        { name: 'Ed25519' },
        true,
        ['sign', 'verify']
      );

      const message = new TextEncoder().encode('Hello Midnight Network!');
      const signature = await crypto.subtle.sign('Ed25519', keyPair.privateKey, message);
      const isValid = await crypto.subtle.verify('Ed25519', keyPair.publicKey, signature, message);

      expect(isValid).toBe(true);
    });
  });

  describe('X25519 Operations', () => {
    it('should generate unique key pairs', async () => {
      const keyPair1 = await crypto.subtle.generateKey(
        { name: 'X25519' },
        true,
        ['deriveKey']
      );

      const keyPair2 = await crypto.subtle.generateKey(
        { name: 'X25519' },
        true,
        ['deriveKey']
      );

      const pubKey1 = await crypto.subtle.exportKey('raw', (keyPair1 as CryptoKeyPair).publicKey);
      const pubKey2 = await crypto.subtle.exportKey('raw', (keyPair2 as CryptoKeyPair).publicKey);

      expect(new Uint8Array(pubKey1)).not.toEqual(new Uint8Array(pubKey2));
    });
  });

  describe('Random Number Generation', () => {
    it('should generate random values', () => {
      const array1 = new Uint8Array(32);
      const array2 = new Uint8Array(32);
      
      crypto.getRandomValues(array1);
      crypto.getRandomValues(array2);

      expect(array1).not.toEqual(array2);
      expect(array1.every(val => val >= 0 && val <= 255)).toBe(true);
      expect(array2.every(val => val >= 0 && val <= 255)).toBe(true);
    });

    it('should fill arrays of different sizes', () => {
      const small = new Uint8Array(8);
      const large = new Uint8Array(64);
      
      crypto.getRandomValues(small);
      crypto.getRandomValues(large);

      expect(small.every(val => val !== 0)).toBe(true); // Very unlikely all zeros
      expect(large.every(val => val !== 0)).toBe(true); // Very unlikely all zeros
    });
  });
});