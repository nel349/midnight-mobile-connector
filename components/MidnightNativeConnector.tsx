import React, { useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { MidnightMobileConnector, createTestnetConnector } from '../lib/MidnightMobileConnector';

interface WalletState {
  address?: string;
  coinPublicKey?: string;
  encryptionPublicKey?: string;
  balances?: { [key: string]: bigint };
}

export default function MidnightNativeConnector() {
  const [connector] = useState<MidnightMobileConnector>(() => createTestnetConnector());
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>(['🚀 Native Midnight Connector Ready']);

  const addLog = useCallback((message: string) => {
    console.log(message);
    setLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const generateNewWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      addLog('🔑 Generating new wallet with Web Crypto API...');
      const wallet = await connector.generateNewWallet();
      setWalletState(wallet);
      addLog(`✅ New wallet generated: ${wallet.address.substring(0, 20)}...`);
      Alert.alert('Success', 'New wallet generated successfully!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`❌ Wallet generation failed: ${errorMsg}`);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [connector, addLog]);

  const restoreFromSeed = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the genesis mint wallet seed from midnight-bank examples
      const genesisSeed = '0000000000000000000000000000000000000000000000000000000000000001';
      addLog('🔄 Restoring wallet from genesis seed...');
      
      const wallet = await connector.restoreFromSeed(genesisSeed);
      setWalletState(wallet);
      addLog(`✅ Wallet restored: ${wallet.address.substring(0, 20)}...`);
      Alert.alert('Success', 'Wallet restored from seed successfully!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`❌ Wallet restore failed: ${errorMsg}`);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [connector, addLog]);

  const connectToNetwork = useCallback(async () => {
    if (!walletState) {
      Alert.alert('Error', 'Please generate or restore a wallet first');
      return;
    }

    setIsLoading(true);
    try {
      addLog('🌐 Connecting to Midnight testnet...');
      await connector.connectToNetwork();
      addLog('✅ Connected to network');
      
      addLog('💰 Updating balance...');
      await connector.updateBalance();
      
      const updatedWallet = connector.getWalletState();
      if (updatedWallet) {
        setWalletState(updatedWallet);
        addLog(`💰 Balance: ${updatedWallet.balances?.native?.toString() || '0'} DUST`);
      }
      
      Alert.alert('Success', 'Connected to network and synced balance!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`❌ Network connection failed: ${errorMsg}`);
      Alert.alert('Network Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [connector, walletState, addLog]);

  const createTestTransaction = useCallback(async () => {
    if (!walletState) {
      Alert.alert('Error', 'Please generate or restore a wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // Use proper Midnight testnet address format for testing
      const testRecipient = 'mn_shield-addr_test1cq4k0d4sxsluqguvmqr7ntfzg5txj2xcey04pq682seexrdnelrqxqxzmqrj34cwcnaerl3cz55qlpy3cydf7wv0tc3sg34eavp2998jgq330k0a';
      const testAmount = 100n;
      
      addLog(`📝 Creating test transaction: ${testAmount} DUST to ${testRecipient.substring(0, 20)}...`);
      const transaction = await connector.createTransaction(testRecipient, testAmount);
      
      addLog(`✅ Transaction created: ${transaction.id}`);
      Alert.alert('Success', `Transaction created!\nID: ${transaction.id.substring(0, 20)}...`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`❌ Transaction creation failed: ${errorMsg}`);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [connector, walletState, addLog]);

  const exportSeed = useCallback(async () => {
    if (!walletState) {
      Alert.alert('Error', 'Please generate or restore a wallet first');
      return;
    }

    try {
      const seed = await connector.exportSeed();
      addLog(`🔐 Seed exported: ${seed.substring(0, 20)}...`);
      Alert.alert(
        'Wallet Seed', 
        `${seed}\n\n⚠️ Keep this safe! This is your wallet recovery phrase.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`❌ Seed export failed: ${errorMsg}`);
      Alert.alert('Error', errorMsg);
    }
  }, [connector, walletState, addLog]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🌙 Midnight Native Connector</Text>
      <Text style={styles.subtitle}>Built from scratch using Web Crypto API</Text>
      
      {/* Wallet Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Wallet Status</Text>
        {walletState ? (
          <View>
            <Text style={styles.statusText}>✅ Wallet Active</Text>
            <Text style={styles.addressText}>
              Address: {walletState.address?.substring(0, 30)}...
            </Text>
            <Text style={styles.balanceText}>
              Balance: {walletState.balances?.native?.toString() || '0'} DUST
            </Text>
          </View>
        ) : (
          <Text style={styles.statusText}>⏳ No wallet loaded</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? "Working..." : "🔑 Generate New Wallet"}
          onPress={generateNewWallet}
          disabled={isLoading}
        />
        
        <Button
          title={isLoading ? "Working..." : "🔄 Restore from Genesis Seed"}
          onPress={restoreFromSeed}
          disabled={isLoading}
        />
        
        <Button
          title={isLoading ? "Working..." : "🌐 Connect to Network"}
          onPress={connectToNetwork}
          disabled={isLoading || !walletState}
        />
        
        <Button
          title={isLoading ? "Working..." : "📝 Create Test Transaction"}
          onPress={createTestTransaction}
          disabled={isLoading || !walletState}
        />
        
        <Button
          title="🔐 Export Seed"
          onPress={exportSeed}
          disabled={isLoading || !walletState}
        />
      </View>

      {/* Logs */}
      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>📋 Activity Log</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </View>

      {/* Technical Info */}
      <View style={styles.techContainer}>
        <Text style={styles.techTitle}>🔧 Technical Details</Text>
        <Text style={styles.techText}>• Uses Web Crypto API (Ed25519 + X25519)</Text>
        <Text style={styles.techText}>• Bypasses broken WASM module</Text>
        <Text style={styles.techText}>• Implements Midnight protocols natively</Text>
        <Text style={styles.techText}>• Reverse engineered from midnight-bank</Text>
        <Text style={styles.techText}>• Ready for network integration</Text>
      </View>
    </ScrollView>
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
    marginBottom: 5,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontStyle: 'italic',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  logsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 300,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  logText: {
    fontSize: 12,
    color: '#444',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  techContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  techTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  techText: {
    fontSize: 12,
    color: '#388e3c',
    marginBottom: 3,
  },
});