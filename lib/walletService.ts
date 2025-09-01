/**
 * Wallet Service - Bridge between HD wallet and Contract Platform
 * 
 * Connects the working HD wallet generation with the working contract interaction platform.
 * This is the integration layer that brings together:
 * - HD wallet generation (Step 3)
 * - Address generation (Step 4) 
 * - Contract platform (Step 6)
 */

import { generateWallet, createWalletFromSeed, type MidnightWallet } from './midnightWallet';
import { generateWalletAddresses, type MidnightAddress } from './addressGeneration';
import { createProvidersForNetwork, type BasicMidnightProviders } from './midnightProviders';
import { createBankContractExecutor, type CircuitExecutor } from './circuitExecutor';
import { generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';

export interface WalletServiceConfig {
  networkType: 'local' | 'testnet' | 'mainnet';
  contractAddress?: string;
}

export interface IntegratedWallet {
  // HD Wallet data
  wallet: MidnightWallet;
  addresses: {
    testnet: MidnightAddress[];
    mainnet: MidnightAddress[];
    devnet: MidnightAddress[];
    undeployed: MidnightAddress[];
  };
  
  // Network infrastructure
  providers: BasicMidnightProviders;
  contractExecutor?: CircuitExecutor;
  
  // Configuration
  config: WalletServiceConfig;
}

export class WalletService {
  private config: WalletServiceConfig;

  constructor(config: WalletServiceConfig) {
    this.config = config;
  }

  /**
   * Create a new integrated wallet with all systems connected
   */
  async createWallet(): Promise<IntegratedWallet> {
    console.log('🏗️ Creating integrated wallet...');
    
    // Step 1: Generate HD wallet (existing working system)
    console.log('📱 Generating HD wallet...');
    const wallet = await generateWallet();
    console.log(`✅ HD wallet created with ${wallet.keyPairs.length} key pairs`);
    
    // Step 2: Generate addresses for all networks (existing working system)
    console.log('🏠 Generating addresses for all networks...');
    const addresses = {
      testnet: await generateWalletAddresses(wallet.keyPairs, 'TestNet'),
      mainnet: await generateWalletAddresses(wallet.keyPairs, 'MainNet'),
      devnet: await generateWalletAddresses(wallet.keyPairs, 'DevNet'),
      undeployed: await generateWalletAddresses(wallet.keyPairs, 'Undeployed'),
    };
    console.log(`✅ Generated addresses for all networks`);
    
    // Step 3: Connect to network infrastructure (existing working system)
    console.log(`🌐 Connecting to ${this.config.networkType} network...`);
    const providers = await createProvidersForNetwork(this.config.networkType);
    console.log('✅ Network providers connected');
    
    // Step 4: Optional contract executor setup
    let contractExecutor: CircuitExecutor | undefined;
    if (this.config.contractAddress) {
      console.log('🔧 Setting up contract executor...');
      contractExecutor = await createBankContractExecutor(
        this.config.contractAddress, 
        this.config.networkType
      );
      console.log('✅ Contract executor ready');
    }
    
    const integratedWallet: IntegratedWallet = {
      wallet,
      addresses,
      providers,
      contractExecutor,
      config: this.config,
    };
    
    console.log('🎉 Integrated wallet created successfully!');
    return integratedWallet;
  }

  /**
   * Restore wallet from existing seed
   */
  async restoreWallet(seedHex: string): Promise<IntegratedWallet> {
    console.log('🔄 Restoring wallet from seed...');
    
    // Convert hex seed back to Uint8Array
    const seedBytes = new Uint8Array(
      seedHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    
    // Step 1: Restore HD wallet
    const wallet = await createWalletFromSeed(seedBytes);
    console.log(`✅ HD wallet restored with ${wallet.keyPairs.length} key pairs`);
    
    // Step 2: Generate addresses (same as create)
    const addresses = {
      testnet: await generateWalletAddresses(wallet.keyPairs, 'TestNet'),
      mainnet: await generateWalletAddresses(wallet.keyPairs, 'MainNet'),
      devnet: await generateWalletAddresses(wallet.keyPairs, 'DevNet'),
      undeployed: await generateWalletAddresses(wallet.keyPairs, 'Undeployed'),
    };
    
    // Step 3: Connect to network
    const providers = await createProvidersForNetwork(this.config.networkType);
    
    // Step 4: Optional contract executor
    let contractExecutor: CircuitExecutor | undefined;
    if (this.config.contractAddress) {
      contractExecutor = await createBankContractExecutor(
        this.config.contractAddress, 
        this.config.networkType
      );
    }
    
    const integratedWallet: IntegratedWallet = {
      wallet,
      addresses,
      providers,
      contractExecutor,
      config: this.config,
    };
    
    console.log('🎉 Integrated wallet restored successfully!');
    return integratedWallet;
  }

  /**
   * Get balance for a specific address using the contract platform
   */
  async getBalance(integratedWallet: IntegratedWallet, role: string = 'NightExternal'): Promise<any> {
    const networkAddresses = this.getNetworkAddresses(integratedWallet);
    const roleAddress = networkAddresses.find(addr => addr.role === role);
    
    if (!roleAddress) {
      throw new Error(`No address found for role: ${role}`);
    }
    
    console.log(`💰 Querying balance for ${role}: ${roleAddress.address.substring(0, 20)}...`);
    
    // Use the contract platform to query balance
    // This connects the wallet system to the working contract querying system
    try {
      const contractState = await integratedWallet.providers.contractQuerier.queryActualContractState(
        roleAddress.address
      );
      
      if (contractState) {
        console.log('✅ Balance query successful');
        return {
          role,
          address: roleAddress.address,
          balance: '0', // TODO: Parse actual balance from contract state
          state: contractState
        };
      } else {
        console.log('ℹ️ No contract state found (normal for new addresses)');
        return {
          role,
          address: roleAddress.address,
          balance: '0',
          state: null
        };
      }
    } catch (error) {
      console.error('❌ Balance query failed:', error);
      throw new Error(`Balance query failed: ${error}`);
    }
  }

  /**
   * Execute a contract circuit using the integrated wallet
   */
  async executeCircuit(
    integratedWallet: IntegratedWallet, 
    circuitName: string, 
    parameters: any[] = []
  ): Promise<any> {
    if (!integratedWallet.contractExecutor) {
      throw new Error('Contract executor not configured');
    }
    
    console.log(`⚡ Executing circuit: ${circuitName}`);
    const result = await integratedWallet.contractExecutor.executeCircuitByName(circuitName, parameters);
    console.log('✅ Circuit execution completed');
    
    return result;
  }

  /**
   * Get addresses for the current network
   */
  private getNetworkAddresses(integratedWallet: IntegratedWallet): MidnightAddress[] {
    switch (this.config.networkType) {
      case 'testnet':
        return integratedWallet.addresses.testnet;
      case 'mainnet':
        return integratedWallet.addresses.mainnet;
      case 'local':
      default:
        return integratedWallet.addresses.undeployed;
    }
  }

  /**
   * Get wallet summary information
   */
  getWalletSummary(integratedWallet: IntegratedWallet): any {
    const networkAddresses = this.getNetworkAddresses(integratedWallet);
    
    return {
      seedHex: integratedWallet.wallet.seedHex,
      keyPairs: integratedWallet.wallet.keyPairs.length,
      addresses: networkAddresses.length,
      network: this.config.networkType,
      hasContractExecutor: !!integratedWallet.contractExecutor,
      primaryAddress: networkAddresses[0]?.address,
      roles: networkAddresses.map(addr => addr.role)
    };
  }
}

/**
 * Convenience function to create a wallet service
 */
export function createWalletService(config: WalletServiceConfig): WalletService {
  return new WalletService(config);
}