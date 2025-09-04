import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import WamrModule from '../../modules/wamr-turbomodule/src/index';
import * as FileSystem from 'expo-file-system';

export default function MidnightTest() {
  const [status, setStatus] = useState<string>('Ready to test Midnight WASM modules');
  const [results, setResults] = useState<string[]>([]);
  const [moduleIds, setModuleIds] = useState<{onchain?: number, zswap?: number}>({});

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const testMidnightModules = async () => {
    try {
      setStatus('🚀 Testing Midnight WASM modules...');
      addResult('🚀 Starting Midnight WASM module test...');
      
      // Test 1: Load midnight_onchain_runtime_wasm_bg.wasm
      addResult('📁 Loading midnight_onchain_runtime_wasm_bg.wasm...');
      
      try {
        // Load the ACTUAL Midnight onchain runtime WASM module
        addResult(`📋 Fetching actual midnight_onchain_runtime_wasm_bg.wasm (1.6MB)...`);
        
        const onchainResponse = await fetch('/midnight_onchain_runtime_wasm_bg.wasm');
        if (!onchainResponse.ok) {
          throw new Error(`Failed to fetch onchain WASM: ${onchainResponse.status}`);
        }
        
        const onchainArrayBuffer = await onchainResponse.arrayBuffer();
        const onchainBytes = new Uint8Array(onchainArrayBuffer);
        addResult(`✅ Actual Midnight onchain WASM loaded: ${onchainBytes.length} bytes`);

        const onchainModuleId = await WamrModule.loadModule(onchainBytes);
        setModuleIds(prev => ({...prev, onchain: onchainModuleId}));
        addResult(`✅ Midnight onchain WASM module loaded successfully! Module ID: ${onchainModuleId}`);

        // Get exports from actual onchain module
        const onchainExports = await WamrModule.getExports(onchainModuleId);
        addResult(`📋 REAL Onchain module exports (${onchainExports.length}): ${JSON.stringify(onchainExports)}`);

      } catch (error) {
        addResult(`❌ Failed to load onchain module: ${error}`);
      }

      // Test 2: Load midnight_zswap_wasm_bg.wasm
      addResult('📁 Loading midnight_zswap_wasm_bg.wasm...');
      
      try {
        // Load the ACTUAL Midnight zswap WASM module  
        addResult(`📋 Fetching actual midnight_zswap_wasm_bg.wasm (2.4MB)...`);
        
        const zswapResponse = await fetch('/midnight_zswap_wasm_bg.wasm');
        if (!zswapResponse.ok) {
          throw new Error(`Failed to fetch zswap WASM: ${zswapResponse.status}`);
        }
        
        const zswapArrayBuffer = await zswapResponse.arrayBuffer();
        const zswapBytes = new Uint8Array(zswapArrayBuffer);
        addResult(`✅ Actual Midnight zswap WASM loaded: ${zswapBytes.length} bytes`);

        const zswapModuleId = await WamrModule.loadModule(zswapBytes);
        setModuleIds(prev => ({...prev, zswap: zswapModuleId}));
        addResult(`✅ Midnight zswap WASM module loaded successfully! Module ID: ${zswapModuleId}`);

        // Get exports from actual zswap module
        const zswapExports = await WamrModule.getExports(zswapModuleId);
        addResult(`📋 REAL ZSwap module exports (${zswapExports.length}): ${JSON.stringify(zswapExports)}`);

      } catch (error) {
        addResult(`❌ Failed to load zswap module: ${error}`);
      }

      // Test 3: Look for common Midnight/wasm-bindgen function patterns
      addResult('🔍 Looking for Midnight/wasm-bindgen function patterns...');
      
      if (moduleIds.onchain) {
        await testCommonFunctions(moduleIds.onchain, 'onchain');
      }
      
      if (moduleIds.zswap) {
        await testCommonFunctions(moduleIds.zswap, 'zswap');
      }

      setStatus('🎉 Midnight WASM module analysis completed!');
      addResult('🎉 SUCCESS: Midnight WASM module analysis completed!');

    } catch (error) {
      const errorMessage = `❌ ERROR in Midnight test: ${error instanceof Error ? error.message : String(error)}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const testCommonFunctions = async (moduleId: number, moduleName: string) => {
    // Common wasm-bindgen and Midnight function patterns
    const commonFunctions = [
      // wasm-bindgen functions
      '__wbindgen_malloc',
      '__wbindgen_free', 
      '__wbindgen_realloc',
      '__wbindgen_export_0',
      '__wbindgen_export_1',
      '__wbindgen_export_2',
      '__wbindgen_add_to_stack_pointer',
      '__wbindgen_exn_store',
      
      // Possible Midnight functions (guessing based on common patterns)
      'generateSecretKeys',
      'getBalance',
      'createTransaction',
      'submitTransaction',
      'computeProof',
      'verifyProof',
      'encode',
      'decode',
      
      // Generic test functions
      'main',
      'start',
      '_start',
      'memory',
      'func_0',
      'func_1',
      'func_2'
    ];

    for (const funcName of commonFunctions) {
      try {
        // Try to call with no arguments first
        const result = await WamrModule.callFunction(moduleId, funcName, []);
        addResult(`✅ ${moduleName}: Function '${funcName}' found and returned: ${result}`);
      } catch (error) {
        // Function might exist but require arguments, or might not exist
        addResult(`ℹ️  ${moduleName}: Function '${funcName}' test: ${error}`);
      }
    }
  };

  const testSecretKeysFlow = async () => {
    if (!moduleIds.onchain && !moduleIds.zswap) {
      Alert.alert('Error', 'Please load modules first');
      return;
    }

    try {
      setStatus('🔑 Testing real Midnight functions with externref...');
      addResult('🔑 Starting real Midnight function tests...');

      // Test 1: Test encodeCoinInfo with JavaScript object
      addResult('📋 Test 1: Testing encodeCoinInfo with JS object...');
      const coinInfo = {
        tokenType: 'MIDNIGHT',
        amount: 1000,
        owner: '0xabcdef',
        metadata: {
          created: Date.now(),
          network: 'testnet'
        }
      };
      
      try {
        const encoded = await WamrModule.callFunctionWithExternref(
          moduleIds.onchain!,
          'encodeCoinInfo',
          [{type: 'externref', value: coinInfo}]
        );
        addResult(`✅ encodeCoinInfo succeeded! Result: ${JSON.stringify(encoded)}`);
        
        // Try to decode it back
        const decoded = await WamrModule.callFunctionWithExternref(
          moduleIds.onchain!,
          'decodeCoinInfo',
          [{type: 'externref', value: encoded}]
        );
        addResult(`✅ decodeCoinInfo succeeded! Result: ${JSON.stringify(decoded)}`);
      } catch (error) {
        addResult(`❌ encodeCoinInfo failed: ${error}`);
      }

      // Test 2: Test tokenType encoding
      addResult('📋 Test 2: Testing encodeTokenType...');
      const tokenType = {
        symbol: 'MIDNIGHT',
        decimals: 18,
        contractAddress: '0x123456'
      };
      
      try {
        const encoded = await WamrModule.callFunctionWithExternref(
          moduleIds.onchain!,
          'encodeTokenType',
          [{type: 'externref', value: tokenType}]
        );
        addResult(`✅ encodeTokenType succeeded! Result: ${JSON.stringify(encoded)}`);
      } catch (error) {
        addResult(`❌ encodeTokenType failed: ${error}`);
      }

      // Test 3: Test signing functions
      addResult('📋 Test 3: Testing signData with externref...');
      const dataToSign = {
        message: 'Hello Midnight',
        timestamp: Date.now(),
        nonce: Math.random()
      };
      
      try {
        const signature = await WamrModule.callFunctionWithExternref(
          moduleIds.onchain!,
          'signData',
          [{type: 'externref', value: dataToSign}]
        );
        addResult(`✅ signData succeeded! Signature: ${JSON.stringify(signature)}`);
        
        // Try to verify the signature
        const verifyResult = await WamrModule.callFunctionWithExternref(
          moduleIds.onchain!,
          'verifySignature',
          [{type: 'externref', value: signature}]
        );
        addResult(`✅ verifySignature result: ${JSON.stringify(verifyResult)}`);
      } catch (error) {
        addResult(`❌ signData failed: ${error}`);
      }

      // Test 4: Test querycontext
      addResult('📋 Test 4: Testing querycontext_new...');
      try {
        const context = await WamrModule.callFunctionWithExternref(
          moduleIds.onchain!,
          'querycontext_new',
          [] // No parameters needed for new
        );
        addResult(`✅ querycontext_new succeeded! Context: ${JSON.stringify(context)}`);
        
        // Try to query with the context
        const queryParams = {
          query: 'balance',
          address: '0xabcdef'
        };
        
        const queryResult = await WamrModule.callFunctionWithExternref(
          moduleIds.onchain!,
          'querycontext_query',
          [
            {type: 'externref', value: context},
            {type: 'externref', value: queryParams}
          ]
        );
        addResult(`✅ querycontext_query result: ${JSON.stringify(queryResult)}`);
      } catch (error) {
        addResult(`❌ querycontext operations failed: ${error}`);
      }

      // Test 5: Test contractstate
      addResult('📋 Test 5: Testing contractstate_new...');
      try {
        const state = await WamrModule.callFunctionWithExternref(
          moduleIds.onchain!,
          'contractstate_new',
          [] // No parameters for new
        );
        addResult(`✅ contractstate_new succeeded! State: ${JSON.stringify(state)}`);
        
        // Query the contract state
        const queryData = {
          method: 'getBalance',
          params: ['0xuser123']
        };
        
        const stateResult = await WamrModule.callFunctionWithExternref(
          moduleIds.onchain!,
          'contractstate_query',
          [
            {type: 'externref', value: state},
            {type: 'externref', value: queryData}
          ]
        );
        addResult(`✅ contractstate_query result: ${JSON.stringify(stateResult)}`);
      } catch (error) {
        addResult(`❌ contractstate operations failed: ${error}`);
      }

      setStatus('🔑 Real Midnight function tests completed!');
      addResult('🎉 Real Midnight function tests completed!');

    } catch (error) {
      const errorMessage = `❌ ERROR in Midnight function test: ${error instanceof Error ? error.message : String(error)}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const releaseModules = async () => {
    try {
      if (moduleIds.onchain) {
        await WamrModule.releaseModule(moduleIds.onchain);
        addResult('🗑️ Onchain module released successfully');
      }
      
      if (moduleIds.zswap) {
        await WamrModule.releaseModule(moduleIds.zswap);
        addResult('🗑️ ZSwap module released successfully');
      }
      
      setModuleIds({});
      setStatus('Ready for new test');
    } catch (error) {
      addResult(`❌ ERROR releasing modules: ${error}`);
    }
  };

  const clearResults = () => {
    setResults([]);
    setStatus('Ready to test Midnight WASM modules');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Midnight WASM Test</Text>
      <Text style={styles.status}>{status}</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Test Modules"
          onPress={testMidnightModules}
          disabled={false}
        />
        <Button
          title="Test Functions"
          onPress={testSecretKeysFlow}
          disabled={Object.keys(moduleIds).length === 0}
        />
        <Button
          title="Release Modules"
          onPress={releaseModules}
          disabled={Object.keys(moduleIds).length === 0}
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