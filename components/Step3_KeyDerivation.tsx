import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { MidnightWallet } from '../lib/midnightWallet';
import WalletGeneration from './phase3/WalletGeneration';
import KeyPairDisplay from './phase3/KeyPairDisplay';
import ConsistencyTest from './phase3/ConsistencyTest';

interface Props {
  onWalletGenerated?: (wallet: MidnightWallet) => void;
}

/**
 * Phase 3: Mobile Midnight Key Derivation
 * 
 * Clean component structure with separate files for each step:
 * - WalletGeneration: Generate new wallet
 * - KeyPairDisplay: Show generated key pairs  
 * - ConsistencyTest: Test deterministic generation
 */

export default function Step3_KeyDerivation({ onWalletGenerated }: Props) {
  const [wallet, setWallet] = useState<MidnightWallet | null>(null);

  const handleWalletGenerated = (newWallet: MidnightWallet) => {
    setWallet(newWallet);
    onWalletGenerated?.(newWallet);
  };

  return (
    <ScrollView style={styles.container}>
      <WalletGeneration onWalletGenerated={handleWalletGenerated} />
      <KeyPairDisplay wallet={wallet} />
      <ConsistencyTest wallet={wallet} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});