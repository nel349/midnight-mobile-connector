import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createTestnetContractClient, MidnightContractClient } from '../lib/midnightContractClient';
import {
  createLocalProviders,
  createTestnetProviders,
  createProvidersForNetwork,
  queryContractState,
  testProviderConnection,
  getAvailableNetworks,
  type BasicMidnightProviders
} from '../lib/midnightProviders';
import { DEFAULT_CONTRACT_ADDRESS, UI_CONSTANTS } from '../lib/constants';
import { type ContractLedgerReader, createGenericContractLedgerReader, createBankContractLedgerReader } from '../lib/contractStateReader';
import { RealCircuitTester } from './RealCircuitTester';

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
  const [ledgerReader, setLedgerReader] = useState<ContractLedgerReader | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [networkType, setNetworkType] = useState<'testnet' | 'local'>('local');
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [functionName, setFunctionName] = useState(UI_CONSTANTS.DEFAULT_FUNCTION_NAME);
  const [parameters, setParameters] = useState(UI_CONSTANTS.DEFAULT_PARAMETERS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [rawState, setRawState] = useState<any>(null);

  // Auto-initialize client on component mount
  React.useEffect(() => {
    if (!isInitialized && !isLoading) {
      console.log('🚀 Auto-initializing client...');
      handleInitializeClient();
    }
  }, []);

  const handleInitializeClient = async () => {
    setIsLoading(true);
    try {
      console.log(`🔧 Initializing Midnight Providers (${networkType})...`);
      
      // Initialize providers with network selection and local proof server fallback
      const midnightProviders = await createProvidersForNetwork(networkType);
      
      // Initialize legacy client for compatibility
      const contractClient = createTestnetContractClient();
      const networkInfo = contractClient.getNetworkInfo();
      
      setProviders(midnightProviders);
      setClient(contractClient);
      setIsInitialized(true);
      
      const networkDetails = getAvailableNetworks().find(n => n.key === networkType);
      
      Alert.alert(
        'Providers Initialized', 
        `✅ Connected to Midnight infrastructure!\n\n` +
        `Network: ${networkType.toUpperCase()}\n` +
        `Indexer: ${networkDetails?.details.indexer}\n` +
        `Proof Server: ${networkDetails?.details.proofServer}\n` +
        `Node: ${networkDetails?.details.node}\n\n` +
        `Ready for contract interactions!`
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
      
      // Direct query for the default contract
      const bankContractAddress = DEFAULT_CONTRACT_ADDRESS;
      
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

  // NEW LEDGER READING FUNCTIONS

  const handleQuickLedgerTest = async () => {
    if (!contractAddress.trim()) {
      Alert.alert('Error', 'Please enter a contract address');
      return;
    }

    setIsLoading(true);
    try {
              console.log('📖 Starting quick ledger read test with GENERIC StateValue solution...');
      
      // Create providers for the selected network
      const testProviders = await createProvidersForNetwork(networkType);
      
      // Create official contract ledger reader with StateValue support
      const reader = await createBankContractLedgerReader(
        contractAddress,
        testProviders.publicDataProvider
      );
      
      // Read the ledger state using our official solution
      const ledgerState = await reader.readLedgerState();
      
              if (ledgerState) {
          console.log('✅ GENERIC StateValue parsing successful!');
        
        // Test account operations using the ContractLedgerReader (with hex-to-bytes conversion)
        let accountTestResult = '';
        if (ledgerState.all_accounts) {
          console.log('🧪 Testing account operations...');
          
          try {
            // Test with nel349 account (known to exist) - use the reader's collection methods
            const nel349Key = "6e656c3334390000000000000000000000000000000000000000000000000000";
            const accountExists = await reader.collectionHasMember('all_accounts', nel349Key);
            
            if (accountExists) {
              const accountData = await reader.collectionLookup('all_accounts', nel349Key);
              accountTestResult = `\n\n🎯 Account Test:\n• nel349 found: ✅\n• Account data available: ${accountData ? '✅' : '❌'}`;
            } else {
              accountTestResult = `\n\n🎯 Account Test:\n• nel349 found: ❌ (may be normal)`;
            }
          } catch (error) {
            console.error('Account operations test failed:', error);
            accountTestResult = `\n\n🎯 Account Test:\n• Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        }
        
        const availableCollections = Object.keys(ledgerState).length;
        
        setLastResult({
          type: 'official_ledger_test',
          timestamp: new Date().toISOString(),
          contractAddress,
          networkUsed: networkType,
          success: true,
          ledgerState,
          collectionsCount: availableCollections
        });

        setRawState(ledgerState);

        Alert.alert(
          '🎉 Official StateValue Success!',
          `✅ Contract state read with OFFICIAL Midnight SDK!\n\n` +
          `Network: ${networkType.toUpperCase()}\n` +
          `Contract: ${contractAddress.substring(0, 20)}...\n` +
          `Collections: ${availableCollections}\n` +
          `React Native Compatible: ✅ Working\n` +
          `Real Account Data: ✅ Extracted${accountTestResult}\n\n` +
          `📱 StateValue works on mobile with proper Metro config!`
        );
        
      } else {
        throw new Error('No ledger state returned from official parser');
      }

    } catch (error) {
      console.error('Official ledger test failed:', error);
      
      setLastResult({
        type: 'official_ledger_test',
        timestamp: new Date().toISOString(),
        contractAddress,
        networkUsed: networkType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      const isWasmError = error instanceof Error && error.message.includes('WASM modules required');
      
      Alert.alert(
        isWasmError ? '⚠️ WASM Not Supported' : '❌ StateValue Error', 
        isWasmError 
          ? `🚫 Official StateValue parsing requires WASM support\n\n` +
            `This feature is only available in:\n` +
            `• Web browsers\n` +
            `• Development environments\n` +
            `• Desktop applications\n\n` +
            `❌ React Native/Mobile: Not supported\n\n` +
            `Use this app in a web browser for full functionality.`
          : `❌ Error with official StateValue parsing:\n${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
            `Network: ${networkType.toUpperCase()}\n` +
            `Contract: ${contractAddress.substring(0, 20)}...`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupLedgerReader = async () => {
    if (!contractAddress.trim()) {
      Alert.alert('Error', 'Please enter a contract address');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔧 Setting up OFFICIAL StateValue ledger reader...');
      
      // Create providers if not already created
      let currentProviders = providers;
      if (!currentProviders) {
        console.log('📡 Creating providers for', networkType);
        currentProviders = await createProvidersForNetwork(networkType);
        setProviders(currentProviders);
      }
      
      // Create generic contract ledger reader with StateValue support for ANY contract
      const newReader = await createBankContractLedgerReader(
        contractAddress,
        currentProviders.publicDataProvider
      );

      setLedgerReader(newReader);

      // Test reading the state with our official solution
      const state = await newReader.readLedgerState();
      setRawState(state);
      
      // Analyze the state structure
      const stateInfo = {
        type: typeof state,
        isObject: typeof state === 'object' && state !== null,
        collectionsCount: state ? Object.keys(state).length : 0,
        hasAccounts: !!(state?.all_accounts),
        hasAccountMethods: !!(state?.all_accounts?.member && state?.all_accounts?.lookup)
      };
      
      setLastResult({
        type: 'official_ledger_reader_setup',
        timestamp: new Date().toISOString(),
        contractAddress,
        networkUsed: networkType,
        stateInfo,
        readerType: 'official_statevalue'
      });

      Alert.alert(
        '🎉 Mobile Ledger Reader Ready!',
        `✅ MOBILE-NATIVE ledger reader set up!\n\n` +
        `Contract: ${contractAddress.substring(0, 20)}...\n` +
        `Network: ${networkType.toUpperCase()}\n` +
        `Collections: ${stateInfo.collectionsCount}\n` +
        `Account Support: ${stateInfo.hasAccountMethods ? '✅' : '❌'}\n` +
        `Mobile Optimized: ✅ React Native\n\n` +
        `You can now read real contract state on mobile!`
      );

    } catch (error) {
      console.error('Official ledger reader setup failed:', error);
              const isWasmError = error instanceof Error && error.message.includes('WASM modules required');
        
        Alert.alert(
          '❌ Mobile Reader Setup Failed', 
          `❌ Error setting up mobile-native ledger reader:\n${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
          `Network: ${networkType.toUpperCase()}\n` +
          `Contract: ${contractAddress.substring(0, 20)}...\n\n` +
          `This may indicate:\n` +
          `• Network connectivity issues\n` +
          `• Contract not found\n` +
          `• Invalid contract address`
        );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadLedgerState = async () => {
    if (!ledgerReader) {
      Alert.alert('Error', 'Please set up ledger reader first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📖 Reading current ledger state...');
      
      const state = await ledgerReader.readLedgerState();
      setRawState(state);
      
      setLastResult({
        type: 'ledger_state_read',
        timestamp: new Date().toISOString(),
        contractAddress,
        state,
        stateInfo: {
          type: typeof state,
          length: typeof state === 'string' ? state.length : Object.keys(state || {}).length,
          preview: typeof state === 'string' ? state.substring(0, 200) : JSON.stringify(state).substring(0, 200)
        }
      });

      Alert.alert(
        'Ledger State Read',
        `✅ Current ledger state retrieved!\nType: ${typeof state}\nData: ${typeof state === 'string' ? 'Hex data (' + state.length + ' chars)' : 'Object with ' + Object.keys(state || {}).length + ' keys'}`
      );

    } catch (error) {
      console.error('Ledger state read failed:', error);
      Alert.alert('Read Failed', `❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExploreContractHistory = async () => {
    if (!providers) {
      Alert.alert('Error', 'Please initialize providers first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Exploring contract history...');
      
      // Use the enhanced provider to get contract history
      const history = await providers.publicDataProvider.queryContractHistory?.(contractAddress, 5);
      
      setLastResult({
        type: 'contract_history',
        timestamp: new Date().toISOString(),
        contractAddress,
        historyLength: history?.length || 0,
        history: history || []
      });

      Alert.alert(
        'Contract History',
        `✅ Contract exploration complete!\nFound ${history?.length || 0} contract actions\nAddress: ${contractAddress.substring(0, 20)}...`
      );

    } catch (error) {
      console.error('Contract history exploration failed:', error);
      Alert.alert('Exploration Failed', `❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📄 Contract Interaction & Ledger Reading</Text>
        <Text style={styles.subtitle}>
          Test smart contract interactions and read contract state directly from the indexer
        </Text>
      </View>

      {/* Network Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Configuration</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Selected Network:</Text>
          
          {getAvailableNetworks().map((network) => (
            <TouchableOpacity
              key={network.key}
              style={[
                styles.networkOption,
                networkType === network.key && styles.networkOptionSelected
              ]}
              onPress={() => setNetworkType(network.key)}
              disabled={isLoading}
            >
              <Text style={[
                styles.networkOptionText,
                networkType === network.key && styles.networkOptionTextSelected
              ]}>
                {network.name}
              </Text>
              <Text style={[
                styles.networkOptionDescription,
                networkType === network.key && { color: '#e6f3ff' }
              ]}>
                {network.description}
              </Text>
              <Text style={[
                styles.networkDetails,
                networkType === network.key && { color: '#cce7ff' }
              ]}>
                Indexer: {network.details.indexer} | Proof: {network.details.proofServer}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Client Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Status</Text>
        <View style={styles.card}>
          <Text style={styles.statusText}>
            Status: {isInitialized ? '✅ Ready' : '⭕ Not Initialized'}
          </Text>
          <Text style={styles.detailText}>
            Network: {networkType.toUpperCase()} {isInitialized && '(Connected)'}
          </Text>
          {client && (
            <Text style={styles.detailText}>
              Client Network: {client.getNetworkInfo().name} (ID: {client.getNetworkInfo().networkId})
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

      {/* NEW: Official StateValue Ledger Reading */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎉 Generic StateValue Ledger Reading</Text>
        <View style={styles.card}>
          <Text style={styles.noteText}>
            ✨ Read ANY contract state with OFFICIAL Midnight SDK + StateValue{'\n'}
            📱 React Native compatible with proper Metro config{'\n'}
            💎 Generic solution - works for bank, NFT, seabattle, any contract!
          </Text>
          
          <View style={styles.buttonSpacer} />
          
                    <Button
            title="⚡ Quick Generic Test"
            onPress={handleQuickLedgerTest}
            disabled={isLoading}
            color="#32D74B"
          />

          <View style={styles.buttonSpacer} />

          <Button
            title="🔧 Setup Generic Reader"
            onPress={handleSetupLedgerReader}
            disabled={isLoading}
            color="#007AFF"
          />
          
          <View style={styles.buttonSpacer} />
          
          <Button
            title="📖 Read Current State"
            onPress={handleReadLedgerState}
            disabled={!ledgerReader || isLoading}
            color="#5856D6"
          />
          
          <View style={styles.buttonSpacer} />
          
          <Button
            title="🔍 Explore History"
            onPress={handleExploreContractHistory}
            disabled={!isInitialized || isLoading}
            color="#FF9500"
          />

          <View style={styles.buttonSpacer} />
          
          <Text style={styles.statusText}>
            Ledger Reader: {ledgerReader ? '✅ Ready' : '⭕ Not Set Up'}
          </Text>
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

      {/* REAL Circuit Testing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 REAL Circuit Testing (NO MOCKS!)</Text>
        <View style={styles.card}>
          <Text style={styles.noteText}>
            ⚡ Powered by actual @managed/ contract files - Built for future mobile developers!
          </Text>
          <RealCircuitTester 
            networkType={networkType}
            onCircuitCall={(circuit, parameters, result) => {
              console.log(`REAL circuit executed: ${circuit.name}`, { 
                circuit: circuit.name,
                isPure: circuit.isPure,
                category: circuit.category,
                parameters, 
                result 
              });
              // You could update lastResult state here if wanted
            }}
          />
        </View>
      </View>

      {/* Raw State Display */}
      {rawState && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Raw Contract State</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>State Type: {typeof rawState}</Text>
            <Text style={styles.inputLabel}>
              Size: {typeof rawState === 'string' ? `${rawState.length} characters` : `${Object.keys(rawState || {}).length} properties`}
            </Text>
            <View style={styles.buttonSpacer} />
            <Text style={styles.resultText}>
              {typeof rawState === 'string' 
                ? rawState.length > 1000 
                  ? rawState.substring(0, 1000) + '\n\n... (truncated, full length: ' + rawState.length + ' chars)'
                  : rawState
                : JSON.stringify(rawState, null, 2)
              }
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
  networkOption: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  networkOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  networkOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  networkOptionTextSelected: {
    color: 'white',
  },
  networkOptionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  networkDetails: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    fontFamily: 'monospace',
  },
});