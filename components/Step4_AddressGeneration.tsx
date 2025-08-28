import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { MidnightWallet } from '../lib/midnightWallet';
import AddressGeneration from './phase4/AddressGeneration';

interface Props {
  wallet: MidnightWallet | null;
}

/**
 * Phase 4: Midnight Address Generation
 * 
 * Creates Bech32m addresses compatible with Lace wallet:
 * - Undeployed: mn_shield-addr_undeployed1...
 * - DevNet: mn_shield-addr_dev1... 
 * - TestNet: mn_shield-addr_test1...
 * - MainNet: mn_shield-addr_mainnet1...
 */

export default function Step4_AddressGeneration({ wallet }: Props) {
  return (
    <ScrollView style={styles.container}>
      <AddressGeneration wallet={wallet} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});