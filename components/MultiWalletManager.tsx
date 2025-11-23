import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Multi-Wallet Manager Component - Temporarily Disabled
 * 
 * This component has been temporarily disabled to isolate WAMR testing.
 * The original implementation uses Midnight Network dependencies that
 * conflict with the current WAMR integration testing phase.
 */

export default function MultiWalletManager() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💼 Multi-Wallet Manager</Text>
        <Text style={styles.subtitle}>Temporarily Disabled</Text>
      </View>
      
      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>🚧 Phase 1: WAMR Integration Testing</Text>
        <Text style={styles.noticeText}>
          The wallet functionality is temporarily disabled while we focus on 
          WAMR (WebAssembly Micro Runtime) integration. This allows us to test 
          the WASM execution without Midnight Network dependencies.
        </Text>
        <Text style={styles.noticeText}>
          Once WAMR integration is stable, the full wallet functionality 
          will be restored in Phase 3.
        </Text>
        <Text style={styles.noticePhase}>
          Current: Phase 1 - Basic WAMR proof of concept
        </Text>
        <Text style={styles.noticePhase}>
          Next: Phase 2 - externref prototype
        </Text>
        <Text style={styles.noticePhase}>
          Final: Phase 3 - Midnight Network integration
        </Text>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>🔧 Available for Testing:</Text>
        <Text style={styles.actionText}>• WAMR Test tab - WebAssembly execution</Text>
        <Text style={styles.actionText}>• Development tab - General development tools</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noticeCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 10,
    lineHeight: 20,
  },
  noticePhase: {
    fontSize: 12,
    color: '#6c5700',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  actionCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 13,
    color: '#1565c0',
    marginBottom: 5,
  },
});