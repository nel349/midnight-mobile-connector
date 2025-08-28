import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { HDWallet, generateRandomSeed, Roles } from '@midnight-ntwrk/wallet-sdk-hd';

/**
 * Step 2: Official Midnight HD Wallet SDK Test
 * 
 * Uses ONLY official @midnight-ntwrk/wallet-sdk-hd functions:
 * 1. generateRandomSeed() - official random seed generation
 * 2. HDWallet.fromSeed() - official HD wallet creation
 * 3. Account/role-based key derivation with official roles
 */
export default function Step2_SeedDerivation() {
  const [seedHex, setSeedHex] = useState<string>('');
  const [derivedKeys, setDerivedKeys] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const testOfficialSDK = async () => {
    setIsLoading(true);
    try {
      console.log('🏦 Testing official Midnight HD Wallet SDK...');
      
      // STEP 1: Generate random seed using official SDK
      console.log('🌱 Generating random seed...');
      const randomSeed = generateRandomSeed(); // Default 24 words = 32 bytes
      
      const seedHexString = Array.from(randomSeed)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      setSeedHex(seedHexString);
      console.log('✅ Random seed generated:', seedHexString.substring(0, 32) + '...');

      // STEP 2: Create HD wallet using official SDK
      console.log('🔑 Creating HD wallet...');
      const hdWalletResult = HDWallet.fromSeed(randomSeed);

      if (hdWalletResult.type === 'seedError') {
        throw new Error(`HD wallet creation failed: ${hdWalletResult.error}`);
      }

      console.log('✅ HD wallet created successfully!');

      // STEP 3: Test key derivation with official roles
      const hdWallet = hdWalletResult.hdWallet;
      const accountKey = hdWallet.selectAccount(0);
      
      const keys: {[key: string]: string} = {};
      
      // Test all official Midnight roles
      const roleNames = ['NightExternal', 'NightInternal', 'Dust', 'Zswap', 'Metadata'];
      const roleValues = [Roles.NightExternal, Roles.NightInternal, Roles.Dust, Roles.Zswap, Roles.Metadata];
      
      for (let i = 0; i < roleNames.length; i++) {
        const roleName = roleNames[i];
        const roleValue = roleValues[i];
        
        console.log(`🔐 Deriving key for role: ${roleName} (${roleValue})...`);
        const roleKey = accountKey.selectRole(roleValue);
        const keyResult = roleKey.deriveKeyAt(0);
        
        if (keyResult.type === 'keyDerived') {
          const keyHex = Array.from(keyResult.key)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          keys[roleName] = keyHex;
          console.log(`✅ ${roleName} key:`, keyHex.substring(0, 20) + '...');
        } else {
          console.log(`❌ ${roleName} key derivation failed: keyOutOfBounds`);
          keys[roleName] = 'KEY_OUT_OF_BOUNDS';
        }
      }
      
      setDerivedKeys(keys);

      Alert.alert(
        'Official SDK Success! 🏦',
        `Random seed generated!\nHD wallet created!\n${Object.keys(keys).length} role keys derived!`
      );

    } catch (error) {
      console.error('❌ Official SDK test failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      Alert.alert('SDK Test Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏦 Step 2: Official SDK</Text>
      <Text style={styles.subtitle}>Midnight HD Wallet SDK Test</Text>
      
      <Button
        title={isLoading ? "Testing..." : "Test Official SDK"}
        onPress={testOfficialSDK}
        disabled={isLoading}
      />
      
      {/* Seed Display */}
      {seedHex && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>✅ Official SDK Working!</Text>
          <Text style={styles.resultText}>Random Seed (32 bytes):</Text>
          <Text style={styles.seedText}>{seedHex}</Text>
        </View>
      )}

      {/* Derived Keys Display */}
      {Object.keys(derivedKeys).length > 0 && (
        <View style={styles.keysContainer}>
          <Text style={styles.keysTitle}>🔑 Derived Keys by Role:</Text>
          {Object.entries(derivedKeys).map(([role, key]) => (
            <View key={role} style={styles.keyItem}>
              <Text style={styles.keyRole}>{role}:</Text>
              <Text style={styles.keyText}>
                {key === 'KEY_OUT_OF_BOUNDS' ? '❌ Out of bounds' : key.substring(0, 20) + '...'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* SDK Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Official Midnight SDK:</Text>
        <Text style={styles.infoItem}>• generateRandomSeed() ✅</Text>
        <Text style={styles.infoItem}>• HDWallet.fromSeed() ✅</Text>
        <Text style={styles.infoItem}>• BIP32 account/role derivation ✅</Text>
        <Text style={styles.infoItem}>• 5 official roles: Night, Dust, Zswap, Metadata</Text>
        <Text style={styles.infoItem}>• @scure/bip32 backend</Text>
      </View>
    </View>
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
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  seedText: {
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    lineHeight: 16,
  },
  keysContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  keysTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  keyItem: {
    marginBottom: 8,
  },
  keyRole: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  keyText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#777',
    backgroundColor: '#f8f8f8',
    padding: 4,
    borderRadius: 2,
    marginTop: 2,
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