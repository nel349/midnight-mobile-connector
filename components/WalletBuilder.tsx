import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import Step1_BasicCrypto from './Step1_BasicCrypto';
import Step2_SeedDerivation from './Step2_SeedDerivation';
import Step3_KeyDerivation from './Step3_KeyDerivation';

/**
 * Midnight Wallet Builder - Following MIDNIGHT_MOBILE_PLAN.md
 * 
 * Phase navigation for complete wallet development:
 * Phase 1: Foundation 🚀 (Crypto algorithms validation)
 * Phase 2: Seed Derivation 📱 (BIP39 + HD wallet)  
 * Phase 3: Key Derivation 🔑 (HKDF + deterministic keys)
 * Phase 4: Address Generation 🏠 (Bech32m encoding)
 * Phase 5: Network Integration 🌐 (Testnet connection)
 */

type WalletPhase = 'overview' | 'foundation' | 'seed-derivation' | 'key-derivation' | 'address-generation' | 'network-integration';

export default function WalletBuilder() {
  const [currentPhase, setCurrentPhase] = useState<WalletPhase>('overview');

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'overview':
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.title}>🌙 Midnight Wallet Builder</Text>
            <Text style={styles.subtitle}>
              Complete wallet development following the official plan
            </Text>
            
            <View style={styles.phaseList}>
              <Text style={styles.phaseTitle}>Development Phases:</Text>
              <Text style={styles.phaseItem}>Phase 1: 🚀 Foundation (Crypto validation)</Text>
              <Text style={styles.phaseItem}>Phase 2: 📱 Seed Derivation (HD wallet)</Text>
              <Text style={styles.phaseItem}>Phase 3: 🔑 Key Derivation (Deterministic keys)</Text>
              <Text style={styles.phaseItem}>Phase 4: 🏠 Address Generation (Bech32m)</Text>
              <Text style={styles.phaseItem}>Phase 5: 🌐 Network Integration (Testnet)</Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusTitle}>Current Status:</Text>
              <Text style={styles.statusText}>✅ Phase 1: Foundation COMPLETE</Text>
              <Text style={styles.statusText}>✅ Phase 2: Seed Derivation COMPLETE</Text>
              <Text style={styles.statusText}>✅ Phase 3: Key Derivation COMPLETE</Text>
              <Text style={styles.statusText}>🔄 Phase 4: Address Generation IN PROGRESS</Text>
              <Text style={styles.statusText}>⏳ Phase 5: Network Integration PENDING</Text>
            </View>
          </View>
        );

      case 'foundation':
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>🚀 Phase 1: Foundation</Text>
            <Text style={styles.phaseDescription}>
              Crypto algorithms validation - Ed25519 & X25519 key generation
            </Text>
            <Step1_BasicCrypto />
          </View>
        );

      case 'seed-derivation':
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>📱 Phase 2: Seed Derivation</Text>
            <Text style={styles.phaseDescription}>
              BIP39 seed generation with official Midnight HD Wallet SDK
            </Text>
            <Step2_SeedDerivation />
          </View>
        );

      case 'key-derivation':
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>🔑 Phase 3: Key Derivation</Text>
            <Text style={styles.phaseDescription}>
              HKDF key derivation and deterministic key generation
            </Text>
            <Step3_KeyDerivation />
          </View>
        );

      case 'address-generation':
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>🏠 Phase 4: Address Generation</Text>
            <Text style={styles.phaseDescription}>
              Bech32m Midnight address encoding from public keys
            </Text>
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>🚧 Coming Soon</Text>
              <Text style={styles.comingSoonDetail}>
                Generate Midnight addresses in Bech32m format: mn_shield-addr_test1...
              </Text>
            </View>
          </View>
        );

      case 'network-integration':
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>🌐 Phase 5: Network Integration</Text>
            <Text style={styles.phaseDescription}>
              Connect to Midnight testnet and query balances
            </Text>
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>🚧 Coming Soon</Text>
              <Text style={styles.comingSoonDetail}>
                Full network integration with indexer, node, and proof server
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Phase Navigation */}
      <View style={styles.navigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroll}>
          {[
            { id: 'overview', label: 'Overview', icon: '📋' },
            { id: 'foundation', label: 'Foundation', icon: '🚀' },
            { id: 'seed-derivation', label: 'Seed Derivation', icon: '📱' },
            { id: 'key-derivation', label: 'Key Derivation', icon: '🔑' },
            { id: 'address-generation', label: 'Address Generation', icon: '🏠' },
            { id: 'network-integration', label: 'Network Integration', icon: '🌐' },
          ].map((phase) => (
            <View key={phase.id} style={styles.navButton}>
              <Button
                title={`${phase.icon} ${phase.label}`}
                onPress={() => setCurrentPhase(phase.id as WalletPhase)}
                color={currentPhase === phase.id ? '#007AFF' : '#666'}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Phase Content */}
      {renderPhaseContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navigation: {
    backgroundColor: 'white',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  navScroll: {
    flexDirection: 'row',
  },
  navButton: {
    marginRight: 5,
  },
  phaseContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  phaseDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontStyle: 'italic',
  },
  phaseList: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  phaseItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#1976d2',
  },
  comingSoon: {
    backgroundColor: '#fff3e0',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcc02',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f57c00',
    marginBottom: 10,
  },
  comingSoonDetail: {
    fontSize: 14,
    color: '#ef6c00',
    textAlign: 'center',
    lineHeight: 20,
  },
});