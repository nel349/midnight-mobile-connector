# Midnight Network Balance Implementation Plan

## 🎯 **Goal**
Implement real tDUST balance fetching using the Midnight Indexer API, following the same approach as Lace wallet.

## 📋 **Implementation Steps**

### **Phase 1: Viewing Key Derivation**
- **Research**: How to derive viewing keys from wallet seed/private keys
- **Implementation**: Create viewing key derivation function from our existing keys
- **Dependencies**: `@midnight-ntwrk/zswap` for key derivation utilities
- **Output**: Function that converts wallet private keys → viewing keys

### **Phase 2: Indexer Connection**
- **GraphQL Mutation**: Implement `connect(viewingKey: ViewingKey!)` 
- **Session Management**: Store session ID returned from connection
- **Error Handling**: Handle connection failures gracefully
- **Output**: Authenticated session with Midnight indexer

### **Phase 3: Shielded Transaction Subscription**
- **GraphQL Subscription**: Subscribe to `shieldedTransactions`
- **WebSocket Connection**: Establish persistent connection for real-time updates
- **Transaction Filtering**: Process only transactions belonging to our addresses
- **Output**: Stream of decrypted shielded transactions

### **Phase 4: Balance Calculation**
- **UTXO Processing**: Calculate balance from unspent transaction outputs
- **Transaction Analysis**: Track received vs spent outputs
- **Balance State**: Maintain running balance total
- **Output**: Real tDUST balance from blockchain data

### **Phase 5: Integration & Testing**
- **Update UI**: Display real balance in wallet interface
- **Test with Faucet**: Verify we can detect the existing 1000 tDUST transaction
- **Real-time Updates**: Ensure balance updates when new transactions arrive
- **Output**: Working balance display showing 1000 tDUST

## 🏗️ **Technical Architecture**

```typescript
// 1. Derive viewing keys from wallet (32 bytes + Bech32m encoding)
const viewingKeys = await deriveViewingKeyFromSeed(walletSeed);
const viewingKey = viewingKeys[0]; // Try first candidate

// 2. Connect to indexer using Bech32m format
const sessionId = await indexer.connect(viewingKey.bech32m);

// 3. Subscribe to shielded transactions
indexer.subscribe('shieldedTransactions', (transaction) => {
  if (belongsToWallet(transaction, ourAddresses)) {
    updateBalance(transaction);
  }
});

// 4. Calculate balance from UTXOs
const balance = calculateBalanceFromUTXOs(transactions);
```

## 📦 **Required Dependencies**
- `@midnight-ntwrk/zswap` - For viewing key derivation
- `@midnight-ntwrk/wallet-api` - For wallet interfaces
- GraphQL WebSocket client - For subscriptions
- Existing address generation - Already working

## 🎯 **Success Criteria**
- ✅ Viewing keys derived from wallet seed
- ✅ Successfully connect to indexer with session
- ✅ Receive shielded transactions via subscription
- ✅ Calculate balance showing 1000 tDUST from faucet
- ✅ Real-time balance updates on new transactions

## 🚧 **Current Status**
- ✅ Address generation works (faucet accepted our addresses)
- ✅ Private keys available for viewing key derivation
- ✅ Indexer GraphQL endpoint accessible
- ⏳ Need to implement viewing key derivation
- ⏳ Need to implement connect mutation
- ⏳ Need to implement shielded transaction subscription

## 📝 **Notes**
- This follows the exact same pattern as Lace wallet
- No mock data - real blockchain interaction only
- Faucet transaction (ID: `0000000096084cea...`) should be detectable once implemented
- Balance will be calculated locally from decrypted transaction data