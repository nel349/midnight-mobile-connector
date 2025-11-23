/**
 * Test setup for Vitest
 * Configure React Native and crypto polyfills for testing environment
 */

import { vi } from 'vitest';

// Mock React Native modules that cause import issues
vi.mock('react-native', () => ({
  Alert: {
    alert: vi.fn(),
  },
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
  View: 'div',
  Text: 'span',
  Button: 'button',
  TextInput: 'input',
  ScrollView: 'div',
  TouchableOpacity: 'button',
  Platform: {
    OS: 'web',
  },
  NativeModules: {},
}));

// Mock React Native get random values
vi.mock('react-native-get-random-values', () => ({}));

// Mock React Native WebView
vi.mock('react-native-webview', () => ({
  WebView: vi.fn(),
}));

// Mock React Native Async Storage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock Expo modules
vi.mock('expo-crypto', () => ({
  getRandomValues: vi.fn((array: Uint8Array) => {
    // Use crypto.getRandomValues if available, otherwise fill with test data
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(array);
    }
    // Fallback for test environment
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
}));

// Mock crypto-js to avoid conflicts
vi.mock('crypto-js', () => ({
  default: {},
  SHA256: vi.fn(),
  PBKDF2: vi.fn(),
  enc: {
    Hex: {
      stringify: vi.fn(),
    },
  },
}));

// Global crypto setup for Node.js environment
import { webcrypto } from 'node:crypto';

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as Crypto;
}

// Console setup for better test output
console.log('🧪 Test environment setup complete');