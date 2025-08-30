/**
 * Ledger Reader Test Component
 * 
 * Demonstrates reading from Midnight contract state without creating transactions
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import {
  testContractRead,
  quickContractSetup,
  createTestnetProviders,
} from '../lib/midnightProviders';
import { DEFAULT_CONTRACT_ADDRESS } from '../lib/constants';

interface LedgerTestState {
  loading: boolean;
  contractAddress: string;
  testResult: any;
  rawState: any;
  error: string;
}

export function LedgerReaderTest() {
  const [state, setState] = useState<LedgerTestState>({
    loading: false,
    contractAddress: '',
    testResult: null,
    rawState: null,
    error: '',
  });

  // Example contract addresses for testing
  const exampleContracts = [
    {
      name: 'Default Contract',
      address: DEFAULT_CONTRACT_ADDRESS,
      description: 'Primary test contract on TestNet'
    },
    {
      name: 'Token Contract (Example)',
      address: '0200e2f48cf74e64894297105ad968385d637cf4b6228042ea89a89452a497da3cf0',
      description: 'A token contract example'
    }
  ];

  const testBasicRead = async () => {
    if (!state.contractAddress.trim()) {
      Alert.alert('Error', 'Please enter a contract address');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '', testResult: null, rawState: null }));

    try {
      console.log('🧪 Starting basic contract read test...');
      
      const result = await testContractRead(state.contractAddress, 'testnet');
      
      setState(prev => ({
        ...prev,
        loading: false,
        testResult: result,
        rawState: result.rawState,
        error: result.error || '',
      }));

      if (result.success) {
        Alert.alert('Success', 'Contract state read successfully!');
      } else {
        Alert.alert('Failed', result.error || 'Unknown error');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      Alert.alert('Error', errorMessage);
    }
  };

  const testAdvancedRead = async () => {
    if (!state.contractAddress.trim()) {
      Alert.alert('Error', 'Please enter a contract address');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '', testResult: null }));

    try {
      console.log('🔬 Starting advanced contract read test...');
      
      // Create providers and reader
      const { providers, ledgerReader } = await quickContractSetup(state.contractAddress);
      
      // Test various reading methods
      const results = {
        hasState: false,
        rawState: null,
        contractExists: false,
        stateInfo: {},
      };

      // Check if contract exists
      const contractState = await providers.publicDataProvider.queryContractState(state.contractAddress);
      results.contractExists = !!contractState;
      
      if (contractState) {
        results.hasState = true;
        results.rawState = contractState.data;
        results.stateInfo = {
          blockHeight: contractState.blockHeight,
          timestamp: contractState.timestamp,
          dataLength: contractState.data ? contractState.data.length : 0,
          dataType: typeof contractState.data,
        };
      }

      setState(prev => ({
        ...prev,
        loading: false,
        testResult: results,
        rawState: results.rawState,
      }));

      Alert.alert('Advanced Test Complete', `Contract exists: ${results.contractExists}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      Alert.alert('Error', errorMessage);
    }
  };

  const exploreContract = async () => {
    if (!state.contractAddress.trim()) {
      Alert.alert('Error', 'Please enter a contract address');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      console.log('🔍 Exploring contract state...');
      
      const providers = await createTestnetProviders();
      
      // Get contract history
      const history = await providers.publicDataProvider.queryContractHistory?.(state.contractAddress, 5);
      
      const results = {
        historyLength: history?.length || 0,
        history: history || [],
        explorationComplete: true,
      };

      setState(prev => ({
        ...prev,
        loading: false,
        testResult: results,
      }));

      Alert.alert('Exploration Complete', `Found ${results.historyLength} contract actions`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      Alert.alert('Error', errorMessage);
    }
  };

  const fillExample = (address: string) => {
    setState(prev => ({ ...prev, contractAddress: address }));
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        📖 Ledger Reader Test
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 15, color: '#666' }}>
        Test reading from Midnight contract state without creating transactions.
      </Text>

      {/* Contract Address Input */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Contract Address:
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            padding: 12,
            backgroundColor: 'white',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
          value={state.contractAddress}
          onChangeText={(text) => setState(prev => ({ ...prev, contractAddress: text }))}
          placeholder="Enter contract address (hex)"
          multiline
        />
      </View>

      {/* Example Contracts */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Example Contracts:
        </Text>
        {exampleContracts.map((contract, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: 'white',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: '#ddd',
            }}
            onPress={() => fillExample(contract.address)}
          >
            <Text style={{ fontWeight: 'bold' }}>{contract.name}</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>{contract.description}</Text>
            <Text style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>
              {contract.address.substring(0, 40)}...
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Test Buttons */}
      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: state.loading ? '#ccc' : '#007AFF',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
          }}
          onPress={testBasicRead}
          disabled={state.loading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {state.loading ? '⏳ Testing...' : '🧪 Basic Read Test'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: state.loading ? '#ccc' : '#34C759',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
          }}
          onPress={testAdvancedRead}
          disabled={state.loading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {state.loading ? '⏳ Testing...' : '🔬 Advanced Read Test'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: state.loading ? '#ccc' : '#FF9500',
            padding: 15,
            borderRadius: 8,
          }}
          onPress={exploreContract}
          disabled={state.loading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {state.loading ? '⏳ Exploring...' : '🔍 Explore Contract'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {state.error ? (
        <View style={{
          backgroundColor: '#ffebee',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          borderLeftWidth: 4,
          borderLeftColor: '#f44336',
        }}>
          <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>Error:</Text>
          <Text style={{ color: '#d32f2f' }}>{state.error}</Text>
        </View>
      ) : null}

      {/* Results Display */}
      {state.testResult ? (
        <View style={{
          backgroundColor: 'white',
          padding: 15,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#ddd',
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            📊 Test Results:
          </Text>
          <Text style={{
            fontFamily: 'monospace',
            fontSize: 12,
            backgroundColor: '#f8f8f8',
            padding: 10,
            borderRadius: 4,
          }}>
            {JSON.stringify(state.testResult, null, 2)}
          </Text>
        </View>
      ) : null}

      {/* Raw State Display */}
      {state.rawState ? (
        <View style={{
          backgroundColor: 'white',
          padding: 15,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#ddd',
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            🗃️ Raw Contract State:
          </Text>
          <Text style={{
            fontFamily: 'monospace',
            fontSize: 10,
            backgroundColor: '#f8f8f8',
            padding: 10,
            borderRadius: 4,
          }}>
            {typeof state.rawState === 'string' 
              ? state.rawState.substring(0, 500) + (state.rawState.length > 500 ? '...' : '')
              : JSON.stringify(state.rawState, null, 2).substring(0, 500) + '...'
            }
          </Text>
        </View>
      ) : null}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

export default LedgerReaderTest;

