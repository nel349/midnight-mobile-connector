import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { mnemonicToSeedBytes, validateMnemonicPhrase } from '../lib/mnemonicUtils';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { createIntegratedKeySet } from '../lib/keyDerivationUtils';
import { generateMidnightAddress } from '../lib/addressGeneration';
import { MidnightKeyPair } from '../lib/midnightWallet';

export default function LaceCompatibilityTest() {
  const [inputMnemonic, setInputMnemonic] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied! 📋', `${label} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const testLaceCompatibility = async () => {
    if (!inputMnemonic.trim()) {
      Alert.alert('Error', 'Please enter a mnemonic phrase');
      return;
    }

    if (!validateMnemonicPhrase(inputMnemonic.trim())) {
      Alert.alert('Error', 'Invalid mnemonic phrase');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Testing Lace compatibility...');
      
      // Convert mnemonic to seed
      const seed = await mnemonicToSeedBytes(inputMnemonic.trim());
      console.log('✅ Seed generated from mnemonic');

      // Create HD wallet
      const hdWalletResult = HDWallet.fromSeed(seed);
      if (hdWalletResult.type === 'seedError') {
        throw new Error(`HD wallet creation failed: ${hdWalletResult.error}`);
      }

      const hdWallet = hdWalletResult.hdWallet;
      const accountKey = hdWallet.selectAccount(0);
      console.log('✅ HD wallet created');

      // Test different role strategies
      const results: any = {
        mnemonic: inputMnemonic.trim(),
        seed: Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join(''),
        strategies: {}
      };

      // Strategy 1: NightExternal role only (most likely what Lace uses)
      console.log('🎯 Testing NightExternal only (Lace likely uses this)...');
      const nightExternalRole = accountKey.selectRole(Roles.NightExternal);
      const nightExternalKey = nightExternalRole.deriveKeyAt(0);
      
      if (nightExternalKey.type === 'keyDerived') {
        const integratedKeys = await createIntegratedKeySet(nightExternalKey.key, 'NightExternal');
        const keyPair: MidnightKeyPair = {
          role: 'NightExternal',
          hdSeed: Array.from(nightExternalKey.key).map(b => b.toString(16).padStart(2, '0')).join(''),
          coinPublicKey: integratedKeys.ed25519.publicKey,
          coinSecretKey: integratedKeys.ed25519.privateKey,
          encryptionPublicKey: integratedKeys.x25519.publicKey,
          encryptionSecretKey: integratedKeys.x25519.privateKey,
        };

        const testnetAddress = await generateMidnightAddress(keyPair, 'TestNet');
        results.strategies.nightExternalOnly = {
          role: 'NightExternal',
          address: testnetAddress.address,
          coinPublicKey: testnetAddress.coinPublicKey,
          encryptionPublicKey: testnetAddress.encryptionPublicKey
        };
        console.log('✅ NightExternal address:', testnetAddress.address.substring(0, 50) + '...');
      }

      // Strategy 2: Different indexes for NightExternal
      console.log('🎯 Testing different indexes for NightExternal...');
      for (let index = 0; index <= 2; index++) {
        const indexedKey = nightExternalRole.deriveKeyAt(index);
        if (indexedKey.type === 'keyDerived') {
          const integratedKeys = await createIntegratedKeySet(indexedKey.key, `NightExternal_${index}`);
          const keyPair: MidnightKeyPair = {
            role: `NightExternal_${index}`,
            hdSeed: Array.from(indexedKey.key).map(b => b.toString(16).padStart(2, '0')).join(''),
            coinPublicKey: integratedKeys.ed25519.publicKey,
            coinSecretKey: integratedKeys.ed25519.privateKey,
            encryptionPublicKey: integratedKeys.x25519.publicKey,
            encryptionSecretKey: integratedKeys.x25519.privateKey,
          };

          const testnetAddress = await generateMidnightAddress(keyPair, 'TestNet');
          results.strategies[`nightExternal_index_${index}`] = {
            role: `NightExternal_${index}`,
            address: testnetAddress.address,
            coinPublicKey: testnetAddress.coinPublicKey,
            encryptionPublicKey: testnetAddress.encryptionPublicKey
          };
          console.log(`✅ NightExternal[${index}] address:`, testnetAddress.address.substring(0, 50) + '...');
        }
      }

      // Strategy 3: All roles (our current approach)
      console.log('🎯 Testing all roles (our current approach)...');
      const roles = [
        { name: 'NightExternal', value: Roles.NightExternal },
        { name: 'NightInternal', value: Roles.NightInternal },
        { name: 'Dust', value: Roles.Dust },
        { name: 'Zswap', value: Roles.Zswap },
        { name: 'Metadata', value: Roles.Metadata }
      ];

      results.strategies.allRoles = [];
      for (const role of roles) {
        const roleKey = accountKey.selectRole(role.value);
        const keyResult = roleKey.deriveKeyAt(0);
        
        if (keyResult.type === 'keyDerived') {
          const integratedKeys = await createIntegratedKeySet(keyResult.key, role.name);
          const keyPair: MidnightKeyPair = {
            role: role.name,
            hdSeed: Array.from(keyResult.key).map(b => b.toString(16).padStart(2, '0')).join(''),
            coinPublicKey: integratedKeys.ed25519.publicKey,
            coinSecretKey: integratedKeys.ed25519.privateKey,
            encryptionPublicKey: integratedKeys.x25519.publicKey,
            encryptionSecretKey: integratedKeys.x25519.privateKey,
          };

          const testnetAddress = await generateMidnightAddress(keyPair, 'TestNet');
          results.strategies.allRoles.push({
            role: role.name,
            address: testnetAddress.address,
            coinPublicKey: testnetAddress.coinPublicKey,
            encryptionPublicKey: testnetAddress.encryptionPublicKey
          });
          console.log(`✅ ${role.name} address:`, testnetAddress.address.substring(0, 50) + '...');
        }
      }

      setTestResults(results);
      Alert.alert('Analysis Complete! 🔍', 'Check results below to compare with your Lace address');

    } catch (error) {
      console.error('❌ Lace compatibility test failed:', error);
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const loadYourMnemonic = () => {
    // You can replace this with your actual mnemonic for testing
    Alert.alert('Instructions', 'Please paste your mnemonic phrase in the text field above and tap "Analyze Derivation Paths"');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Lace Compatibility Analysis</Text>
      <Text style={styles.subtitle}>Compare derivation strategies with Lace wallet</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enter Your Mnemonic (same as in Lace):</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter the mnemonic phrase you used in Lace..."
          value={inputMnemonic}
          onChangeText={setInputMnemonic}
          multiline
          numberOfLines={3}
          secureTextEntry={false}
        />
        
        <View style={styles.buttonRow}>
          <Button
            title={isLoading ? "Analyzing..." : "🔍 Analyze Derivation Paths"}
            onPress={testLaceCompatibility}
            disabled={isLoading}
          />
          <Button
            title="Help"
            onPress={loadYourMnemonic}
          />
        </View>
      </View>

      {testResults && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🎯 Analysis Results</Text>
          <Text style={styles.comparison}>Compare these addresses with your Lace address:</Text>
          <Text style={styles.lacePrompt}>Lace address: {testResults.strategies.nightExternalOnly ? 'mn_shield-addr_test1su5usflnj95r59dauenl4z7wjaeep6kfv2429d9de7m482qfnu8qxqy6c83cqntu6z6jr83x0p27cu0euk7rzgl2ust7cd85l780s5rynuean62s' : '[Your Lace address]'}</Text>
          
          <Text style={styles.strategyTitle}>🎯 Most Likely Match (NightExternal only):</Text>
          {testResults.strategies.nightExternalOnly && (
            <View style={styles.addressBox}>
              <TouchableOpacity onPress={() => copyToClipboard(testResults.strategies.nightExternalOnly.address, 'NightExternal address')}>
                <Text style={styles.addressText}>{testResults.strategies.nightExternalOnly.address}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.strategyTitle}>🔢 Different Indexes:</Text>
          {[0, 1, 2].map(index => {
            const strategy = testResults.strategies[`nightExternal_index_${index}`];
            return strategy ? (
              <View key={index} style={styles.addressBox}>
                <Text style={styles.roleLabel}>NightExternal[{index}]:</Text>
                <TouchableOpacity onPress={() => copyToClipboard(strategy.address, `NightExternal[${index}] address`)}>
                  <Text style={styles.addressText}>{strategy.address}</Text>
                </TouchableOpacity>
              </View>
            ) : null;
          })}

          <Text style={styles.strategyTitle}>📋 All Roles (Our Current Approach):</Text>
          {testResults.strategies.allRoles && testResults.strategies.allRoles.map((roleAddr: any, index: number) => (
            <View key={index} style={styles.addressBox}>
              <Text style={styles.roleLabel}>{roleAddr.role}:</Text>
              <TouchableOpacity onPress={() => copyToClipboard(roleAddr.address, `${roleAddr.role} address`)}>
                <Text style={styles.addressText}>{roleAddr.address}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔍 How This Works:</Text>
        <Text style={styles.infoItem}>• Tests different BIP32 derivation strategies</Text>
        <Text style={styles.infoItem}>• NightExternal role is most likely what Lace uses</Text>
        <Text style={styles.infoItem}>• Compare results with your actual Lace address</Text>
        <Text style={styles.infoItem}>• Helps identify exact derivation path mismatch</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    marginBottom: 10,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resultContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  comparison: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  lacePrompt: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  strategyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#007AFF',
  },
  addressBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 8,
    borderRadius: 4,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#007AFF',
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 2,
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  infoItem: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 3,
  },
});