/**
 * Mobile Midnight Wallet API
 * 
 * Replicates the functionality from @midnight-bank/bank-api/src/test/commons.ts
 * and @midnight-bank/bank-contract/src/test/bank.test.ts for React Native
 */

import { WebView } from 'react-native-webview';

export interface MidnightWalletConfig {
  indexerUri: string;
  indexerWsUri: string; 
  proverServerUri: string;
  substrateNodeUri: string;
  networkId: 'TestNet' | 'MainNet' | 'Undeployed';
}

export interface WalletKeys {
  seed: string;                    // Hex-encoded seed
  coinPublicKey: string;          // Public key for receiving
  coinSecretKey: any;             // Secret key for spending  
  encryptionPublicKey: string;    // Encryption public key
  encryptionSecretKey: any;       // Encryption secret key
}

export interface WalletState {
  balance: bigint;
  coins: any[];
  transactions: any[];
  blockHeight: number;
}

export class MidnightMobileWallet {
  private webViewRef: React.RefObject<WebView>;
  private config: MidnightWalletConfig;
  private keys: WalletKeys | null = null;
  private messageId = 0;
  private pendingCalls = new Map<number, { resolve: Function, reject: Function }>();

  constructor(webViewRef: React.RefObject<WebView>, config: MidnightWalletConfig) {
    this.webViewRef = webViewRef;
    this.config = config;
  }

  /**
   * Build wallet from existing seed - THE CORE FUNCTION
   * Uses SecretKeys.fromSeed() from zswap WASM
   */
  async buildFromSeed(seed: string): Promise<void> {
    this.keys = await this.callWasm('buildFromSeed', { seed });
  }

  /**
   * Get current wallet state (balance, coins, transactions)
   * Equivalent to: wallet.state().pipe(take(1))
   */
  async getState(): Promise<WalletState> {
    if (!this.keys) throw new Error('Wallet not initialized');
    return await this.callWasm('getWalletState', { keys: this.keys });
  }

  /**
   * Get wallet balance 
   * Equivalent to: state.balances
   */
  async getBalance(): Promise<bigint> {
    const state = await this.getState();
    return state.balance;
  }

  /**
   * Create a transfer transaction
   * Equivalent to: wallet.transferTransaction([{ to, amount, type }])
   */
  async createTransferTransaction(to: string, amount: bigint, tokenType?: string): Promise<any> {
    if (!this.keys) throw new Error('Wallet not initialized');
    return await this.callWasm('createTransferTransaction', {
      keys: this.keys,
      to,
      amount: amount.toString(), // Convert bigint to string for JSON
      tokenType
    });
  }

  /**
   * Prove a transaction (generate zero-knowledge proof)
   * Equivalent to: wallet.proveTransaction(recipe)
   */
  async proveTransaction(recipe: any): Promise<any> {
    if (!this.keys) throw new Error('Wallet not initialized');
    return await this.callWasm('proveTransaction', {
      keys: this.keys,
      recipe
    });
  }

  /**
   * Submit transaction to network
   * Equivalent to: wallet.submitTransaction(tx)
   */
  async submitTransaction(tx: any): Promise<string> {
    if (!this.keys) throw new Error('Wallet not initialized');
    return await this.callWasm('submitTransaction', {
      keys: this.keys,
      transaction: tx
    });
  }

  /**
   * Balance a transaction (add inputs to cover outputs)
   * Equivalent to: wallet.balanceTransaction(tx, newCoins)
   */
  async balanceTransaction(tx: any, newCoins: any[] = []): Promise<any> {
    if (!this.keys) throw new Error('Wallet not initialized');
    return await this.callWasm('balanceTransaction', {
      keys: this.keys,
      transaction: tx,
      newCoins
    });
  }

  /**
   * Serialize current wallet state for backup/restore
   * Equivalent to: wallet.serializeState()
   */
  async serializeState(): Promise<string> {
    if (!this.keys) throw new Error('Wallet not initialized');
    return await this.callWasm('serializeWalletState', { keys: this.keys });
  }

  /**
   * Get wallet addresses (public keys)
   */
  getCoinPublicKey(): string | null {
    return this.keys?.coinPublicKey || null;
  }

  getEncryptionPublicKey(): string | null {
    return this.keys?.encryptionPublicKey || null;
  }

  /**
   * Check if wallet is initialized with keys
   */
  isInitialized(): boolean {
    return this.keys !== null;
  }

  // Private method to call WASM functions via WebView
  private async callWasm(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = ++this.messageId;
      this.pendingCalls.set(messageId, { resolve, reject });

      const message = {
        action: 'callWalletMethod',
        messageId,
        method,
        params
      };

      this.webViewRef.current?.postMessage(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingCalls.has(messageId)) {
          this.pendingCalls.delete(messageId);
          reject(new Error(`WASM call timeout: ${method}`));
        }
      }, 30000);
    });
  }

  // Handle responses from WebView
  handleWebViewMessage(data: any) {
    if (data.messageId && this.pendingCalls.has(data.messageId)) {
      const { resolve, reject } = this.pendingCalls.get(data.messageId)!;
      this.pendingCalls.delete(data.messageId);

      if (data.success) {
        resolve(data.result);
      } else {
        reject(new Error(data.error || 'WASM call failed'));
      }
    }
  }
}