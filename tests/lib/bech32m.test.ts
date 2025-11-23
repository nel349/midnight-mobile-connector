/**
 * Tests for Bech32m encoding (core of address generation)
 */

import { describe, it, expect } from 'vitest';

describe('Bech32m Implementation', () => {
  it('should import bech32m module', async () => {
    const bech32m = await import('../../lib/bech32m');
    expect(bech32m).toBeDefined();
  });

  it('should encode test data', async () => {
    const { encodeMidnightBech32m } = await import('../../lib/bech32m');
    
    // Test with simple data
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const result = encodeMidnightBech32m('test', testData);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.startsWith('test1')).toBe(true);
  });

  it('should produce consistent results', async () => {
    const { encodeMidnightBech32m } = await import('../../lib/bech32m');
    
    const testData = new Uint8Array([10, 20, 30, 40, 50]);
    const result1 = encodeMidnightBech32m('midnight', testData);
    const result2 = encodeMidnightBech32m('midnight', testData);
    
    expect(result1).toBe(result2);
  });

  it('should handle different prefixes', async () => {
    const { encodeMidnightBech32m } = await import('../../lib/bech32m');
    
    const testData = new Uint8Array([100, 200]);
    const testResult = encodeMidnightBech32m('test', testData);
    const mainResult = encodeMidnightBech32m('main', testData);
    
    expect(testResult).not.toBe(mainResult);
    expect(testResult.startsWith('test1')).toBe(true);
    expect(mainResult.startsWith('main1')).toBe(true);
  });
});