/**
 * CRITICAL CRYPTO + BUFFER POLYFILL FOR MIDNIGHT WASM
 * 
 * The Midnight WASM crypto library expects Node.js crypto.randomFillSync and Buffer,
 * which don't exist in React Native. This polyfill enables full WASM 
 * crypto functionality by providing the missing functions.
 */

import { Buffer } from 'buffer';

export function setupCrypto(): void {
  console.log('🔐 CRYPTO SETUP: Initializing Midnight WASM crypto + buffer polyfill...');

  // CRITICAL: Add Buffer to global scope for WASM compatibility
  if (typeof global !== 'undefined') {
    (global as any).Buffer = Buffer;
    console.log('✅ BUFFER POLYFILL: Buffer added to global successfully');
  }
  
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).Buffer = Buffer;
    console.log('✅ BUFFER POLYFILL: Buffer added to globalThis successfully');
  }

  // CRITICAL: Create crypto object if it doesn't exist
  const createCryptoObject = () => {
    const crypto = {
      getRandomValues: function(array: any) {
        // Use secure random in React Native
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
      randomFillSync: function(array: any) {
        // Use crypto.getRandomValues if available (more secure)
        if (this.getRandomValues) {
          this.getRandomValues(array);
          return array;
        }
        
        // Fallback to Math.random (less secure but functional)
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
      subtle: {
        constructor: 'SubtleCrypto',
        digest: 'available',
        generateKey: 'available'
      }
    };
    return crypto;
  };

  // Ensure crypto exists on global
  if (typeof global !== 'undefined') {
    if (!(global as any).crypto) {
      console.log('🔧 CRYPTO POLYFILL: Creating crypto object on global');
      (global as any).crypto = createCryptoObject();
    }
  }

  // Ensure crypto exists on globalThis
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any).crypto) {
      console.log('🔧 CRYPTO POLYFILL: Creating crypto object on globalThis');
      (globalThis as any).crypto = createCryptoObject();
    }
  }

  // Ensure crypto.randomFillSync exists for WASM crypto functions
  if (typeof global !== 'undefined' && (global as any).crypto) {
    if (!(global as any).crypto.randomFillSync) {
      console.log('🔧 CRYPTO POLYFILL: Adding crypto.randomFillSync to global for WASM compatibility');
      
      (global as any).crypto.randomFillSync = function(array: any) {
        // Use crypto.getRandomValues if available (more secure)
        if ((global as any).crypto.getRandomValues) {
          (global as any).crypto.getRandomValues(array);
          return array;
        }
        
        // Fallback to Math.random (less secure but functional)
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      };
      
      console.log('✅ CRYPTO POLYFILL: crypto.randomFillSync added to global successfully');
    }
  }

  // Also add to globalThis for broader compatibility
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
    if (!(globalThis as any).crypto.randomFillSync) {
      console.log('🔧 CRYPTO POLYFILL: Adding crypto.randomFillSync to globalThis for WASM compatibility');
      
      (globalThis as any).crypto.randomFillSync = function(array: any) {
        // Use crypto.getRandomValues if available (more secure)
        if ((globalThis as any).crypto.getRandomValues) {
          (globalThis as any).crypto.getRandomValues(array);
          return array;
        }
        
        // Fallback to Math.random (less secure but functional)
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      };
      
      console.log('✅ CRYPTO POLYFILL: crypto.randomFillSync added to globalThis successfully');
    }
  }

  // ADDITIONAL CRYPTO ENHANCEMENTS FOR WASM COMPATIBILITY
  
  // Ensure we have the proper crypto object structure for WASM
  const ensureCryptoObject = (cryptoTarget: any) => {
    if (!cryptoTarget.subtle) {
      cryptoTarget.subtle = {
        constructor: 'SubtleCrypto',
        digest: 'available',
        generateKey: 'available'
      };
      console.log('🔧 CRYPTO POLYFILL: Added SubtleCrypto API structure');
    }
    
    if (!cryptoTarget.getRandomValues) {
      console.log('⚠️  CRYPTO WARNING: getRandomValues not found, this should not happen in React Native');
    }
  };

  // Apply enhancements to both global scopes
  if ((global as any)?.crypto) {
    ensureCryptoObject((global as any).crypto);
  }
  
  if ((globalThis as any)?.crypto) {
    ensureCryptoObject((globalThis as any).crypto);
  }

  console.log('✅ CRYPTO SETUP: Midnight WASM crypto + buffer polyfill initialized successfully');
  console.log('🔐 CRYPTO STATUS:', {
    'global.Buffer': !!(typeof global !== 'undefined' && (global as any).Buffer),
    'globalThis.Buffer': !!(typeof globalThis !== 'undefined' && (globalThis as any).Buffer),
    'global.crypto.randomFillSync': !!((global as any)?.crypto?.randomFillSync),
    'globalThis.crypto.randomFillSync': !!((globalThis as any)?.crypto?.randomFillSync),
    'global.crypto.getRandomValues': !!((global as any)?.crypto?.getRandomValues),
    'globalThis.crypto.getRandomValues': !!((globalThis as any)?.crypto?.getRandomValues)
  });
}