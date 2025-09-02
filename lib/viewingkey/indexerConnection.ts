/**
 * Midnight Indexer Connection
 * 
 * Implements the connect(viewingKey) mutation and session management
 * for the Midnight Indexer GraphQL API.
 */

import { ViewingKey } from './viewingKeyDerivation';

export interface IndexerSession {
  sessionId: string;
  viewingKey: ViewingKey;
  connected: boolean;
  connectedAt: Date;
}

export interface IndexerConfig {
  endpoint: string;
  wsEndpoint: string;
}

/**
 * Midnight Indexer Connection Manager
 */
export class MidnightIndexerConnection {
  private config: IndexerConfig;
  private session: IndexerSession | null = null;

  constructor(config: IndexerConfig) {
    this.config = config;
  }

  /**
   * Connect to indexer using ViewingKey
   * Implements: connect(viewingKey: ViewingKey!) -> sessionId
   */
  async connect(viewingKey: ViewingKey): Promise<string> {
    console.log('🔌 Connecting to Midnight indexer...');
    console.log(`   📡 Endpoint: ${this.config.endpoint}`);
    console.log(`   🔑 ViewingKey: ${viewingKey.bech32m.substring(0, 30)}...`);

    try {
      // Prepare GraphQL mutation
      const mutation = {
        query: `
          mutation Connect($viewingKey: ViewingKey!) {
            connect(viewingKey: $viewingKey)
          }
        `,
        variables: {
          viewingKey: viewingKey.bech32m
        }
      };

      console.log('   📤 Sending connect mutation...');

      // Send GraphQL mutation
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(mutation)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Handle GraphQL errors
      if (result.errors) {
        console.error('   ❌ GraphQL errors:', result.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      // Extract session ID
      const sessionId = result.data?.connect;
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error(`Invalid session ID received: ${sessionId}`);
      }

      // Store session
      this.session = {
        sessionId,
        viewingKey,
        connected: true,
        connectedAt: new Date()
      };

      console.log(`   ✅ Connected! Session ID: ${sessionId.substring(0, 20)}...`);
      return sessionId;

    } catch (error) {
      console.error('❌ Indexer connection failed:', error);
      throw new Error(`Failed to connect to indexer: ${error}`);
    }
  }

  /**
   * Try connecting with multiple ViewingKey candidates
   */
  async connectWithCandidates(viewingKeys: ViewingKey[]): Promise<string> {
    console.log(`🔄 Trying ${viewingKeys.length} ViewingKey candidates...`);

    let lastError: Error | null = null;

    for (let i = 0; i < viewingKeys.length; i++) {
      const viewingKey = viewingKeys[i];
      console.log(`   🔑 Candidate ${i + 1}/${viewingKeys.length}: ${viewingKey.bech32m.substring(0, 40)}...`);

      try {
        const sessionId = await this.connect(viewingKey);
        console.log(`   ✅ Success with candidate ${i + 1}!`);
        return sessionId;
      } catch (error) {
        console.log(`   ❌ Candidate ${i + 1} failed:`, error instanceof Error ? error.message : error);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    // If we get here, all candidates failed
    console.error('❌ All ViewingKey candidates failed');
    throw lastError || new Error('All ViewingKey candidates failed to connect');
  }

  /**
   * Disconnect from indexer
   */
  async disconnect(): Promise<void> {
    if (!this.session) {
      console.log('⚠️ No active session to disconnect');
      return;
    }

    console.log('🔌 Disconnecting from indexer...');

    try {
      const mutation = {
        query: `
          mutation Disconnect($sessionId: HexEncoded!) {
            disconnect(sessionId: $sessionId)
          }
        `,
        variables: {
          sessionId: this.session.sessionId
        }
      };

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(mutation)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        console.error('   ⚠️ Disconnect errors:', result.errors);
      }

      console.log('   ✅ Disconnected from indexer');

    } catch (error) {
      console.error('⚠️ Disconnect error:', error);
      // Don't throw - disconnection errors are not critical
    } finally {
      // Clear session regardless of disconnect result
      this.session = null;
    }
  }

  /**
   * Get current session info
   */
  getSession(): IndexerSession | null {
    return this.session;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.session?.connected === true;
  }
}

/**
 * Create indexer connection for testnet
 */
export function createTestnetIndexerConnection(): MidnightIndexerConnection {
  const config: IndexerConfig = {
    endpoint: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
    wsEndpoint: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws'
  };

  return new MidnightIndexerConnection(config);
}

/**
 * Test indexer connection with viewing key
 */
export async function testIndexerConnection(viewingKey: ViewingKey): Promise<boolean> {
  console.log('🧪 Testing indexer connection...');

  const indexer = createTestnetIndexerConnection();

  try {
    // Test connection
    const sessionId = await indexer.connect(viewingKey);
    console.log('✅ Connection test passed');

    // Test disconnection
    await indexer.disconnect();
    console.log('✅ Disconnection test passed');

    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}