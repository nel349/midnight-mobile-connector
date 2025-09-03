import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import MultiWalletManager from '@/components/MultiWalletManager';

/**
 * Multi-Wallet Tab - Main production wallet management
 * 
 * This is the main tab for production-ready wallet functionality:
 * - Create and manage up to 5 Midnight wallets
 * - Import wallets from seed
 * - Switch between wallets
 * - Connect to TestNet-02 network
 * - Secure storage with AsyncStorage
 */

export default function MultiWalletTab() {
  return (
    <ThemedView style={styles.container}>
      <MultiWalletManager />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});