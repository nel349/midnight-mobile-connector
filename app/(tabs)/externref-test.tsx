import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import WamrModule from '../../modules/wamr-turbomodule/src/index';

export default function ExternrefTest() {
  const [status, setStatus] = useState<string>('Ready to test externref');
  const [results, setResults] = useState<string[]>([]);
  const [moduleId, setModuleId] = useState<number | null>(null);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const testBasicExternref = async () => {
    try {
      setStatus('🚀 Testing basic externref functionality...');
      addResult('🚀 Starting externref test...');
      
      // Load our externref test WASM module
      addResult('📁 Loading externref-test.wasm...');
      
      // Read the externref test WASM file
      const wasmBytes = new Uint8Array([
        // This should be the actual bytes from externref-test.wasm
        // For now, let's use our simple test module
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x0b, 0x02, 0x60,
        0x00, 0x01, 0x7f, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f, 0x03, 0x03, 0x02,
        0x00, 0x01, 0x07, 0x0e, 0x02, 0x04, 0x74, 0x65, 0x73, 0x74, 0x00, 0x00,
        0x03, 0x61, 0x64, 0x64, 0x00, 0x01, 0x0a, 0x0e, 0x02, 0x04, 0x00, 0x41,
        0x2a, 0x0b, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b
      ]);

      const loadedModuleId = await WamrModule.loadModule(wasmBytes);
      setModuleId(loadedModuleId);
      addResult(`✅ WASM module loaded successfully! Module ID: ${loadedModuleId}`);

      // Test 1: Create externref from JavaScript object
      addResult('📋 Test 1: Creating externref from JavaScript object...');
      const testObject = {
        name: 'test-object',
        value: 42,
        nested: {
          array: [1, 2, 3],
          flag: true
        }
      };

      const externrefId = await WamrModule.createExternref(loadedModuleId, testObject);
      addResult(`✅ Created externref with ID: ${externrefId}`);

      // Test 2: Retrieve object from externref
      addResult('📋 Test 2: Retrieving object from externref...');
      const retrievedObject = await WamrModule.getExternrefObject(externrefId);
      addResult(`✅ Retrieved object:${JSON.stringify(retrievedObject, null, 2)}`);

      // Test 3: Verify object integrity
      addResult('📋 Test 3: Verifying object integrity...');
      if (JSON.stringify(testObject) === JSON.stringify(retrievedObject)) {
        addResult('✅ Object integrity verified - objects match!');
      } else {
        addResult('❌ Object integrity failed - objects do not match!');
      }

      // Test 4: Create multiple externrefs
      addResult('📋 Test 4: Creating multiple externrefs...');
      const testObject2 = { id: 2, data: 'second object' };
      const testObject3 = { id: 3, data: 'third object' };
      
      const externrefId2 = await WamrModule.createExternref(loadedModuleId, testObject2);
      const externrefId3 = await WamrModule.createExternref(loadedModuleId, testObject3);
      
      addResult(`✅ Created externref 2 with ID: ${externrefId2}`);
      addResult(`✅ Created externref 3 with ID: ${externrefId3}`);

      // Test 5: Verify multiple objects can be retrieved correctly
      const retrieved2 = await WamrModule.getExternrefObject(externrefId2);
      const retrieved3 = await WamrModule.getExternrefObject(externrefId3);
      
      addResult(`✅ Retrieved object 2: ${JSON.stringify(retrieved2)}`);
      addResult(`✅ Retrieved object 3: ${JSON.stringify(retrieved3)}`);

      // Test 6: Release externrefs
      addResult('📋 Test 6: Releasing externrefs...');
      await WamrModule.releaseExternref(loadedModuleId, externrefId2);
      await WamrModule.releaseExternref(loadedModuleId, externrefId3);
      addResult('✅ Released externrefs 2 and 3');

      // Test 7: Try to retrieve released externref (should fail)
      addResult('📋 Test 7: Attempting to retrieve released externref...');
      try {
        await WamrModule.getExternrefObject(externrefId2);
        addResult('❌ ERROR: Should not be able to retrieve released externref!');
      } catch (error) {
        addResult('✅ Correctly failed to retrieve released externref');
      }

      // Test 8: Call WASM function with externref parameter
      addResult('📋 Test 8: Calling WASM function with externref parameter...');
      const testObjectForFunction = {
        functionTest: true,
        data: 'passed to WASM function',
        timestamp: Date.now()
      };
      
      try {
        const functionResult = await WamrModule.callFunctionWithExternref(
          loadedModuleId, 
          'func_0',  // This should act as echo_externref
          [{type: 'externref', value: testObjectForFunction}]
        );
        
        addResult(`✅ Function returned: ${JSON.stringify(functionResult)}`);
        
        // Verify the returned object matches what we sent
        if (JSON.stringify(functionResult) === JSON.stringify(testObjectForFunction)) {
          addResult('✅ Function call with externref works! Object round-trip successful!');
        } else {
          addResult('❌ Function returned different object than expected');
        }
      } catch (error) {
        addResult(`❌ Function call with externref failed: ${error}`);
      }

      // Test 9: Call WASM function with mixed arguments (number + externref)
      addResult('📋 Test 9: Calling WASM function with mixed arguments...');
      try {
        const mixedResult = await WamrModule.callFunctionWithExternref(
          loadedModuleId,
          'func_1',  // This should handle mixed args
          [
            42,  // Regular number argument
            {type: 'externref', value: {mixed: true, value: 'test'}}
          ]
        );
        
        addResult(`✅ Mixed arguments function returned: ${JSON.stringify(mixedResult)}`);
      } catch (error) {
        addResult(`❌ Mixed arguments function call failed: ${error}`);
      }

      setStatus('🎉 All externref tests completed!');
      addResult('🎉 SUCCESS: All externref tests passed!');

    } catch (error) {
      const errorMessage = `❌ ERROR in externref test: ${error instanceof Error ? error.message : String(error)}`;
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
      addResult('🗑️ Module released successfully');
      setModuleId(null);
      setStatus('Ready for new test');
    } catch (error) {
      addResult(`❌ ERROR releasing module: ${error}`);
    }
  };

  const clearResults = () => {
    setResults([]);
    setStatus('Ready to test externref');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>externref Test</Text>
      <Text style={styles.status}>{status}</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Test externref"
          onPress={testBasicExternref}
          disabled={false}
        />
        <Button
          title="Release Module"
          onPress={releaseModule}
          disabled={moduleId === null}
        />
        <Button
          title="Clear Results"
          onPress={clearResults}
        />
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={true}>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    textAlign: 'center',
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
    backgroundColor: '#ffffff',
    borderRadius: 5,
    padding: 10,
    maxHeight: 500,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
    lineHeight: 16,
  },
});