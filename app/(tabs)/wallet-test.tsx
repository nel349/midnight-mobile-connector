import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, TextInput } from 'react-native';
import { MidnightSDK } from '../../modules/wamr-turbomodule/src/MidnightSDK';

export default function WalletTest() {
  const [sdk] = useState(new MidnightSDK());
  const [status, setStatus] = useState<string>('Ready to test Midnight wallet creation');
  const [results, setResults] = useState<string[]>([]);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [wallet, setWallet] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const formatKey = (key: any): string => {
    if (key instanceof Uint8Array) {
      return Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return typeof key === 'string' ? key : String(key);
  };

  const initializeSDK = async () => {
    try {
      setStatus('🚀 Initializing Midnight SDK...');
      addResult('🚀 Initializing Midnight SDK...');
      
      await sdk.initialize();
      setIsInitialized(true);
      
      addResult('✅ SDK initialized successfully!');
      setStatus('✅ SDK Ready - You can now create wallets!');
    } catch (error) {
      const errorMessage = `❌ SDK initialization failed: ${error}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const generateNewWallet = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Please initialize SDK first');
      return;
    }

    try {
      setStatus('🔑 Generating new wallet...');
      addResult('🔑 Starting wallet generation...');
      
      // Generate 24-word mnemonic
      const newMnemonic = await sdk.generateMnemonic(256);
      setMnemonic(newMnemonic);
      addResult(`✅ Generated 24-word mnemonic: ${newMnemonic.split(' ').slice(0, 3).join(' ')}...`);
      
      // Create wallet from mnemonic
      addResult('🌱 Converting mnemonic to seed...');
      const seed = await sdk.mnemonicToSeed(newMnemonic);
      addResult(`✅ Seed generated: ${Array.from(seed.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
      
      // Generate SecretKeys from seed
      addResult('🔐 Generating SecretKeys from seed...');
      const secretKeys = await sdk.generateSecretKeysFromSeed(seed);
      addResult('✅ SecretKeys generated!');
      
      // Get public keys
      addResult('🔑 Extracting public keys...');
      const coinPublicKey = await sdk.getCoinPublicKey(secretKeys);
      const encryptionPublicKey = await sdk.getEncryptionPublicKey(secretKeys);
      
      const newWallet = {
        mnemonic: newMnemonic,
        seed,
        secretKeys,
        coinPublicKey,
        encryptionPublicKey
      };
      
      setWallet(newWallet);
      
      addResult(`✅ Coin Public Key: ${coinPublicKey}`);
      addResult(`✅ Encryption Public Key: ${encryptionPublicKey}`);
      
      setStatus('🎉 Wallet created successfully!');
      addResult('🎉 SUCCESS: Complete wallet created with mnemonic, seed, and keys!');
      
    } catch (error) {
      const errorMessage = `❌ Wallet generation failed: ${error}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const testQuickWallet = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Please initialize SDK first');
      return;
    }

    try {
      setStatus('⚡ Creating quick wallet...');
      addResult('⚡ Testing quick wallet creation (all-in-one)...');
      
      const quickWallet = await sdk.createWallet();
      setWallet(quickWallet);
      setMnemonic(quickWallet.mnemonic);
      
      addResult(`✅ Quick wallet created!`);
      addResult(`  📝 Mnemonic: ${quickWallet.mnemonic.split(' ').slice(0, 3).join(' ')}...`);
      addResult(`  🔑 Coin Key: ${quickWallet.coinPublicKey}`);
      addResult(`  🔒 Encryption Key: ${quickWallet.encryptionPublicKey}`);
      
      setStatus('🎉 Quick wallet created!');
      
    } catch (error) {
      const errorMessage = `❌ Quick wallet failed: ${error}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const testLaceCompatibleWallet = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Please initialize SDK first');
      return;
    }

    try {
      setStatus('🏦 Creating Lace-compatible wallet...');
      addResult('🏦 Testing Lace-compatible wallet (HD derivation)...');
      
      const laceWallet = await sdk.createLaceCompatibleWallet();
      setWallet(laceWallet);
      setMnemonic(laceWallet.mnemonic);
      
      addResult(`✅ Lace-compatible wallet created!`);
      addResult(`  📝 Mnemonic: ${laceWallet.mnemonic.split(' ').slice(0, 3).join(' ')}...`);
      addResult(`  🛤️ Derivation: ${laceWallet.derivationPath}`);
      addResult(`  🏦 Lace Compatible: ${laceWallet.isLaceCompatible}`);
      addResult(`  🔑 Coin Key: ${laceWallet.coinPublicKey}`);
      addResult(`  🔒 Encryption Key: ${laceWallet.encryptionPublicKey}`);
      
      setStatus('🎉 Lace-compatible wallet created!');
      
    } catch (error) {
      const errorMessage = `❌ Lace wallet failed: ${error}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const compareMethods = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Please initialize SDK first');
      return;
    }

    try {
      setStatus('🧪 Comparing derivation methods...');
      addResult('🧪 Testing derivation method differences...');
      
      const testMnemonic = await sdk.generateMnemonic(128); // Use same mnemonic for both
      
      addResult(`📝 Test mnemonic: ${testMnemonic.split(' ').slice(0, 3).join(' ')}...`);
      addResult('');
      
      // Test old method (direct seed)
      addResult('🔴 Testing OLD METHOD (Direct Seed):');
      const oldWallet = await sdk.createLaceCompatibleWallet(testMnemonic, false);
      addResult(`   Derivation: ${oldWallet.derivationPath}`);
      addResult(`   Coin Key: ${oldWallet.coinPublicKey.substring(0, 20)}...`);
      addResult(`   Enc Key: ${oldWallet.encryptionPublicKey.substring(0, 20)}...`);
      addResult('');
      
      // Test new method (HD derivation)
      addResult('🟢 Testing NEW METHOD (HD + CIP-1852):');
      const newWallet = await sdk.createLaceCompatibleWallet(testMnemonic, true);
      addResult(`   Derivation: ${newWallet.derivationPath}`);
      addResult(`   Coin Key: ${newWallet.coinPublicKey.substring(0, 20)}...`);
      addResult(`   Enc Key: ${newWallet.encryptionPublicKey.substring(0, 20)}...`);
      addResult('');
      
      const keysMatch = oldWallet.coinPublicKey === newWallet.coinPublicKey;
      addResult(`📊 Result: Keys ${keysMatch ? 'MATCH ❌' : 'DIFFERENT ✅ (Expected)'}`);
      addResult('');
      addResult('🎯 The NEW method should match Lace wallet!');
      
      setStatus('🎉 Method comparison complete');
      
    } catch (error) {
      const errorMessage = `❌ Comparison failed: ${error}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const testCryptoOperations = async () => {
    if (!wallet) {
      Alert.alert('Error', 'Please create a wallet first');
      return;
    }

    try {
      setStatus('🔐 Testing crypto operations...');
      addResult('🔐 Testing signing and verification...');
      
      // Test signing
      const dataToSign = {
        message: 'Hello from Midnight SDK!',
        timestamp: Date.now(),
        wallet: wallet.coinPublicKey
      };
      
      addResult(`📝 Signing data: ${JSON.stringify(dataToSign)}`);
      const signedData = await sdk.signData(dataToSign, wallet.secretKeys);
      addResult(`✅ Data signed successfully!`);
      
      // Test verification
      addResult('🔍 Verifying signature...');
      const isValid = await sdk.verifySignature(signedData);
      addResult(`✅ Signature verification result: ${isValid}`);
      
      // Test coin encoding
      addResult('💰 Testing coin encoding...');
      const coinInfo = {
        tokenType: 'MIDNIGHT',
        amount: 1000,
        owner: wallet.coinPublicKey,
        metadata: { network: 'testnet' }
      };
      
      const encoded = await sdk.encodeCoinInfo(coinInfo);
      addResult(`✅ Coin info encoded`);
      
      const decoded = await sdk.decodeCoinInfo(encoded);
      addResult(`✅ Coin info decoded: ${JSON.stringify(decoded)}`);
      
      setStatus('🎉 All crypto operations successful!');
      
    } catch (error) {
      const errorMessage = `❌ Crypto operations failed: ${error}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const restoreFromMnemonic = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Please initialize SDK first');
      return;
    }

    if (!mnemonic || mnemonic.trim().split(' ').length < 12) {
      Alert.alert('Error', 'Please enter a valid mnemonic (12 or 24 words)');
      return;
    }

    try {
      setStatus('📥 Restoring wallet from mnemonic...');
      addResult('📥 Restoring wallet from mnemonic...');
      
      // Validate mnemonic
      if (!await sdk.validateMnemonic(mnemonic.trim())) {
        throw new Error('Invalid mnemonic phrase');
      }
      addResult('✅ Mnemonic is valid');
      
      // Restore wallet
      const restoredWallet = await sdk.createWallet(mnemonic.trim());
      setWallet(restoredWallet);
      
      addResult(`✅ Wallet restored!`);
      addResult(`  🔑 Coin Key: ${restoredWallet.coinPublicKey}`);
      addResult(`  🔒 Encryption Key: ${restoredWallet.encryptionPublicKey}`);
      
      setStatus('🎉 Wallet restored successfully!');
      
    } catch (error) {
      const errorMessage = `❌ Restore failed: ${error}`;
      setStatus(errorMessage);
      addResult(errorMessage);
    }
  };

  const clearResults = () => {
    setResults([]);
    setStatus(isInitialized ? '✅ SDK Ready' : 'Ready to test Midnight wallet creation');
    setMnemonic('');
    setWallet(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Midnight Wallet SDK</Text>
      <Text style={styles.status}>{status}</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Initialize SDK"
          onPress={initializeSDK}
          disabled={isInitialized}
        />
        <Button
          title="Generate Wallet"
          onPress={generateNewWallet}
          disabled={!isInitialized}
        />
        <Button
          title="Quick Wallet"
          onPress={testQuickWallet}
          disabled={!isInitialized}
        />
        <Button
          title="Lace Wallet"
          onPress={testLaceCompatibleWallet}
          disabled={!isInitialized}
        />
        <Button
          title="Compare Methods"
          onPress={compareMethods}
          disabled={!isInitialized}
        />
        <Button
          title="Test Crypto"
          onPress={testCryptoOperations}
          disabled={!wallet}
        />
        <Button
          title="Clear"
          onPress={clearResults}
        />
      </View>

      {mnemonic && (
        <View style={styles.mnemonicContainer}>
          <Text style={styles.mnemonicTitle}>Mnemonic Phrase:</Text>
          <TextInput
            style={styles.mnemonicInput}
            value={mnemonic}
            onChangeText={setMnemonic}
            multiline
            placeholder="Enter mnemonic to restore wallet..."
          />
          <Button
            title="Restore from Mnemonic"
            onPress={restoreFromMnemonic}
            disabled={!isInitialized}
          />
        </View>
      )}

      {wallet && (
        <View style={styles.walletContainer}>
          <Text style={styles.walletTitle}>Current Wallet:</Text>
          <Text style={styles.walletText}>🔑 Coin Public Key:</Text>
          <Text style={styles.keyText}>{wallet.coinPublicKey}</Text>
          <Text style={styles.walletText}>🔒 Encryption Public Key:</Text>
          <Text style={styles.keyText}>{wallet.encryptionPublicKey}</Text>
        </View>
      )}

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={true}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  mnemonicContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  mnemonicTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  mnemonicInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    minHeight: 60,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 10,
  },
  walletContainer: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  walletTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  walletText: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
  },
  keyText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#666',
    marginBottom: 5,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    padding: 10,
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
    lineHeight: 16,
  },
});