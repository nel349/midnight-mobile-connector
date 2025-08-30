/**
 * REAL Circuit Tester Component
 * 
 * 🚀 Clean, modular architecture with proper separation of concerns!
 * Built for future mobile developers to easily test Midnight smart contracts.
 * 
 * Features:
 * - Modular circuit implementations
 * - Reusable Compact standard library
 * - Generic circuit executor
 * - Clean UI component focused on presentation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { DEFAULT_CONTRACT_ADDRESS } from '../lib/constants';
import { 
  type ContractMap, 
  type ParsedCircuit, 
  loadContractInfo,
  validateParameter 
} from '../lib/contractParser';
import { CircuitExecutor, createBankContractExecutor, type CircuitExecutionResult } from '../lib/circuitExecutor';

interface RealCircuitTesterProps {
  onCircuitCall?: (circuit: ParsedCircuit, parameters: any[], result: any) => void;
  networkType?: 'local' | 'testnet';
}

interface CircuitCall {
  id: string;
  circuit: ParsedCircuit;
  parameters: Record<string, string>;
  result?: CircuitExecutionResult;
  error?: string;
  duration?: number;
  timestamp: string;
}

type TabType = 'read' | 'write' | 'utility' | 'all';

// Helper function to generate user-friendly placeholders
const getUserFriendlyPlaceholder = (arg: any): string => {
  if (arg.name.includes('user_id')) {
    return 'Enter username (e.g., nel349, alice)';
  }
  if (arg.name.includes('pin') || arg.name.includes('password')) {
    return 'Enter your PIN (e.g., 2911, mypin123)';
  }
  if (arg.name.includes('amount') || arg.name.includes('balance')) {
    return 'e.g., 1000';
  }
  if (arg.inputType === 'hex') {
    return 'e.g., abc123 or 0xabc123';
  }
  if (arg.inputType === 'number') {
    return 'e.g., 42';
  }
  return arg.placeholder || 'Enter value...';
};

export const RealCircuitTester: React.FC<RealCircuitTesterProps> = ({ 
  onCircuitCall, 
  networkType = 'local' 
}) => {
  const [contractMap, setContractMap] = useState<ContractMap | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabType>('read');
  const [selectedCircuit, setSelectedCircuit] = useState<ParsedCircuit | null>(null);
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [parameterErrors, setParameterErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [callHistory, setCallHistory] = useState<CircuitCall[]>([]);
  const [contractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [circuitExecutor, setCircuitExecutor] = useState<CircuitExecutor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse contract and initialize circuit executor
  useEffect(() => {
    async function initializeCircuitTester() {
      try {
        console.log('🔍 Loading real contract info...');
        const parsed = loadContractInfo();
        setContractMap(parsed);
        console.log('✅ Contract loaded successfully:', {
          pure: parsed.pure.length,
          impure: parsed.impure.length,
          total: parsed.all.length
        });

        console.log('🔧 Creating circuit executor...');
        const executor = await createBankContractExecutor(contractAddress, networkType || 'local');
        setCircuitExecutor(executor);
        setIsInitialized(true);
        console.log('✅ Circuit executor ready!');
      } catch (error) {
        console.error('❌ Failed to initialize circuit tester:', error);
        Alert.alert('Initialization Error', `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    initializeCircuitTester();
  }, [contractAddress, networkType]);

  // Get circuits for current tab
  const getCircuitsForTab = (): ParsedCircuit[] => {
    if (!contractMap) return [];
    
    switch (selectedTab) {
      case 'read':
        return contractMap.all.filter(c => c.category === 'read');
      case 'write':
        return contractMap.all.filter(c => c.category === 'write');
      case 'utility':
        return contractMap.all.filter(c => c.category === 'utility');
      case 'all':
        return contractMap.all;
      default:
        return [];
    }
  };

  // Handle circuit selection
  const handleSelectCircuit = (circuit: ParsedCircuit) => {
    setSelectedCircuit(circuit);
    // Initialize parameters with empty values
    const initialParams: Record<string, string> = {};
    circuit.arguments.forEach(arg => {
      initialParams[arg.name] = '';
    });
    setParameters(initialParams);
    setParameterErrors({});
  };

  // Handle parameter input
  const handleParameterChange = (paramName: string, value: string) => {
    setParameters(prev => ({ ...prev, [paramName]: value }));
    
    // Validate parameter
    const arg = selectedCircuit?.arguments.find(a => a.name === paramName);
    if (arg && value.trim()) {
      const validation = validateParameter(arg, value);
      setParameterErrors(prev => ({
        ...prev,
        [paramName]: validation.valid ? '' : (validation.error || 'Invalid input')
      }));
    } else {
      setParameterErrors(prev => ({ ...prev, [paramName]: '' }));
    }
  };

  // Validate all parameters
  const validateAllParameters = (): boolean => {
    if (!selectedCircuit) return false;
    
    let hasErrors = false;
    const errors: Record<string, string> = {};
    
    selectedCircuit.arguments.forEach(arg => {
      const value = parameters[arg.name];
      const validation = validateParameter(arg, value);
      if (!validation.valid) {
        errors[arg.name] = validation.error || 'Invalid input';
        hasErrors = true;
      }
    });
    
    setParameterErrors(errors);
    return !hasErrors;
  };

  // Execute circuit call
  const handleExecuteCircuit = async () => {
    if (!selectedCircuit) {
      Alert.alert('Error', 'Please select a circuit first');
      return;
    }

    if (!validateAllParameters()) {
      Alert.alert('Validation Error', 'Please fix parameter errors before executing');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();
    
    const newCall: CircuitCall = {
      id: `call_${Date.now()}`,
      circuit: selectedCircuit,
      parameters: { ...parameters },
      timestamp: new Date().toLocaleTimeString(),
    };

    try {
      if (!circuitExecutor) {
        throw new Error('Circuit executor not ready');
      }

      // Execute circuit using the modular executor
      const result = await circuitExecutor.executeCircuit(selectedCircuit, parameters);
      
      newCall.result = result;
      newCall.duration = result.duration;

      setCallHistory(prev => [newCall, ...prev.slice(0, 9)]); // Keep last 10 calls
      onCircuitCall?.(selectedCircuit, result.parameters, result);

      // Show success message
      const resultPreview = result.success ? 
        `\n\n💎 REAL Result (${result.data.type}):\n${result.data.resultPreview || result.data.result}` :
        `\n\n❌ Error: ${result.data.error}`;

      Alert.alert(
        result.success ? 'REAL Circuit Executed! 🎉' : 'Circuit Error ❌',
        `${result.success ? '✅' : '❌'} ${selectedCircuit.name}\n⏱️ ${result.duration}ms\n🎯 Type: ${selectedCircuit.category}\n🎯 REAL Circuit Call\n📋 Expected: ${selectedCircuit.resultType}\n\n🔧 Parameter Conversion:\n${result.parameterPreview}${resultPreview}`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      newCall.error = error instanceof Error ? error.message : 'Unknown error';
      newCall.duration = duration;
      
      setCallHistory(prev => [newCall, ...prev.slice(0, 9)]);

      Alert.alert(
        'Circuit Error',
        `❌ ${selectedCircuit.name}\n⏱️ ${duration}ms\n🚨 ${newCall.error}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state
  if (!contractMap) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🔍 Parsing contract...</Text>
      </View>
    );
  }

  const currentCircuits = getCircuitsForTab();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚀 Real Circuit Tester</Text>
      <Text style={styles.subtitle}>
        Clean modular architecture • Real contract circuits • No mocks!
      </Text>

      {/* Contract Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          📊 {contractMap.pure.length} pure, {contractMap.impure.length} impure circuits
        </Text>
        <Text style={styles.networkText}>Network: {networkType.toUpperCase()}</Text>
        <Text style={[styles.networkText, { 
          color: isInitialized ? '#4CAF50' : '#FF9800' 
        }]}>
          {isInitialized ? '✅ Circuit executor ready' : '⏳ Initializing circuit executor...'}
        </Text>
      </View>

      {/* Tab Selection */}
      <View style={styles.tabContainer}>
        {(['read', 'write', 'utility', 'all'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && ` (${contractMap.all.filter(c => c.category === tab).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Circuit Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Circuit</Text>
        {currentCircuits.map(circuit => (
          <TouchableOpacity
            key={circuit.name}
            style={[
              styles.circuitItem,
              selectedCircuit?.name === circuit.name && styles.circuitItemSelected
            ]}
            onPress={() => handleSelectCircuit(circuit)}
          >
            <Text style={styles.circuitName}>
              {circuit.isPure ? '🔒' : '🔧'} {circuit.name}
            </Text>
            <Text style={styles.circuitDescription}>{circuit.description}</Text>
            <Text style={styles.circuitInfo}>
              {circuit.arguments.length} params → {circuit.resultType}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parameter Input */}
      {selectedCircuit && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Parameters for {selectedCircuit.name}
          </Text>
          
          {selectedCircuit.arguments.length === 0 ? (
            <Text style={styles.noParamsText}>No parameters required</Text>
          ) : (
            selectedCircuit.arguments.map(arg => (
              <View key={arg.name} style={styles.parameterGroup}>
                <Text style={styles.parameterLabel}>
                  {arg.name.includes('pin') ? `${arg.name} (enter as text)` : 
                   arg.name.includes('user_id') ? `${arg.name} (enter as text)` : 
                   `${arg.name} (${arg.type})`}
                </Text>
                <Text style={styles.parameterDescription}>{arg.description}</Text>
                
                {/* User-friendly input hint */}
                {(arg.name.includes('user_id') || arg.name.includes('pin')) && (
                  <Text style={styles.inputHint}>
                    💡 Enter as plain text (will auto-convert to bytes)
                  </Text>
                )}
                {arg.inputType === 'hex' && !arg.name.includes('user_id') && !arg.name.includes('pin') && (
                  <Text style={styles.inputHint}>
                    💡 Enter hex (with or without 0x prefix, auto-padding applied)
                  </Text>
                )}
                {arg.inputType === 'number' && (
                  <Text style={styles.inputHint}>
                    💡 Enter as number (will convert to BigInt)
                  </Text>
                )}
                
                <TextInput
                  style={[
                    styles.parameterInput,
                    parameterErrors[arg.name] && styles.parameterInputError
                  ]}
                  value={parameters[arg.name] || ''}
                  onChangeText={(value) => handleParameterChange(arg.name, value)}
                  placeholder={getUserFriendlyPlaceholder(arg)}
                  autoCapitalize="none"
                  keyboardType={arg.inputType === 'number' ? 'numeric' : 'default'}
                />
                {parameterErrors[arg.name] && (
                  <Text style={styles.parameterError}>{parameterErrors[arg.name]}</Text>
                )}
              </View>
            ))
          )}

          {/* Execute Button */}
          <TouchableOpacity
            style={[styles.executeButton, isLoading && styles.executeButtonDisabled]}
            onPress={handleExecuteCircuit}
            disabled={isLoading}
          >
            <Text style={styles.executeButtonText}>
              {isLoading ? '⏳ Executing...' : `🚀 Execute ${selectedCircuit.name}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Call History */}
      {callHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Calls ({callHistory.length})</Text>
          {callHistory.map(call => (
            <View key={call.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyFunction}>
                  {call.circuit.isPure ? '🔒' : '🔧'} {call.circuit.name}
                </Text>
                <Text style={styles.historyTime}>{call.timestamp}</Text>
              </View>
              
              {call.result ? (
                <Text style={[styles.historySuccess, !call.result.success && styles.historyError]}>
                  {call.result.success ? '✅' : '❌'} {call.result.success ? 'Success' : 'Failed'} ({call.duration}ms)
                  {call.result.success && call.result.data.resultPreview && 
                    `\n💎 ${call.result.data.resultPreview}`
                  }
                </Text>
              ) : call.error ? (
                <Text style={styles.historyError}>
                  ❌ {call.error} ({call.duration}ms)
                </Text>
              ) : (
                <Text style={styles.historyError}>
                  ❌ Unknown error ({call.duration}ms)
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565c0',
  },
  networkText: {
    fontSize: 12,
    color: '#1976d2',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 4,
  },
  tabActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  circuitItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  circuitItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  circuitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  circuitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  circuitInfo: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  noParamsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  parameterGroup: {
    marginBottom: 16,
  },
  parameterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  parameterDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  parameterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    fontFamily: 'monospace',
  },
  parameterInputError: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  parameterError: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  executeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  executeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  executeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyFunction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
  },
  historySuccess: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  historyError: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '500',
  },
});
