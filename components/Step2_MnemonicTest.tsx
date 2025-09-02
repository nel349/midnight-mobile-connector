import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { generateMnemonicPhrase, mnemonicToSeedBytes, validateMnemonicPhrase, getMnemonicWordCount, isValidMnemonicLength } from '../lib/mnemonicUtils';
import { createWalletFromSeed, MidnightWallet } from '../lib/midnightWallet';
import { createLaceCompatibleWallet, LaceCompatibleWallet } from '../lib/laceCompatibleAddressGeneration';
import AddressGeneration from './phase4/AddressGeneration';

export default function Step2_MnemonicTest() {
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string>('');
  const [seedHex, setSeedHex] = useState<string>('');
  const [inputMnemonic, setInputMnemonic] = useState<string>('');
  const [isValidInput, setIsValidInput] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedWallet, setGeneratedWallet] = useState<MidnightWallet | null>(null);
  const [laceCompatibleWallet, setLaceCompatibleWallet] = useState<LaceCompatibleWallet | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied! 📋', `${label} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const generateMnemonic12 = async () => {
    setIsLoading(true);
    try {
      console.log('🎲 Generating 12-word mnemonic...');
      const result = await generateMnemonicPhrase(128);
      
      setGeneratedMnemonic(result.mnemonic);
      setSeedHex(Array.from(result.seed).map(b => b.toString(16).padStart(2, '0')).join(''));
      
      // Create wallet from the generated seed
      console.log('🏦 Creating wallet from mnemonic seed...');
      const wallet = await createWalletFromSeed(result.seed);
      setGeneratedWallet(wallet);
      
      // Create Lace-compatible wallet (single address using NightExternal)
      console.log('🏦 Creating Lace-compatible wallet...');
      const nightExternalKeyPair = wallet.keyPairs.find(kp => kp.role === 'NightExternal');
      if (nightExternalKeyPair) {
        const laceWallet = await createLaceCompatibleWallet(nightExternalKeyPair, 'testnet');
        setLaceCompatibleWallet(laceWallet);
      }
      
      Alert.alert('Success! 🎲', '12-word mnemonic generated successfully!\nWallet and Lace-compatible address created.');
      
    } catch (error) {
      console.error('❌ Mnemonic generation failed:', error);
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMnemonic24 = async () => {
    setIsLoading(true);
    try {
      console.log('🎲 Generating 24-word mnemonic...');
      const result = await generateMnemonicPhrase(256);
      
      setGeneratedMnemonic(result.mnemonic);
      setSeedHex(Array.from(result.seed).map(b => b.toString(16).padStart(2, '0')).join(''));
      
      // Create wallet from the generated seed
      console.log('🏦 Creating wallet from mnemonic seed...');
      const wallet = await createWalletFromSeed(result.seed);
      setGeneratedWallet(wallet);
      
      // Create Lace-compatible wallet (single address using NightExternal)
      console.log('🏦 Creating Lace-compatible wallet...');
      const nightExternalKeyPair = wallet.keyPairs.find(kp => kp.role === 'NightExternal');
      if (nightExternalKeyPair) {
        const laceWallet = await createLaceCompatibleWallet(nightExternalKeyPair, 'testnet');
        setLaceCompatibleWallet(laceWallet);
      }
      
      Alert.alert('Success! 🎲', '24-word mnemonic generated successfully!\nWallet and Lace-compatible address created.');
      
    } catch (error) {
      console.error('❌ Mnemonic generation failed:', error);
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const restoreFromMnemonic = async () => {
    if (!inputMnemonic.trim()) {
      Alert.alert('Error', 'Please enter a mnemonic phrase');
      return;
    }

    setIsLoading(true);
    try {
      // Validate the mnemonic
      const isValid = validateMnemonicPhrase(inputMnemonic.trim());
      if (!isValid) {
        Alert.alert('Error', 'Invalid mnemonic phrase');
        return;
      }

      console.log('🔄 Restoring wallet from mnemonic...');
      
      // Convert mnemonic to seed
      const seedBytes = await mnemonicToSeedBytes(inputMnemonic.trim());
      const seedHex = Buffer.from(seedBytes).toString('hex');
      setSeedHex(seedHex);
      
      // Create wallet from seed
      console.log('🏦 Creating wallet from restored mnemonic...');
      const wallet = await createWalletFromSeed(seedBytes);
      setGeneratedWallet(wallet);
      
      // Create Lace-compatible wallet (single address using NightExternal)
      console.log('🏦 Creating Lace-compatible wallet from restored keys...');
      const nightExternalKeyPair = wallet.keyPairs.find(kp => kp.role === 'NightExternal');
      if (nightExternalKeyPair) {
        const laceWallet = await createLaceCompatibleWallet(nightExternalKeyPair, 'testnet');
        setLaceCompatibleWallet(laceWallet);
      }
      
      // Update the generated mnemonic state to show what was restored
      setGeneratedMnemonic(inputMnemonic.trim());
      
      Alert.alert('Success! 🔄', 'Wallet restored from mnemonic successfully!');
      
    } catch (error) {
      console.error('❌ Mnemonic restore failed:', error);
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const validateInput = () => {
    if (!inputMnemonic.trim()) {
      setIsValidInput(null);
      return;
    }

    const isValid = validateMnemonicPhrase(inputMnemonic.trim());
    const wordCount = getMnemonicWordCount(inputMnemonic.trim());
    const validLength = isValidMnemonicLength(wordCount);
    
    setIsValidInput(isValid && validLength);
    
    if (isValid && validLength) {
      try {
        mnemonicToSeedBytes(inputMnemonic.trim()).then(seed => {
          const seedHexString = Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join('');
          setSeedHex(seedHexString);
        });
      } catch (error) {
        console.error('❌ Seed conversion failed:', error);
      }
    } else {
      setSeedHex('');
    }
  };


  React.useEffect(() => {
    validateInput();
  }, [inputMnemonic]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎲 Mnemonic Test</Text>
      <Text style={styles.subtitle}>BIP39 Mnemonic Generation & Validation</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generate New Mnemonic</Text>
        <View style={styles.buttonRow}>
          <Button
            title={isLoading ? "Generating..." : "12 Words"}
            onPress={generateMnemonic12}
            disabled={isLoading}
          />
          <Button
            title={isLoading ? "Generating..." : "24 Words"}
            onPress={generateMnemonic24}
            disabled={isLoading}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔄 Restore from Mnemonic</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your 12 or 24-word mnemonic phrase..."
          multiline
          value={inputMnemonic}
          onChangeText={(text) => {
            setInputMnemonic(text);
            validateInput();
          }}
          editable={!isLoading}
        />
        
        {isValidInput !== null && (
          <View style={[styles.validationResult, isValidInput ? styles.valid : styles.invalid]}>
            <Text style={styles.validationText}>
              {isValidInput ? '✅ Valid mnemonic' : '❌ Invalid mnemonic'}
            </Text>
            {inputMnemonic && (
              <Text style={styles.wordCount}>
                Words: {getMnemonicWordCount(inputMnemonic)} 
                {!isValidMnemonicLength(getMnemonicWordCount(inputMnemonic)) && ' (must be 12 or 24)'}
              </Text>
            )}
          </View>
        )}
        
        <Button
          title={isLoading ? "Restoring..." : "🔄 Restore Wallet"}
          onPress={restoreFromMnemonic}
          disabled={isLoading || !isValidInput}
        />
      </View>

      {generatedMnemonic && (
        <View style={styles.resultContainer}>
          <View style={styles.mnemonicHeader}>
            <Text style={styles.resultTitle}>✅ Generated Mnemonic:</Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => copyToClipboard(generatedMnemonic, 'Mnemonic phrase')}
            >
              <Text style={styles.copyButtonText}>📋 Copy</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => copyToClipboard(generatedMnemonic, 'Mnemonic phrase')}>
            <Text style={styles.mnemonicText}>{generatedMnemonic}</Text>
          </TouchableOpacity>
          <Text style={styles.wordCount}>Words: {getMnemonicWordCount(generatedMnemonic)}</Text>
        </View>
      )}

      {laceCompatibleWallet && (
        <View style={styles.laceAddressContainer}>
          <View style={styles.laceAddressHeader}>
            <Text style={styles.laceAddressTitle}>🏦 Lace-Compatible Address:</Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => copyToClipboard(laceCompatibleWallet.address, 'Lace-compatible address')}
            >
              <Text style={styles.copyButtonText}>📋 Copy</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={() => copyToClipboard(laceCompatibleWallet.address, 'Lace-compatible address')}>
            <Text style={styles.laceAddressText}>{laceCompatibleWallet.address}</Text>
          </TouchableOpacity>
          
          <Text style={styles.laceAddressNote}>
            ✅ This address should match your Lace wallet address!
          </Text>
          
          <View style={styles.keyDetailsContainer}>
            <TouchableOpacity onPress={() => copyToClipboard(laceCompatibleWallet.coinPublicKey, 'Coin public key')}>
              <Text style={styles.keyDetail}>Coin: {laceCompatibleWallet.coinPublicKey.substring(0, 20)}... 📋</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => copyToClipboard(laceCompatibleWallet.encryptionPublicKey, 'Encryption public key')}>
              <Text style={styles.keyDetail}>Enc: {laceCompatibleWallet.encryptionPublicKey.substring(0, 20)}... 📋</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {generatedWallet && (
        <View style={styles.addressContainer}>
          <Text style={styles.addressTitle}>🏠 All Role Addresses (Debug):</Text>
          <AddressGeneration wallet={generatedWallet} />
        </View>
      )}


      {seedHex && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🌱 Derived Seed (64 bytes):</Text>
          <Text style={styles.seedText}>{seedHex}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>BIP39 Implementation:</Text>
        <Text style={styles.infoItem}>• @scure/bip39 library ✅</Text>
        <Text style={styles.infoItem}>• 12-word (128-bit) generation ✅</Text>
        <Text style={styles.infoItem}>• 24-word (256-bit) generation ✅</Text>
        <Text style={styles.infoItem}>• Mnemonic validation ✅</Text>
        <Text style={styles.infoItem}>• Seed derivation ✅</Text>
        <Text style={styles.infoItem}>• Standard BIP39 implementation ✅</Text>
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    marginBottom: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  invalidInput: {
    borderColor: '#ff3b30',
  },
  validationResult: {
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  valid: {
    backgroundColor: '#e8f5e8',
  },
  invalid: {
    backgroundColor: '#ffe8e8',
  },
  validationText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  wordCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  resultContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mnemonicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mnemonicText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 4,
  },
  seedText: {
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    lineHeight: 14,
  },
  addressContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  laceAddressContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  laceAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  laceAddressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d2e',
    flex: 1,
  },
  laceAddressText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#2e7d2e',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    lineHeight: 16,
  },
  laceAddressNote: {
    fontSize: 12,
    color: '#2e7d2e',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  keyDetailsContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  keyDetail: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#555',
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 2,
    marginBottom: 4,
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