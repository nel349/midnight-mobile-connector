/**
 * React Native compatible WASM loader
 * This handles the loading of WASM modules in React Native environment
 */

import { Asset } from 'expo-asset';

export interface WasmModule {
  __wbindgen_start?: () => void;
  [key: string]: any;
}

export interface WasmCompatibilityResult {
  supported: boolean;
  error?: string;
}

/**
 * Test if WASM is supported in the current React Native environment
 */
export async function testWasmSupport(): Promise<WasmCompatibilityResult> {
  try {
    console.log('🧪 Testing React Native WASM support...');
    
    // Try to load the compact runtime first (simpler)
    const compactRuntime = require('@midnight-ntwrk/compact-runtime');
    
    if (compactRuntime && compactRuntime.StateValue && compactRuntime.StateValue.newNull) {
      console.log('✅ WASM modules loaded successfully via require()');
      return { supported: true };
    } else {
      console.log('❌ WASM modules loaded but missing expected exports');
      return { 
        supported: false, 
        error: 'WASM modules missing expected exports (StateValue.newNull)' 
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('❌ WASM loading failed:', errorMessage);
    return { 
      supported: false, 
      error: errorMessage 
    };
  }
}

/**
 * Load the onchain runtime WASM module in React Native
 */
export async function loadOnchainRuntime(): Promise<WasmModule> {
  try {
    console.log('📦 Loading onchain runtime WASM for React Native...');
    
    // Try direct require first
    const runtime = require('@midnight-ntwrk/onchain-runtime/midnight_onchain_runtime_wasm_bg.js');
    
    if (runtime) {
      console.log('✅ Onchain runtime loaded successfully');
      return runtime;
    } else {
      throw new Error('Failed to load onchain runtime via require');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to load onchain runtime:', errorMessage);
    throw new Error(`Failed to load onchain runtime: ${errorMessage}`);
  }
}

/**
 * Load the compact runtime in React Native
 */
export async function loadCompactRuntime(): Promise<any> {
  try {
    console.log('📦 Loading compact runtime for React Native...');
    
    // Try direct require
    const runtime = require('@midnight-ntwrk/compact-runtime');
    
    if (runtime && runtime.StateValue) {
      console.log('✅ Compact runtime loaded successfully');
      return runtime;
    } else {
      throw new Error('Compact runtime loaded but missing StateValue');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to load compact runtime:', errorMessage);
    throw new Error(`Failed to load compact runtime: ${errorMessage}`);
  }
}
