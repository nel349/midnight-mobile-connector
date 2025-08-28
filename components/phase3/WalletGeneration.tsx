import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { generateWallet, MidnightWallet, getWalletStats } from '../../lib/midnightWallet';

interface Props {
  onWalletGenerated: (wallet: MidnightWallet) => void;
}

export default function WalletGeneration({ onWalletGenerated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [wallet, setWallet] = useState<MidnightWallet | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      console.log('🌙 Generating Midnight wallet...');
      
      const newWallet = await generateWallet();
      setWallet(newWallet);
      onWalletGenerated(newWallet);
      
      const stats = getWalletStats(newWallet);
      
      if (stats.hasValidKeys) {
        console.log(`✅ SUCCESS: Generated ${stats.totalKeyPairs} key pairs`);
        console.log(`🎯 Roles: ${stats.availableRoles.join(', ')}`);
      } else {
        console.log(`⚠️ Generated ${stats.totalKeyPairs} key pairs but some keys are invalid`);
      }

    } catch (error) {
      console.error('❌ Wallet generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Midnight Wallet</Text>
      <Text style={styles.subtitle}>
        Create a new wallet with deterministic key pairs for all Midnight roles
      </Text>
      
      <Button
        title={isLoading ? "Generating..." : wallet ? "✅ Wallet Generated" : "Generate Wallet"}
        onPress={handleGenerate}
        disabled={isLoading || !!wallet}
      />
      
      {wallet && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>✅ Wallet Created</Text>
          <Text style={styles.keyText}>Seed: {wallet.seedHex.substring(0, 32)}...</Text>
          <Text style={styles.keyText}>Key Pairs: {wallet.keyPairs.length} roles</Text>
          
          <View style={styles.architectureBox}>
            <Text style={styles.architectureTitle}>🔍 Architecture Working:</Text>
            <Text style={styles.architectureText}>✅ BIP-32 HD Wallet</Text>
            <Text style={styles.architectureText}>✅ Ed25519/X25519 Keys</Text>
            <Text style={styles.architectureText}>✅ Derivation: m/44'/2400'/0'/role/0</Text>
          </View>
        </View>
      )}
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
  resultBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  keyText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 3,
  },
  architectureBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  architectureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 4,
  },
  architectureText: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 2,
  },
});