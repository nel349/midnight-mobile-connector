import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { MidnightWallet } from '../../lib/midnightWallet';
import { 
  testNetworkConnectivity, 
  connectWalletToNetwork, 
  getWalletBalance,
  getAvailableNetworks,
  NetworkType,
  NetworkConnection as NetworkConnectionType,
  ConnectedWallet
} from '../../lib/networkConnection';

interface Props {
  wallet: MidnightWallet | null;
}

export default function NetworkConnection({ wallet }: Props) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('testnet');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connection, setConnection] = useState<NetworkConnectionType | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  const [balance, setBalance] = useState<any>(null);

  const availableNetworks = getAvailableNetworks();

  const handleTestConnectivity = async () => {
    setIsTesting(true);
    try {
      console.log(`🔍 Testing ${selectedNetwork} connectivity...`);
      const result = await testNetworkConnectivity(selectedNetwork);
      setConnection(result);
      
    } catch (error) {
      console.error('❌ Connectivity test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnectWallet = async () => {
    if (!wallet) {
      console.log('❌ No wallet available for connection');
      return;
    }

    setIsConnecting(true);
    try {
      console.log(`🔗 Connecting wallet to ${selectedNetwork}...`);
      const result = await connectWalletToNetwork(wallet, selectedNetwork);
      setConnectedWallet(result);
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGetBalance = async () => {
    if (!connectedWallet) {
      console.log('❌ No connected wallet');
      return;
    }

    try {
      console.log('💰 Fetching wallet balance...');
      const walletBalance = await getWalletBalance(connectedWallet);
      setBalance(walletBalance);
      
    } catch (error) {
      console.error('❌ Balance fetch failed:', error);
    }
  };

  if (!wallet) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Network Connection</Text>
        <Text style={styles.subtitle}>Please generate a wallet first</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Connect to Midnight Network</Text>
      <Text style={styles.subtitle}>
        Connect your wallet to TestNet-02 or local development network
      </Text>
      
      {/* Network Selection */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Select Network:</Text>
        {availableNetworks.map((network) => (
          <View key={network.key} style={styles.networkOption}>
            <Button
              title={network.name}
              onPress={() => setSelectedNetwork(network.key)}
              color={selectedNetwork === network.key ? '#007AFF' : '#666'}
            />
            <Text style={styles.networkDescription}>{network.description}</Text>
          </View>
        ))}
      </View>

      {/* Test Connectivity */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Network Connectivity:</Text>
        <Button
          title={isTesting ? "Testing..." : "Test Network Connectivity"}
          onPress={handleTestConnectivity}
          disabled={isTesting}
        />
        
        {connection && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>
              {connection.status === 'connected' ? '✅' : '❌'} {connection.network}
            </Text>
            <Text style={styles.resultText}>Status: {connection.status}</Text>
            {connection.blockHeight && (
              <>
                <Text style={styles.resultText}>Block Height: {connection.blockHeight}</Text>
                <Text style={styles.resultText}>Peers: {connection.peerCount}</Text>
                <Text style={styles.resultText}>Last Sync: {connection.lastSync?.toLocaleString()}</Text>
              </>
            )}
            {connection.error && (
              <Text style={styles.errorText}>Error: {connection.error}</Text>
            )}
          </View>
        )}
      </View>

      {/* Connect Wallet */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Wallet Connection:</Text>
        <Button
          title={isConnecting ? "Connecting..." : connectedWallet ? "✅ Wallet Connected" : "Connect Wallet to Network"}
          onPress={handleConnectWallet}
          disabled={isConnecting || !connection || connection.status !== 'connected'}
        />
        
        {connectedWallet && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>✅ Wallet Connected</Text>
            <Text style={styles.resultText}>Network: {connectedWallet.connection.network}</Text>
            <Text style={styles.resultText}>Wallet Keys: {connectedWallet.wallet.keyPairs.length} roles</Text>
            <Text style={styles.resultText}>Status: Connected & Syncing</Text>
          </View>
        )}
      </View>

      {/* Balance Check */}
      {connectedWallet && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Wallet Balance:</Text>
          <Button
            title="Get Balance"
            onPress={handleGetBalance}
          />
          
          {balance && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>💰 Wallet Balance</Text>
              <Text style={styles.balanceText}>{balance.dust} tDUST</Text>
              <Text style={styles.resultText}>Total coins: {balance.totalCoins}</Text>
              <Text style={styles.resultText}>Network: {balance.networkEndpoint}</Text>
              <Text style={styles.resultText}>Updated: {balance.lastUpdated.toLocaleString()}</Text>
              {balance.error && (
                <Text style={styles.errorText}>Note: {balance.error}</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Network Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🌐 Network Architecture:</Text>
        <Text style={styles.infoItem}>• Indexer: GraphQL API for blockchain queries</Text>
        <Text style={styles.infoItem}>• WebSocket: Real-time blockchain updates</Text>
        <Text style={styles.infoItem}>• Prover: Zero-knowledge proof generation</Text>
        <Text style={styles.infoItem}>• Substrate: RPC node for transactions</Text>
        <Text style={styles.infoItem}>• TestNet-02: Official persistent testnet</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  networkOption: {
    marginBottom: 10,
  },
  networkDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginLeft: 10,
  },
  resultBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 3,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginBottom: 3,
  },
  infoContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#856404',
  },
  infoItem: {
    fontSize: 11,
    color: '#6f5700',
    marginBottom: 3,
  },
});