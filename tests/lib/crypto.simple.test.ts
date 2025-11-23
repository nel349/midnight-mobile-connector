/**
 * Simple crypto test to validate test environment
 */

import { describe, it, expect } from 'vitest';

describe('Simple Crypto Test', () => {
  it('should have crypto available', () => {
    expect(crypto).toBeDefined();
    expect(crypto.subtle).toBeDefined();
    expect(crypto.getRandomValues).toBeDefined();
  });

  it('should generate random values', () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Very unlikely all values are zero
    const hasNonZero = array.some(val => val !== 0);
    expect(hasNonZero).toBe(true);
  });

  it('should generate Ed25519 key pairs', async () => {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );

    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
    expect(keyPair.publicKey.algorithm.name).toBe('Ed25519');
  });
});