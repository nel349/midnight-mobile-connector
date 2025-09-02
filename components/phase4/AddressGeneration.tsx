import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MidnightWallet } from '../../lib/midnightWallet';
import { generateWalletAddresses, MidnightAddress, MidnightNetworks } from '../../lib/addressGeneration';

interface Props {
  wallet: MidnightWallet | null;
}

export default function AddressGeneration({ wallet }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<MidnightAddress[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<keyof typeof MidnightNetworks>('TestNet');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied! 📋', `${label} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleGenerateAddresses = async () => {
    if (!wallet) {
      console.log('❌ No wallet available for address generation');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`🏠 Generating ${selectedNetwork} addresses...`);
      
      const newAddresses = await generateWalletAddresses(wallet.keyPairs, selectedNetwork);
      setAddresses(newAddresses);
      
      console.log(`✅ Generated ${newAddresses.length} ${selectedNetwork} addresses`);
      
    } catch (error) {
      console.error('❌ Address generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!wallet) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Generate Midnight Addresses</Text>
        <Text style={styles.subtitle}>Please generate a wallet first</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Midnight Addresses</Text>
      <Text style={styles.subtitle}>
        Create Bech32m addresses compatible with Lace wallet
      </Text>
      
      {/* Network Selection */}
      <View style={styles.networkContainer}>
        <Text style={styles.sectionTitle}>Network Type:</Text>
        <View style={styles.networkButtons}>
          {(Object.keys(MidnightNetworks) as Array<keyof typeof MidnightNetworks>).map((networkKey) => (
            <Button
              key={networkKey}
              title={networkKey}
              onPress={() => setSelectedNetwork(networkKey)}
              color={selectedNetwork === networkKey ? '#007AFF' : '#666'}
            />
          ))}
        </View>
      </View>
      
      {/* Generate Button */}
      <Button
        title={isLoading ? "Generating..." : addresses.length > 0 ? "✅ Addresses Generated" : "Generate Addresses"}
        onPress={handleGenerateAddresses}
        disabled={isLoading}
      />
      
      {/* Display Generated Addresses */}
      {addresses.length > 0 && (
        <ScrollView style={styles.addressContainer}>
          <Text style={styles.sectionTitle}>Generated {selectedNetwork} Addresses:</Text>
          {addresses.map((addr, index) => (
            <View key={index} style={styles.addressBox}>
              <View style={styles.addressHeader}>
                <Text style={styles.roleTitle}>{addr.network.toUpperCase()} - {wallet.keyPairs[index]?.role}</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(addr.address, `${addr.network.toUpperCase()} address`)}
                >
                  <Text style={styles.copyButtonText}>📋 Copy</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={() => copyToClipboard(addr.address, `${addr.network.toUpperCase()} address`)}>
                <Text style={styles.addressText} numberOfLines={2}>
                  {addr.address}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.keyDetails}>
                <TouchableOpacity onPress={() => copyToClipboard(addr.coinPublicKey, 'Coin public key')}>
                  <Text style={styles.keyDetail}>Coin: {addr.coinPublicKey.substring(0, 20)}... 📋</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => copyToClipboard(addr.encryptionPublicKey, 'Encryption public key')}>
                  <Text style={styles.keyDetail}>Enc: {addr.encryptionPublicKey.substring(0, 20)}... 📋</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      
      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🏠 Address Types:</Text>
        <Text style={styles.infoItem}>• Undeployed: Local development (mn_shield-addr_undeployed1...)</Text>
        <Text style={styles.infoItem}>• DevNet: Development network (mn_shield-addr_dev1...)</Text>
        <Text style={styles.infoItem}>• TestNet: Persistent testnet (mn_shield-addr_test1...)</Text>
        <Text style={styles.infoItem}>• MainNet: Production network (mn_shield-addr_mainnet1...)</Text>
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
  networkContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  networkButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  addressContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 15,
    maxHeight: 300,
  },
  addressBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    margin: 10,
    borderRadius: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#007AFF',
    marginBottom: 6,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
  },
  keyDetails: {
    marginTop: 4,
  },
  keyDetail: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6c757d',
    marginBottom: 2,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  infoItem: {
    fontSize: 11,
    color: '#1565c0',
    marginBottom: 3,
  },
});