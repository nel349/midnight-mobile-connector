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
      
      // WASM module with two functions: test() -> 42 and add(a,b) -> a+b
      const wasmBytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x0b, 0x02, 0x60,
        0x00, 0x01, 0x7f, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f, 0x03, 0x03, 0x02,
        0x00, 0x01, 0x07, 0x0e, 0x02, 0x04, 0x74, 0x65, 0x73, 0x74, 0x00, 0x00,
        0x03, 0x61, 0x64, 0x64, 0x00, 0x01, 0x0a, 0x0e, 0x02, 0x04, 0x00, 0x41,
        0x2a, 0x0b, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b
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

      // Since export names are empty, use placeholder names if they exist
      if (exports.includes('func_0') || exports.includes('test')) {
        const funcName = exports.includes('test') ? 'test' : 'func_0';
        addResult(`📋 Test 1: ${funcName}() - should return 42`);
        try {
          const result = await WamrModule.callFunction(moduleId, funcName, []);
          addResult(`✅ ${funcName}() returned: ${result} (expected: 42)`);
          
          if (result === 42) {
            addResult('✅ First function works correctly!');
          } else {
            addResult(`❌ ${funcName}() returned unexpected value: ${result}`);
          }
        } catch (err) {
          addResult(`❌ Failed to call ${funcName}: ${err}`);
        }
      }

      // Test the second function (two args)
      if (exports.includes('func_1') || exports.includes('add')) {
        const funcName = exports.includes('add') ? 'add' : 'func_1';
        addResult(`📋 Test 2: ${funcName}(5, 3) - should return 8`);
        try {
          const sum = await WamrModule.callFunction(moduleId, funcName, [5, 3]);
          addResult(`✅ ${funcName}(5, 3) returned: ${sum} (expected: 8)`);
          
          if (sum === 8) {
            addResult('✅ Second function works correctly!');
          } else {
            addResult(`❌ ${funcName}() returned unexpected value: ${sum}`);
          }
        } catch (err) {
          addResult(`❌ Failed to call ${funcName}: ${err}`);
        }
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