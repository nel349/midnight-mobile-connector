import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MidnightWallet } from '../../lib/midnightWallet';

interface Props {
  wallet: MidnightWallet | null;
}

export default function KeyPairDisplay({ wallet }: Props) {
  if (!wallet || wallet.keyPairs.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generated Key Pairs</Text>
      <Text style={styles.subtitle}>
        Ed25519 keys for signing, X25519 keys for encryption
      </Text>
      
      <ScrollView style={styles.keyPairsList}>
        {wallet.keyPairs.map((keyPair, index) => (
          <View key={index} style={styles.keyPairBox}>
            <Text style={styles.roleName}>{keyPair.role}</Text>
            <Text style={styles.keyDetail}>HD Seed: {keyPair.hdSeed.substring(0, 20)}...</Text>
            {keyPair.coinPublicKey && (
              <>
                <Text style={styles.keyDetail}>Coin Key (Ed25519): {keyPair.coinPublicKey.substring(0, 20)}...</Text>
                <Text style={styles.keyDetail}>Encryption Key (X25519): {keyPair.encryptionPublicKey.substring(0, 20)}...</Text>
              </>
            )}
          </View>
        ))}
      </ScrollView>
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
    marginBottom: 15,
  },
  keyPairsList: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 300,
  },
  keyPairBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    margin: 10,
    borderRadius: 4,
  },
  roleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 6,
  },
  keyDetail: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6c757d',
    marginBottom: 2,
  },
});