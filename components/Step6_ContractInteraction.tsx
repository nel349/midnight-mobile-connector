import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createTestnetContractClient, MidnightContractClient } from '../lib/midnightContractClient';
import {
  createLocalProviders,
  createTestnetProviders,
  queryContractState,
  testProviderConnection,
  type BasicMidnightProviders
} from '../lib/midnightProviders';

interface Props {
  // Can be extended to pass wallet data when needed
}

/**
 * Contract Interaction Component
 * 
 * Similar to NetworkConnection but focused on smart contract interactions:
 * - Initialize contract client
 * - Connect to deployed contracts
 * - Call contract functions
 * - Query contract events
 * - Send transactions
 */
export default function ContractInteraction({}: Props) {
  const [client, setClient] = useState<MidnightContractClient | null>(null);
  const [providers, setProviders] = useState<BasicMidnightProviders | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [networkType, setNetworkType] = useState<'testnet' | 'local'>('testnet');
  const [contractAddress, setContractAddress] = useState('0200c79698a29be94e3b4e3f19ceb1a6f25b206cda15347e68caf15083e715a69c6a');
  const [functionName, setFunctionName] = useState('get_token_balance');
  const [parameters, setParameters] = useState('["0x123"]');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleInitializeClient = async () => {
    setIsLoading(true);
    try {
      console.log(`🔧 Initializing Midnight Providers (${networkType})...`);
      
      // Initialize REAL providers based on network type
      const midnightProviders = networkType === 'testnet' 
        ? await createTestnetProviders() 
        : await createLocalProviders();
      
      // Initialize legacy client for compatibility
      const contractClient = createTestnetContractClient();
      const networkInfo = contractClient.getNetworkInfo();
      
      setProviders(midnightProviders);
      setClient(contractClient);
      setIsInitialized(true);
      
      Alert.alert(
        'REAL Providers Initialized', 
        `✅ Connected to REAL Midnight infrastructure!\nNetwork: ${networkType.toUpperCase()}\nReady for contract interactions`
      );
      
    } catch (error) {
      console.error('Provider initialization failed:', error);
      Alert.alert('Initialization Failed', `❌ ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectContract = async () => {
    if (!providers) {
      Alert.alert('Error', 'Please initialize providers first');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`🔗 Testing connection to contract: ${contractAddress}`);
      
      // Test the real provider connection
      const connectionTest = await testProviderConnection(providers, contractAddress);
      
      if (connectionTest) {
        // Try to query contract state
        const state = await queryContractState(providers, contractAddress);
        
        Alert.alert(
          'Contract Connection Test', 
          state 
            ? `✅ Contract found!\nAddress: ${contractAddress.substring(0, 30)}...`
            : `❌ Contract not found at address\nThis is normal - contract might not exist yet`
        );
      } else {
        Alert.alert('Connection Failed', '❌ Provider connection test failed');
      }
      
    } catch (error) {
      console.error('Contract connection test failed:', error);
      Alert.alert('Connection Failed', `❌ ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContractCall = async () => {
    if (!client) {
      Alert.alert('Error', 'Please initialize client first');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`📖 Calling ${functionName} on ${contractAddress}`);
      
      let parsedParams = [];
      try {
        parsedParams = JSON.parse(parameters);
      } catch {
        parsedParams = [parameters]; // Treat as single string param
      }

      const result = await client.callContract(contractAddress, functionName, parsedParams);
      setLastResult(result);
      
      Alert.alert(
        'Contract Call Result', 
        `✅ Function: ${functionName}\nResult: ${JSON.stringify(result, null, 2)}`
      );
      
    } catch (error) {
      console.error('Contract call failed:', error);
      Alert.alert('Call Failed', `❌ ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryEvents = async () => {
    if (!client) {
      Alert.alert('Error', 'Please initialize client first');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`📋 Querying events from ${contractAddress}`);
      const events = await client.getContractEvents(contractAddress, 'Transfer');
      
      Alert.alert(
        'Contract Events', 
        `✅ Found ${events.length} Transfer events\nContract: ${contractAddress.substring(0, 20)}...`
      );
      
    } catch (error) {
      console.error('Event query failed:', error);
      Alert.alert('Query Failed', `❌ ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestBankContract = async () => {
    if (!providers) {
      Alert.alert('Error', 'Please initialize providers first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🏦 Testing connection to bank contract...');
      
      // Test provider connection first
      const connectionTest = await testProviderConnection(providers);
      
      if (!connectionTest) {
        Alert.alert('Connection Failed', '❌ Provider connection test failed');
        return;
      }
      
      // Direct query for the specific bank contract
      const bankContractAddress = '0200c79698a29be94e3b4e3f19ceb1a6f25b206cda15347e68caf15083e715a69c6a';
      
      // Try to query the bank contract with correct schema
      console.log(`🏦 Attempting to query bank contract: ${bankContractAddress}`);
      const contractState = await providers.contractQuerier.queryActualContractState(bankContractAddress);
      
      if (contractState) {
        Alert.alert(
          'Bank Contract Found! 🏦',
          `✅ Successfully connected to bank contract!\n\n` +
          `Address: ${bankContractAddress.substring(0, 20)}...\n` +
          `Block Height: ${contractState.blockHeight || 'Unknown'}\n` +
          `Data Length: ${contractState.data ? contractState.data.length : 0}\n\n` +
          `This is a REAL deployed bank contract!`
        );
        
        setLastResult({
          type: 'bank_contract_query',
          address: bankContractAddress,
          data: contractState,
          timestamp: new Date().toISOString()
        });
        
      } else {
        Alert.alert(
          'Contract Query Result',
          `❌ Bank contract not found at address\n${bankContractAddress.substring(0, 30)}...\n\n` +
          `This could mean:\n• Contract is on a different network\n• Address format is incorrect\n• Contract was not deployed yet`
        );
      }
      
    } catch (error) {
      console.error('Bank contract test failed:', error);
      Alert.alert(
        'Test Failed', 
        `❌ Error testing bank contract:\n${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTransaction = async () => {
    if (!client) {
      Alert.alert('Error', 'Please initialize client first');
      return;
    }

    Alert.alert(
      'Send Transaction',
      'This will send a transaction to the contract. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: async () => {
            setIsLoading(true);
            try {
              console.log(`📤 Sending transaction: ${functionName} to ${contractAddress}`);
              
              let parsedParams = [];
              try {
                parsedParams = JSON.parse(parameters);
              } catch {
                parsedParams = [parameters];
              }

              const txHash = await client.sendTransaction(contractAddress, functionName, parsedParams);
              
              Alert.alert(
                'Transaction Sent', 
                `✅ Transaction hash:\n${txHash}`
              );
              
            } catch (error) {
              console.error('Transaction failed:', error);
              Alert.alert('Transaction Failed', `❌ ${error}`);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📄 Contract Interaction</Text>
        <Text style={styles.subtitle}>
          Test smart contract interactions on Midnight TestNet
        </Text>
      </View>

      {/* Client Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Status</Text>
        <View style={styles.card}>
          <Text style={styles.statusText}>
            Status: {isInitialized ? '✅ Ready' : '⭕ Not Initialized'}
          </Text>
          {client && (
            <Text style={styles.detailText}>
              Network: {client.getNetworkInfo().name} (ID: {client.getNetworkInfo().networkId})
            </Text>
          )}
          
          <Button
            title={isInitialized ? "🔧 Reinitialize Client" : "🔧 Initialize Client"}
            onPress={handleInitializeClient}
            disabled={isLoading}
            color="#007AFF"
          />
        </View>
      </View>

      {/* Contract Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Contract Configuration</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Contract Address:</Text>
          <TextInput
            style={styles.textInput}
            value={contractAddress}
            onChangeText={setContractAddress}
            placeholder="0200c796..."
            editable={!isLoading}
          />

          <Text style={styles.inputLabel}>Function Name:</Text>
          <TextInput
            style={styles.textInput}
            value={functionName}
            onChangeText={setFunctionName}
            placeholder="get_token_balance"
            editable={!isLoading}
          />

          <Text style={styles.inputLabel}>Available Bank Functions:</Text>
          <Text style={styles.availableFunctionsText}>
            • create_account(user_id, pin, deposit_amount){'\n'}
            • deposit(user_id, pin, amount){'\n'}
            • withdraw(user_id, pin, amount){'\n'}
            • get_token_balance(user_id, pin){'\n'}
            • verify_account_status(user_id, pin)
          </Text>

          <Text style={styles.inputLabel}>Parameters (user_id, pin, etc):</Text>
          <TextInput
            style={styles.textInput}
            value={parameters}
            onChangeText={setParameters}
            placeholder='["user123", "pin456"] - 32-byte values needed'
            editable={!isLoading}
            multiline
          />
          
          <Text style={styles.noteText}>
            ⚠️ Currently testing contract state queries only. 
            Function calls require ZK proof generation and wallet integration.
          </Text>
        </View>
      </View>

      {/* Contract Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contract Actions</Text>
        <View style={styles.card}>
          <Button
            title="🔗 Query Contract State"
            onPress={handleConnectContract}
            disabled={!isInitialized || isLoading}
            color="#34C759"
          />
          
          <View style={styles.buttonSpacer} />
          
          <Button
            title="🏦 Test Bank Contract"
            onPress={handleTestBankContract}
            disabled={!isInitialized || isLoading}
            color="#FF6B35"
          />
          
          <View style={styles.buttonSpacer} />
          
          <Button
            title="📖 Call Function (Read)"
            onPress={handleContractCall}
            disabled={!isInitialized || isLoading}
            color="#007AFF"
          />
          
          <View style={styles.buttonSpacer} />
          
          <Button
            title="📤 Send Transaction (Write)"
            onPress={handleSendTransaction}
            disabled={!isInitialized || isLoading}
            color="#FF9500"
          />
          
          <View style={styles.buttonSpacer} />
          
          <Button
            title="📋 Query Events"
            onPress={handleQueryEvents}
            disabled={!isInitialized || isLoading}
            color="#5856D6"
          />
        </View>
      </View>

      {/* Results */}
      {lastResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Result</Text>
          <View style={styles.card}>
            <Text style={styles.resultText}>
              {JSON.stringify(lastResult, null, 2)}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  buttonSpacer: {
    height: 10,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    color: '#333',
  },
  availableFunctionsText: {
    fontSize: 11,
    color: '#555',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  noteText: {
    fontSize: 11,
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
    fontStyle: 'italic',
  },
});