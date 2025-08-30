/**
 * Compact Standard Library Implementation for React Native
 * 
 * This module provides React Native compatible implementations of Compact's
 * standard library functions like pad(), persistentHash(), etc.
 * 
 * All functions match the official Compact specification and can be reused
 * across different contracts and applications.
 */

const CryptoJS = require('crypto-js');

/**
 * Compact's pad function - Creates a Bytes<n> by UTF-8 encoding string and padding with zeros
 * 
 * @param n - Target byte length
 * @param s - String to encode and pad
 * @returns Uint8Array of length n
 */
export function pad(n: number, s: string): Uint8Array {
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(s);
  
  if (n < utf8Bytes.length) {
    throw new Error(`The padded length n must be at least ${utf8Bytes.length}`);
  }
  
  const paddedArray = new Uint8Array(n);
  paddedArray.set(utf8Bytes);
  return paddedArray;
}

/**
 * Compact's persistentHash function - SHA-256 based compression from arbitrary values to 32 bytes
 * 
 * This is guaranteed to persist between upgrades and uses SHA-256 compression algorithm
 * as specified in the Compact documentation.
 * 
 * @param value - Array of Uint8Arrays to hash together
 * @returns 32-byte hash result
 */
export function persistentHash(value: Uint8Array[]): Uint8Array {
  // Concatenate all byte arrays in the vector
  const totalLength = value.reduce((sum, arr) => sum + arr.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const arr of value) {
    combined.set(arr, offset);
    offset += arr.length;
  }
  
  // Use SHA-256 as specified in Compact docs
  const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(combined));
  return new Uint8Array(hash.words.flatMap((word: number) => [
    (word >>> 24) & 0xFF,
    (word >>> 16) & 0xFF,
    (word >>> 8) & 0xFF,
    word & 0xFF
  ]));
}

/**
 * Creates the public_key pure function as defined in bank.compact.
 * This is a pure function that doesn't require contract state.
 *
 * From bank.compact:
 * export pure circuit public_key(sk: Bytes<32>): Bytes<32> {
 *   return persistentHash<Vector<2, Bytes<32>>>([pad(32, "midnight:bank:pk:"), sk]);
 * }
 *
 * @returns A function that takes a 32-byte secret key and returns a 32-byte public key.
 */
export function createPublicKeyFunction(): (sk: Uint8Array) => Uint8Array {
  return (secretKey: Uint8Array): Uint8Array => {
    if (!(secretKey instanceof Uint8Array) || secretKey.length !== 32) {
      throw new Error('public_key: expected 32-byte Uint8Array secret key');
    }
    const namespace = pad(32, "midnight:bank:pk:");
    const vector = [namespace, secretKey];
    return persistentHash(vector);
  };
}

/**
 * Convert string to UTF-8 bytes (commonly needed for user inputs)
 * 
 * @param s - String to convert
 * @returns Uint8Array containing UTF-8 bytes
 */
export function stringToBytes(s: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(s);
}

/**
 * Convert Uint8Array to hex string
 * 
 * @param bytes - Bytes to convert
 * @returns Hex string (without 0x prefix)
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string to Uint8Array
 * 
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  let cleanHex = hex.trim();
  if (cleanHex.startsWith('0x')) {
    cleanHex = cleanHex.slice(2);
  }
  
  if (cleanHex.length % 2 !== 0) {
    cleanHex = '0' + cleanHex;
  }
  
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  
  return bytes;
}
