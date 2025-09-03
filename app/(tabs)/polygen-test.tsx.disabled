import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
// Polygen polyfill is loaded automatically by Metro config

export default function PolygenTest() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const testSecretKeys = async () => {
    try {
      setStatus('🚀 Starting SecretKeys test with Polygen...');
      addResult('🚀 Starting SecretKeys test with Polygen...');
      
      // Test Polygen WASM loading by importing .wasm files directly
      setStatus('📦 Testing WASM module loading with Polygen...');
      addResult('📦 Testing WASM module loading with Polygen...');
      
      try {
        // Import WASM modules using the official Polygen pattern
        addResult('🔍 Importing simple_sha256_wasm_bg.wasm using Polygen...');
        
        // Use dynamic import syntax for testing
        const { default: sha256Buffer } = await import('../../src/wasm/simple_sha256_wasm_bg.wasm');
        addResult(`✅ SHA256 WASM buffer loaded: ${sha256Buffer instanceof ArrayBuffer}`);
        addResult(`✅ Buffer size: ${sha256Buffer.byteLength} bytes`);
        
        // Create WebAssembly Module according to Polygen docs
        const sha256Module = new WebAssembly.Module(sha256Buffer);
        addResult(`✅ SHA256 Module created successfully`);
        
        // Create instance (this may need imports, but let's try basic first)
        const sha256Instance = new WebAssembly.Instance(sha256Module);
        addResult(`✅ SHA256 Instance created successfully`);
        addResult(`✅ Exports: ${Object.keys(sha256Instance.exports).join(', ')}`);
        
      } catch (shaError: any) {
        addResult(`⚠️ SHA256 WASM error: ${shaError.message}`);
        addResult(`⚠️ Stack: ${shaError.stack?.split('\n')[0]}`);
      }
      
      try {
        addResult('🔍 Importing midnight_zswap_wasm_bg.wasm using Polygen...');
        
        // Use dynamic import for Midnight WASM
        const { default: midnightBuffer } = await import('../../src/wasm/midnight_zswap_wasm_bg.wasm');
        addResult(`✅ Midnight WASM buffer loaded: ${midnightBuffer instanceof ArrayBuffer}`);
        addResult(`✅ Buffer size: ${midnightBuffer.byteLength} bytes`);
        
        // Create WebAssembly Module
        const midnightModule = new WebAssembly.Module(midnightBuffer);
        addResult(`✅ Midnight Module created successfully`);
        
        // Note: Creating an instance may require proper imports for this complex module
        addResult(`✅ Module imports needed: ${WebAssembly.Module.imports(midnightModule).length}`);
        addResult(`✅ Module exports available: ${WebAssembly.Module.exports(midnightModule).length}`);
        
      } catch (zswapError: any) {
        addResult(`⚠️ Midnight WASM error: ${zswapError.message}`);
        addResult(`⚠️ Stack: ${zswapError.stack?.split('\n')[0]}`);
      }
      
      // Try testing WebAssembly polyfill directly
      setStatus('📦 Testing WebAssembly polyfill...');
      addResult('📦 Testing WebAssembly polyfill...');
      
      if (typeof WebAssembly !== 'undefined') {
        addResult(`✅ WebAssembly available: ${typeof WebAssembly}`);
        addResult(`  - compile: ${typeof WebAssembly.compile}`);
        addResult(`  - instantiate: ${typeof WebAssembly.instantiate}`);
        addResult(`  - Module: ${typeof WebAssembly.Module}`);
        addResult(`  - Instance: ${typeof WebAssembly.Instance}`);
      } else {
        addResult('❌ WebAssembly not available');
      }
      
      setStatus('✅ Basic Polygen test completed');
      addResult('✅ Basic Polygen test completed - check logs above for detailed results');
      
    } catch (error) {
      const errorMessage = `❌ ERROR: ${error instanceof Error ? error.message : String(error)}`;
      setStatus(errorMessage);
      addResult(errorMessage);
      if (error instanceof Error && error.stack) {
        addResult(`Stack: ${error.stack}`);
      }
    }
  };

  const clearResults = () => {
    setResults([]);
    setStatus('Ready to test');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Polygen WASM Test</Text>
      
      <Text style={styles.status}>{status}</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Test SecretKeys" onPress={testSecretKeys} />
        <Button title="Clear Results" onPress={clearResults} />
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 10,
  },
  resultText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});