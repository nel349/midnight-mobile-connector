import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { testWalletConsistency, MidnightWallet } from '../../lib/midnightWallet';

interface Props {
  wallet: MidnightWallet | null;
}

export default function ConsistencyTest({ wallet }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    if (!wallet) {
      Alert.alert('No Wallet', 'Generate a wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const consistent = await testWalletConsistency(wallet);
      
      // Results are already logged in the SDK function

    } catch (error) {
      console.error('❌ Consistency test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Key Consistency</Text>
      <Text style={styles.subtitle}>
        Verify that the same seed produces identical key pairs
      </Text>
      
      <Button
        title={isLoading ? "Testing..." : "Test Deterministic Keys"}
        onPress={handleTest}
        disabled={isLoading || !wallet}
      />
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔧 Mobile Architecture:</Text>
        <Text style={styles.infoItem}>• BIP-32 HD Wallet (m/44'/2400'/account'/role/index)</Text>
        <Text style={styles.infoItem}>• Ed25519 keys for coin operations</Text>
        <Text style={styles.infoItem}>• X25519 keys for encryption</Text>
        <Text style={styles.infoItem}>• Production SHA-256 with crypto-js</Text>
        <Text style={styles.infoItem}>• Mobile-compatible - NO WASM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  infoItem: {
    fontSize: 12,
    color: '#388e3c',
    marginBottom: 3,
  },
});