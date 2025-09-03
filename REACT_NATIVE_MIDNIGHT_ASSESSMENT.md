# React Native + Midnight Network: Technical Assessment

**Date:** January 2025  
**Status:** Current limitations and capabilities assessment

## Executive Summary

React Native cannot fully integrate with Midnight Network's wallet functionality due to fundamental WASM dependencies. This document outlines what IS and IS NOT possible in a React Native environment.

---

## ❌ What's NOT Possible in React Native

### 1. **Balance Fetching**
- **Blocker:** Requires WASM for coin decryption
- **Why:** All coins on Midnight are encrypted for privacy. Calculating balance requires:
  1. Fetching encrypted coins from blockchain
  2. Decrypting with `EncryptionSecretKey` (WASM operation)
  3. Validating coin ownership
  4. Summing values by token type
- **No workaround exists** - The indexer only stores encrypted data

### 2. **Exact Lace Seed Derivation**
- **Blocker:** `SecretKeys.fromSeed()` requires WASM
- **Why:** Lace uses `@midnight-ntwrk/zswap` SecretKeys class which:
  1. Is implemented in Rust/WASM
  2. Performs cryptographic operations not available in JS
  3. Cannot be replicated without the exact WASM implementation
- **Result:** Our HD derivation produces different keys than Lace

### 3. **Transaction Creation & Signing**
- **Blocker:** Requires WASM for proof generation
- **Why:** 
  1. Zero-knowledge proofs require heavy cryptographic computation
  2. Transaction balancing needs coin decryption
  3. Signing uses WASM-based secret keys

### 4. **Viewing Key Operations**
- **Blocker:** Even if we had the derivation method, decryption still requires WASM
- **Why:** The viewing key is used to decrypt coins, which uses WASM crypto operations

---

## ✅ What IS Possible in React Native

### 1. **Mnemonic Generation & Validation**
```typescript
// WORKING - Using @scure/bip39
import { generateMnemonic, validateMnemonic } from '@scure/bip39';

const mnemonic = generateMnemonic();  // ✅ Works
const isValid = validateMnemonic(mnemonic);  // ✅ Works
```

### 2. **HD Key Derivation (BIP-32/BIP-44)**
```typescript
// WORKING - Our own HD derivation
import { HDKey } from '@scure/bip32';

const seed = mnemonicToSeedSync(mnemonic);
const rootKey = HDKey.fromMasterSeed(seed);
const derived = rootKey.derive("m/44'/2400'/0'/0/0");  // ✅ Works
```
**Note:** Produces different keys than Lace's SecretKeys.fromSeed()

### 3. **Address Generation (Partial)**
```typescript
// WORKING - Bech32m encoding
import { bech32m } from 'bech32';

const address = bech32m.encode('mn_shield-addr', data);  // ✅ Works
```
**Limitation:** Without proper keys from SecretKeys, addresses won't match Lace

### 4. **Read-Only Blockchain Queries**
```typescript
// WORKING - GraphQL queries to indexer
const client = new ApolloClient({
  uri: 'https://indexer.testnet.midnight.network/api/v1/graphql'
});

// Can query:
// - Block heights
// - Transaction hashes  
// - Contract states (encrypted)
// - Network status
```

### 5. **Lace Wallet Connection (Limited)**
```typescript
// WORKING - dApp Connector
import { DAppConnectorAPI } from '@midnight-ntwrk/dapp-connector-api';

// Can get:
// - Wallet address  // ✅
// - Public keys     // ✅
// - Sign transactions (via Lace) // ✅

// Cannot get:
// - Balance        // ❌
// - Coin list      // ❌
// - Private keys   // ❌
```

---

## 🔧 Current Implementation Status

### Working Components
| Component | Status | File |
|-----------|--------|------|
| Mnemonic Generation | ✅ Working | `lib/mnemonicGenerator.ts` |
| HD Wallet Derivation | ✅ Working (not Lace-compatible) | `lib/hdWallet.ts` |
| Address Generation | ✅ Working (not Lace-compatible) | `lib/addressGeneration.ts` |
| Network Connection Test | ✅ Working | `lib/networkConnection.ts` |
| Crypto Polyfills | ✅ Working | `lib/cryptoSetup.ts` |

### Blocked Components
| Component | Blocker | Alternative |
|-----------|---------|-------------|
| Balance Fetching | WASM required for coin decryption | Backend service needed |
| Lace-compatible Keys | SecretKeys.fromSeed() is WASM | Cannot replicate |
| Transaction Creation | Proof generation requires WASM | Use Lace via dApp connector |
| Coin Management | LocalState requires WASM | Not possible |

---

## 🚀 Recommended Architecture

Given the limitations, here's the recommended approach for a React Native Midnight app:

### Option 1: Hybrid Architecture (Recommended)
```
┌─────────────────────────────┐
│   React Native App          │
│   - UI/UX                   │
│   - Mnemonic generation     │
│   - Read-only queries       │
└──────────┬──────────────────┘
           │
           ├──── GraphQL ───→ Midnight Indexer (Read-only)
           │
           └──── dApp API ──→ Lace Wallet (Sign transactions)
```

### Option 2: Backend Service Architecture
```
┌─────────────────────────────┐
│   React Native App          │
└──────────┬──────────────────┘
           │
    ┌──────▼──────────────────┐
    │   Node.js Backend        │
    │   - WalletBuilder (WASM) │
    │   - Balance queries      │
    │   - Transaction creation  │
    └──────────────────────────┘
```
**⚠️ Security Risk:** Backend has access to seeds/private keys

### Option 3: WebView Bridge
```
┌─────────────────────────────┐
│   React Native App          │
│        ┌─────────────┐      │
│        │   WebView   │      │
│        │   (WASM OK) │      │
│        └─────────────┘      │
└─────────────────────────────┘
```
**Note:** Performance and UX limitations

---

## 📊 Comparison: Our Keys vs Lace Keys

| Aspect | Our Implementation | Lace Implementation |
|--------|-------------------|---------------------|
| Mnemonic | ✅ Same (BIP-39) | ✅ Same (BIP-39) |
| Seed Generation | ✅ Same | ✅ Same |
| Key Derivation | ❌ HD (BIP-32) | ❌ SecretKeys.fromSeed() (WASM) |
| Addresses | ❌ Different | ❌ Different |
| Balance Query | ❌ Not possible | ✅ Via WASM |
| Transaction Signing | ❌ Not possible | ✅ Via WASM |

---

## 🎯 Key Findings

1. **WASM is fundamental** to Midnight's privacy architecture
2. **Balance calculation** requires decrypting coins, which needs WASM
3. **Lace doesn't expose balance** through dApp connector
4. **Our HD derivation** works but produces different keys than Lace
5. **No pure React Native solution** exists for full wallet functionality

---

## 💡 Recommendations

### For MVP/Demo
1. Use **mnemonic generation** for onboarding flow
2. Connect to **Lace wallet** for actual transactions
3. Show **address and public keys** (available from Lace)
4. Use **mock balances** for UI development

### For Production
1. **Wait for React Native WASM support** (experimental in 0.73+)
2. OR: Build a **trusted backend service** with Node.js
3. OR: Create a **companion browser extension**
4. OR: Use **WebView** for wallet operations

### For Testing
1. Continue using our **HD wallet implementation** for development
2. Test transaction flows with **Lace integration**
3. Use **testnet faucets** for funding
4. Mock balance displays for UI testing

---

## 🚀 BREAKTHROUGH: Polygen WASM Solution

### **NEW POSSIBILITY: Callstack Polygen**
**URL:** https://github.com/callstackincubator/polygen  
**Status:** Early development, promising approach

#### How Polygen Works:
1. **Ahead-of-Time Compilation:** Converts WASM → C code at build time
2. **JSI Integration:** Creates React Native bindings for WASM modules  
3. **No Runtime WASM:** Bypasses iOS JIT restrictions by pre-compiling

#### Compatibility Assessment for @midnight-ntwrk/zswap:

| Requirement | Polygen Support | Midnight zswap |
|-------------|----------------|----------------|
| **WASM Core 2.0** | ✅ Yes | ✅ Compatible |
| **Complex Crypto Ops** | ✅ Near-native speed | ✅ Rust cryptography |
| **Module Size** | ✅ AoT handles large modules | ⚠️ 2.4MB WASM file |
| **Static Imports** | ✅ Build-time compilation | ✅ Static module |

#### Current Limitations for Our Use Case:
- ❌ **React Native 0.75+ required** (we have 0.79.6 ✅)
- ❌ **New Architecture only** (needs migration from Expo)
- ❌ **iOS only** (Android support planned)
- ❌ **Early development** (use at your own risk)

#### Potential Implementation:
```typescript
// After Polygen setup
import '@callstack/polygen/polyfill';

// This could work with Polygen:
import { SecretKeys } from '@midnight-ntwrk/zswap';

// WASM operations that were impossible before:
const keys = SecretKeys.fromSeed(seedBytes);  // ✅ Could work!
const balance = wallet.state().balances;      // ✅ Could work!
```

---

## 🔮 Future Possibilities

### **IMMEDIATE: Polygen Evaluation (HIGH PRIORITY)**
1. **Test compatibility** with `@midnight-ntwrk/zswap`
2. **Migrate to new RN architecture** if needed
3. **Create proof-of-concept** with balance fetching
4. **Assess performance** with 2.4MB WASM module

### If Polygen works:
- ✅ **Direct integration** with `@midnight-ntwrk/zswap`  
- ✅ **Native balance queries** in React Native
- ✅ **Full wallet functionality** without backend
- ✅ **Lace-compatible key derivation** using SecretKeys.fromSeed()

### If React Native adds native WASM support:
- Direct integration with `@midnight-ntwrk/zswap`
- Native balance queries
- Full wallet functionality

### If Midnight provides REST APIs:
- Server-side balance queries
- Simplified integration
- Reduced client complexity

---

## 📝 Conclusion

### **UPDATED: Polygen Changes Everything**

**Previous State:** React Native could only handle ~40% of wallet functionality due to WASM limitations.

**NEW POSSIBILITY:** Polygen could enable 100% wallet functionality in React Native!

### **Immediate Action Plan:**

1. **HIGH PRIORITY:** Evaluate Polygen with @midnight-ntwrk/zswap
   ```bash
   # Test setup
   npm install @callstack/polygen
   npx @callstack/polygen init
   # Try to process midnight_zswap_wasm_bg.wasm
   ```

2. **If Polygen works:**
   - ✅ Lace-compatible key derivation (SecretKeys.fromSeed)
   - ✅ Native balance fetching (decrypt coins locally)  
   - ✅ Transaction creation and signing
   - ✅ Full wallet functionality without backend

3. **If Polygen doesn't work (fallback):**
   - Continue with hybrid Lace integration approach
   - Wait for Polygen Android support
   - Consider backend service architecture

### **Risk Assessment:**

**Polygen Pros:**
- Solves the fundamental WASM problem
- Enables full Midnight wallet functionality
- No backend dependencies
- Uses official Midnight SDK

**Polygen Cons:**
- Early stage development ("use at your own risk")
- iOS only (Android planned)
- Requires new React Native architecture
- 2.4MB WASM file size impact

**Recommendation:** **IMMEDIATELY test Polygen compatibility** - it could be the breakthrough we need for full React Native + Midnight integration.

---

*Last Updated: January 2025*  
*Based on: @midnight-ntwrk SDK v4.0.0, React Native 0.79.6*