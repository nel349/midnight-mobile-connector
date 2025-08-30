import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { createTestnetContractClient, MidnightContractClient } from '../lib/midnightContractClient';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [contractAddress, setContractAddress] = useState('mn_contract_test1234567890abcdef');
  const [functionName, setFunctionName] = useState('getBalance');
  const [parameters, setParameters] = useState('["0x123"]');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleInitializeClient = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Initializing Midnight Contract Client...');
      const contractClient = createTestnetContractClient();
      const networkInfo = contractClient.getNetworkInfo();
      
      setClient(contractClient);
      setIsInitialized(true);
      
      Alert.alert(
        'Client Initialized', 
        `✅ Contract client ready\nNetwork: ${networkInfo.name}\nID: ${networkInfo.networkId}`
      );
      
    } catch (error) {
      console.error('Contract client initialization failed:', error);
      Alert.alert('Initialization Failed', `❌ ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectContract = async () => {
    if (!client) {
      Alert.alert('Error', 'Please initialize client first');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`🔗 Connecting to contract: ${contractAddress}`);
      await client.connectToContract(contractAddress, {}); // Empty ABI for placeholder
      Alert.alert('Contract Connected', `✅ Connected to\n${contractAddress.substring(0, 30)}...`);
      
    } catch (error) {
      console.error('Contract connection failed:', error);
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
        <Text style={styles.sectionTitle}>Contract Configuration</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Contract Address:</Text>
          <TextInput
            style={styles.textInput}
            value={contractAddress}
            onChangeText={setContractAddress}
            placeholder="mn_contract_..."
            editable={!isLoading}
          />

          <Text style={styles.inputLabel}>Function Name:</Text>
          <TextInput
            style={styles.textInput}
            value={functionName}
            onChangeText={setFunctionName}
            placeholder="getBalance"
            editable={!isLoading}
          />

          <Text style={styles.inputLabel}>Parameters (JSON):</Text>
          <TextInput
            style={styles.textInput}
            value={parameters}
            onChangeText={setParameters}
            placeholder='["0x123"] or "single_param"'
            editable={!isLoading}
            multiline
          />
        </View>
      </View>

      {/* Contract Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contract Actions</Text>
        <View style={styles.card}>
          <Button
            title="🔗 Connect to Contract"
            onPress={handleConnectContract}
            disabled={!isInitialized || isLoading}
            color="#34C759"
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
});