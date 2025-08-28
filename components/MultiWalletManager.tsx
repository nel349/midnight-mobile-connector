import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { walletManager, WalletStore, StoredWallet, WalletThemes } from '../lib/walletManager';
import { NetworkType, connectWalletToNetwork, getWalletBalance, ConnectedWallet } from '../lib/networkConnection';

/**
 * Multi-Wallet Manager Component
 * 
 * Production-ready wallet management interface for creating, importing,
 * and managing up to 5 Midnight wallets with secure storage.
 */

interface WalletBalance {
  walletId: string;
  balance: {
    dust: string;
    totalCoins: number;
    networkEndpoint: string;
    lastUpdated: Date;
    error?: string;
  } | null;
  isLoading: boolean;
}

export default function MultiWalletManager() {
  const [store, setStore] = useState<WalletStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'overview' | 'create' | 'import' | 'settings'>('overview');
  
  // Balance management
  const [walletBalances, setWalletBalances] = useState<Record<string, WalletBalance>>({});
  
  // Create wallet form
  const [newWalletName, setNewWalletName] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('testnet');
  
  // Import wallet form
  const [importWalletName, setImportWalletName] = useState('');
  const [importSeed, setImportSeed] = useState('');

  useEffect(() => {
    initializeWalletManager();
  }, []);

  const initializeWalletManager = async () => {
    try {
      console.log('💼 Initializing Multi-Wallet Manager...');
      const loadedStore = await walletManager.initialize();
      setStore(loadedStore);
    } catch (error) {
      console.error('Failed to initialize wallet manager:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStore = () => {
    setStore(walletManager.getStore());
  };

  /**
   * Fetch balance for a specific wallet
   */
  const fetchWalletBalance = async (wallet: StoredWallet) => {
    const walletId = wallet.metadata.id;
    console.log(`💰 Fetching balance for wallet: ${wallet.metadata.name}`);

    // Set loading state
    setWalletBalances(prev => ({
      ...prev,
      [walletId]: {
        walletId,
        balance: prev[walletId]?.balance || null,
        isLoading: true
      }
    }));

    try {
      // Connect wallet to network
      console.log(`   🔗 Connecting to ${wallet.metadata.network} network...`);
      const connectedWallet = await connectWalletToNetwork(wallet.wallet, wallet.metadata.network);
      
      // Fetch balance
      console.log(`   💰 Fetching balance...`);
      const balance = await getWalletBalance(connectedWallet);
      
      // Update balance state
      setWalletBalances(prev => ({
        ...prev,
        [walletId]: {
          walletId,
          balance,
          isLoading: false
        }
      }));

      console.log(`   ✅ Balance fetched: ${balance.dust} tDUST`);

    } catch (error) {
      console.error(`   ❌ Failed to fetch balance for ${wallet.metadata.name}:`, error);
      
      // Set error state
      setWalletBalances(prev => ({
        ...prev,
        [walletId]: {
          walletId,
          balance: {
            dust: '0.000000',
            totalCoins: 0,
            networkEndpoint: 'error',
            lastUpdated: new Date(),
            error: String(error)
          },
          isLoading: false
        }
      }));
    }
  };

  /**
   * Fetch balances for all wallets
   */
  const fetchAllBalances = async () => {
    if (!store) return;
    
    console.log('💰 Fetching balances for all wallets...');
    
    // Fetch balances for all wallets in parallel
    const fetchPromises = store.wallets.map(wallet => fetchWalletBalance(wallet));
    
    try {
      await Promise.allSettled(fetchPromises);
      console.log('   ✅ All balance fetches completed');
    } catch (error) {
      console.error('   ❌ Error in batch balance fetch:', error);
    }
  };

  /**
   * Get balance info for a wallet
   */
  const getWalletBalanceInfo = (walletId: string): WalletBalance | null => {
    return walletBalances[walletId] || null;
  };

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    if (!walletManager.canAddWallet()) {
      Alert.alert('Error', 'Maximum 5 wallets allowed');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`💼 Creating wallet: ${newWalletName}`);
      
      await walletManager.createWallet(newWalletName.trim(), selectedNetwork);
      
      // Reset form and refresh
      setNewWalletName('');
      refreshStore();
      setCurrentView('overview');
      
      console.log('   ✅ Wallet created successfully');
      
    } catch (error) {
      console.error('   ❌ Failed to create wallet:', error);
      Alert.alert('Error', `Failed to create wallet: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!importWalletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    if (!importSeed.trim()) {
      Alert.alert('Error', 'Please enter a seed phrase or hex');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`💼 Importing wallet: ${importWalletName}`);
      
      // Convert seed to bytes (assuming hex for now)
      // TODO: Add support for BIP39 mnemonic phrases
      const seedBytes = new Uint8Array(Buffer.from(importSeed.replace(/\s/g, ''), 'hex'));
      
      await walletManager.importWallet(importWalletName.trim(), seedBytes, selectedNetwork);
      
      // Reset form and refresh
      setImportWalletName('');
      setImportSeed('');
      refreshStore();
      setCurrentView('overview');
      
      console.log('   ✅ Wallet imported successfully');
      
    } catch (error) {
      console.error('   ❌ Failed to import wallet:', error);
      Alert.alert('Error', `Failed to import wallet: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchWallet = async (walletId: string) => {
    try {
      await walletManager.setActiveWallet(walletId);
      refreshStore();
      console.log(`   ✅ Switched to wallet: ${walletId}`);
    } catch (error) {
      console.error('   ❌ Failed to switch wallet:', error);
      Alert.alert('Error', `Failed to switch wallet: ${error}`);
    }
  };

  const handleDeleteWallet = (wallet: StoredWallet) => {
    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${wallet.metadata.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await walletManager.deleteWallet(wallet.metadata.id);
              refreshStore();
              console.log(`   ✅ Deleted wallet: ${wallet.metadata.name}`);
            } catch (error) {
              console.error('   ❌ Failed to delete wallet:', error);
              Alert.alert('Error', `Failed to delete wallet: ${error}`);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading wallets...</Text>
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load wallet manager</Text>
      </View>
    );
  }

  // Overview - List all wallets
  if (currentView === 'overview') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💼 Multi-Wallet Manager</Text>
          <Text style={styles.subtitle}>
            Manage up to {store.maxWallets} wallets ({store.wallets.length}/{store.maxWallets} used)
          </Text>
        </View>

        {/* Wallet List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Wallets:</Text>
          
          {store.wallets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No wallets found</Text>
              <Text style={styles.emptySubtext}>Create your first wallet to get started</Text>
            </View>
          ) : (
            store.wallets.map((wallet) => (
              <View key={wallet.metadata.id} style={[
                styles.walletCard,
                wallet.metadata.id === store.activeWalletId && styles.activeWalletCard
              ]}>
                <View style={styles.walletHeader}>
                  <View style={styles.walletIcon}>
                    <Text style={styles.walletEmoji}>{wallet.metadata.icon}</Text>
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>
                      {wallet.metadata.name}
                      {wallet.metadata.id === store.activeWalletId && ' ✅'}
                    </Text>
                    <Text style={styles.walletNetwork}>Network: {wallet.metadata.network}</Text>
                    <Text style={styles.walletDate}>
                      Created: {wallet.metadata.createdAt.toLocaleDateString()}
                    </Text>
                    <Text style={styles.walletKeys}>
                      Keys: {wallet.wallet.keyPairs.length} roles
                    </Text>
                    
                    {/* Balance Display */}
                    {(() => {
                      const balanceInfo = getWalletBalanceInfo(wallet.metadata.id);
                      
                      if (!balanceInfo) {
                        return (
                          <Text style={styles.balanceNotChecked}>Balance: Not checked</Text>
                        );
                      }
                      
                      if (balanceInfo.isLoading) {
                        return (
                          <Text style={styles.balanceLoading}>Balance: Loading...</Text>
                        );
                      }
                      
                      if (balanceInfo.balance?.error) {
                        return (
                          <Text style={styles.balanceError}>Balance: Error</Text>
                        );
                      }
                      
                      return (
                        <View style={styles.balanceContainer}>
                          <Text style={styles.balanceAmount}>
                            💰 {balanceInfo.balance?.dust || '0.000000'} tDUST
                          </Text>
                          <Text style={styles.balanceDetails}>
                            {balanceInfo.balance?.totalCoins || 0} coins • Updated: {balanceInfo.balance?.lastUpdated.toLocaleTimeString()}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
                
                <View style={styles.walletActions}>
                  {wallet.metadata.id !== store.activeWalletId && (
                    <Button
                      title="Switch To"
                      onPress={() => handleSwitchWallet(wallet.metadata.id)}
                      color="#007AFF"
                    />
                  )}
                  <Button
                    title="💰 Balance"
                    onPress={() => fetchWalletBalance(wallet)}
                    color="#34C759"
                    disabled={getWalletBalanceInfo(wallet.metadata.id)?.isLoading || false}
                  />
                  <Button
                    title="Delete"
                    onPress={() => handleDeleteWallet(wallet)}
                    color="#FF3B30"
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Balance Actions */}
        {store.wallets.length > 0 && (
          <View style={styles.actionButtons}>
            <Button
              title="💰 Refresh All Balances"
              onPress={fetchAllBalances}
              color="#007AFF"
              disabled={Object.values(walletBalances).some(b => b.isLoading)}
            />
          </View>
        )}

        {/* Wallet Actions */}
        <View style={styles.actionButtons}>
          {walletManager.canAddWallet() && (
            <>
              <Button
                title="➕ Create New Wallet"
                onPress={() => setCurrentView('create')}
                color="#34C759"
              />
              <View style={styles.buttonSpacer} />
              <Button
                title="📥 Import Wallet"
                onPress={() => setCurrentView('import')}
                color="#FF9500"
              />
            </>
          )}
          
          {!walletManager.canAddWallet() && (
            <Text style={styles.maxWalletsText}>
              Maximum {store.maxWallets} wallets reached. Delete a wallet to add a new one.
            </Text>
          )}
        </View>

        {/* Development Actions */}
        <View style={styles.devSection}>
          <Text style={styles.devTitle}>Development Actions:</Text>
          <Button
            title="Clear All Wallets"
            onPress={() => {
              Alert.alert(
                'Clear All Wallets',
                'This will delete ALL wallets. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Clear All', 
                    style: 'destructive',
                    onPress: async () => {
                      await walletManager.clearAllWallets();
                      refreshStore();
                    }
                  }
                ]
              );
            }}
            color="#FF3B30"
          />
        </View>
      </ScrollView>
    );
  }

  // Create wallet view
  if (currentView === 'create') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>➕ Create New Wallet</Text>
          <Text style={styles.subtitle}>Generate a new Midnight wallet with secure keys</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formLabel}>Wallet Name:</Text>
          <TextInput
            style={styles.textInput}
            value={newWalletName}
            onChangeText={setNewWalletName}
            placeholder="Enter wallet name"
            maxLength={30}
          />

          <Text style={styles.formLabel}>Network:</Text>
          <View style={styles.networkSelector}>
            {(['testnet', 'undeployed', 'mainnet'] as NetworkType[]).map((network) => (
              <Button
                key={network}
                title={network}
                onPress={() => setSelectedNetwork(network)}
                color={selectedNetwork === network ? '#007AFF' : '#666'}
              />
            ))}
          </View>

          <View style={styles.formActions}>
            <Button
              title="Cancel"
              onPress={() => setCurrentView('overview')}
              color="#666"
            />
            <Button
              title="Create Wallet"
              onPress={handleCreateWallet}
              color="#34C759"
              disabled={!newWalletName.trim()}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  // Import wallet view
  if (currentView === 'import') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📥 Import Wallet</Text>
          <Text style={styles.subtitle}>Import an existing wallet from seed</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formLabel}>Wallet Name:</Text>
          <TextInput
            style={styles.textInput}
            value={importWalletName}
            onChangeText={setImportWalletName}
            placeholder="Enter wallet name"
            maxLength={30}
          />

          <Text style={styles.formLabel}>Seed (Hex format):</Text>
          <TextInput
            style={[styles.textInput, styles.seedInput]}
            value={importSeed}
            onChangeText={setImportSeed}
            placeholder="Enter seed in hex format"
            multiline
            secureTextEntry={false}
          />

          <Text style={styles.formLabel}>Network:</Text>
          <View style={styles.networkSelector}>
            {(['testnet', 'undeployed', 'mainnet'] as NetworkType[]).map((network) => (
              <Button
                key={network}
                title={network}
                onPress={() => setSelectedNetwork(network)}
                color={selectedNetwork === network ? '#007AFF' : '#666'}
              />
            ))}
          </View>

          <View style={styles.formActions}>
            <Button
              title="Cancel"
              onPress={() => setCurrentView('overview')}
              color="#666"
            />
            <Button
              title="Import Wallet"
              onPress={handleImportWallet}
              color="#FF9500"
              disabled={!importWalletName.trim() || !importSeed.trim()}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 50,
  },
  header: {
    marginBottom: 20,
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  walletCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  activeWalletCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletEmoji: {
    fontSize: 20,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  walletNetwork: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  walletDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  walletKeys: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  balanceContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  balanceDetails: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  balanceNotChecked: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  balanceLoading: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 4,
  },
  balanceError: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 4,
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButtons: {
    marginBottom: 25,
  },
  buttonSpacer: {
    height: 10,
  },
  maxWalletsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  devSection: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  devTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#856404',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  seedInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  networkSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});