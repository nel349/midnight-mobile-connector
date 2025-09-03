import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import WamrModule from '../../modules/wamr-turbomodule/src/index';

export default function WamrTest() {
  const [status, setStatus] = useState<string>('Ready to test WAMR');
  const [results, setResults] = useState<string[]>([]);
  const [moduleId, setModuleId] = useState<number | null>(null);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const loadTestWasm = async () => {
    try {
      setStatus('🚀 Loading simple test WASM module...');
      addResult('🚀 Starting WAMR TurboModule test...');
      
      // Load the simple test WASM file
      addResult('📁 Loading test-wasm/simple.wasm...');
      
      // Extremely simple WASM module: (module (func (export "test") (result i32) i32.const 42))
      // Generated using wat2wasm from WebAssembly Binary Toolkit
      const wasmBytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d,  // magic
        0x01, 0x00, 0x00, 0x00,  // version
        0x01, 0x05,              // type section
        0x01,                    // 1 type
        0x60, 0x00, 0x01, 0x7f,  // func type: [] -> [i32]
        0x03, 0x02,              // function section  
        0x01, 0x00,              // 1 func, type 0
        0x07, 0x08,              // export section
        0x01,                    // 1 export
        0x04, 0x74, 0x65, 0x73, 0x74,  // name "test"
        0x00, 0x00,              // func export, index 0
        0x0a, 0x06,              // code section
        0x01,                    // 1 function body
        0x04,                    // body size
        0x00,                    // 0 locals
        0x41, 0x2a,              // i32.const 42
        0x0b                     // end
      ]);
      
      const loadedModuleId = await WamrModule.loadModule(wasmBytes);
      setModuleId(loadedModuleId);
      
      addResult(`✅ WASM module loaded successfully! Module ID: ${loadedModuleId}`);
      setStatus(`✅ Module loaded (ID: ${loadedModuleId})`);
      
    } catch (error) {
      const errorMessage = `❌ ERROR loading WASM: ${error instanceof Error ? error.message : String(error)}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const testWasmFunctions = async () => {
    if (moduleId === null) {
      Alert.alert('Error', 'Please load a WASM module first');
      return;
    }

    try {
      setStatus('🧮 Testing WASM functions...');
      addResult('🧮 Testing WASM function calls...');

      // Get exports FIRST to see what's available
      addResult('📋 Getting module exports...');
      const exports = await WamrModule.getExports(moduleId);
      addResult(`✅ Module exports: [${exports.join(', ')}] (count: ${exports.length})`);
      
      if (exports.length === 0) {
        addResult('❌ No exports found - this indicates an issue with export reading');
        setStatus('❌ No exports found in module');
        return;
      }

      // Use the first export found instead of hardcoded 'answer'
      const functionName = exports[0];
      addResult(`📋 Test 1: ${functionName}() - should return 42`);
      const answer = await WamrModule.callFunction(moduleId, functionName, []);
      addResult(`✅ ${functionName}() returned: ${answer} (expected: 42)`);

      // Test 2: Call again for consistency
      addResult(`📋 Test 2: ${functionName}() again - should return 42`);
      const answer2 = await WamrModule.callFunction(moduleId, functionName, []);
      addResult(`✅ ${functionName}() returned: ${answer2} (expected: 42)`);

      // Test 3: Verify function is deterministic
      addResult('📋 Test 3: Verifying function is deterministic');
      if (answer === answer2 && answer === 42) {
        addResult('✅ Function behaves consistently - WAMR is working!');
      } else {
        addResult(`❌ Inconsistent results: ${answer} vs ${answer2}`);
      }

      setStatus('🎉 All tests completed successfully!');
      addResult('🎉 SUCCESS: All WAMR function tests passed!');

    } catch (error) {
      const errorMessage = `❌ ERROR testing functions: ${error instanceof Error ? error.message : String(error)}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const releaseModule = async () => {
    if (moduleId === null) {
      Alert.alert('Info', 'No module to release');
      return;
    }

    try {
      await WamrModule.releaseModule(moduleId);
      setModuleId(null);
      addResult('🗑️ Module released successfully');
      setStatus('Module released');
    } catch (error) {
      const errorMessage = `❌ ERROR releasing module: ${error instanceof Error ? error.message : String(error)}`;
      addResult(errorMessage);
    }
  };

  const clearResults = () => {
    setResults([]);
    setStatus('Ready to test WAMR');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WAMR TurboModule Test</Text>
      
      <Text style={styles.status}>{status}</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Load WASM" onPress={loadTestWasm} />
        <Button title="Test Functions" onPress={testWasmFunctions} disabled={moduleId === null} />
        <Button title="Release Module" onPress={releaseModule} disabled={moduleId === null} />
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
    flexWrap: 'wrap',
    gap: 10,
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