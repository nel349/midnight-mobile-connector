import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { MidnightWallet } from '../lib/midnightWallet';
import NetworkConnection from './phase5/NetworkConnection';

interface Props {
  wallet: MidnightWallet | null;
}

/**
 * Phase 5: Midnight Network Integration
 * 
 * Connects wallet to official Midnight infrastructure:
 * - TestNet-02: https://indexer.testnet-02.midnight.network
 * - Local: http://localhost:8088 (for development)
 * - MainNet: Production network (coming soon)
 * 
 * Network Architecture:
 * - Indexer (GraphQL): Blockchain data queries
 * - WebSocket: Real-time updates  
 * - Prover Server: ZK proof generation
 * - Substrate Node: Transaction submission
 */

export default function Step5_NetworkIntegration({ wallet }: Props) {
  return (
    <ScrollView style={styles.container}>
      <NetworkConnection wallet={wallet} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});