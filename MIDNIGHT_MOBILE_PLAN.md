# 🌙 Midnight Mobile Wallet Connector - Development Plan

## 📋 **PROJECT OVERVIEW**

**Goal:** Build a native mobile wallet connector for Midnight Network from scratch, bypassing the broken WASM modules and using Web Crypto API + reverse-engineered protocols.

**Why:** The official `SecretKeys.fromSeed()` WASM function is intentionally disabled for security reasons. After extensive reverse engineering (documented in `chatReverseEngineering.md`), we discovered we need to build our own native implementation.

---

## 🔍 **RESEARCH COMPLETED**

### **✅ Cryptographic Stack Confirmed:**
1. **BIP39 + PBKDF2-SHA512** (2048 iterations, 64-byte output, first 32 bytes as seed)
2. **Ed25519** keys for signing/coin operations
3. **X25519** keys for encryption/private transactions  
4. **Bech32m** address format (`mn_shield-addr_test1...`)
5. **@noble/curves** + **@noble/hashes** crypto libraries (JavaScript)
6. **curve25519-dalek** backend (Rust native)

### **✅ Key Discovery Sources:**
- `midnight-bank/bank-api/src/test/commons.ts` - Seed format: 64-char hex strings
- `midnight-testing-playground/src/test-lace-cardano-methods.ts` - BIP39 patterns
- `midnight-testing-playground/src/find-lace-derivation.ts` - PBKDF2 parameters
- Midnight codebase analysis for Ed25519/X25519 usage patterns

---

## 📐 **DEVELOPMENT PHASES**

### **PHASE 1: FOUNDATION** 🚀
**Status:** ✅ COMPLETED

- [x] Research Midnight/Lace cryptographic algorithms
- [x] Document exact BIP39 + PBKDF2 + Ed25519/X25519 + Bech32m stack
- [x] Create React Native crypto polyfill (`lib/cryptoSetup.ts`)
- [x] Update Step1_BasicCrypto component for algorithm validation
- [x] Fix TypeScript compilation errors
- [x] Establish foundation for native crypto operations

**Current Test:** Ed25519 + X25519 key generation working in React Native

### **PHASE 2: SEED DERIVATION** 📱
**Status:** 🔄 IN PROGRESS

- [ ] **STEP 2:** Implement BIP39 mnemonic → PBKDF2-SHA512 seed derivation (2048 iterations)
- [ ] Test with known seed: `0000000000000000000000000000000000000000000000000000000000000001`
- [ ] Validate seed-to-key deterministic generation
- [ ] Compare with midnight-bank examples for correctness

### **PHASE 3: KEY DERIVATION** 🔑
**Status:** ⏳ PENDING

- [ ] **STEP 3:** Implement HKDF key derivation from seeds
- [ ] Create deterministic Ed25519 keys from seed + "coin" salt
- [ ] Create deterministic X25519 keys from seed + "encryption" salt  
- [ ] Test key consistency across sessions

### **PHASE 4: ADDRESS GENERATION** 🏠
**Status:** ⏳ PENDING

- [ ] **STEP 4:** Implement Bech32m address generation
- [ ] Combine Ed25519 + X25519 public keys
- [ ] Generate Midnight address hash (SHA-256)
- [ ] Encode to Bech32m format: `mn_shield-addr_test1...`
- [ ] Validate against known Lace addresses

### **PHASE 5: NETWORK INTEGRATION** 🌐
**Status:** ⏳ PENDING

- [ ] Implement network configuration (testnet endpoints)
- [ ] Create balance querying via GraphQL indexer
- [ ] Add transaction signing capabilities
- [ ] Integrate zero-knowledge proof generation
- [ ] Test full wallet lifecycle

### **PHASE 6: PRODUCTION READY** 🏆
**Status:** ⏳ PENDING

- [ ] Security audit of crypto implementation
- [ ] Performance optimization
- [ ] Error handling and recovery
- [ ] Complete mobile UI/UX
- [ ] Documentation and testing

---

## 🛠 **TECHNICAL ARCHITECTURE**

### **Core Components:**
```
MidnightMobileConnector/
├── lib/cryptoSetup.ts          # Web Crypto API polyfill
├── lib/MidnightMobileConnector.ts  # Main wallet connector
├── components/Step1_BasicCrypto.tsx    # Crypto validation UI
└── components/MidnightNativeConnector.tsx  # Full wallet UI
```

### **Crypto Flow:**
```
BIP39 Mnemonic
    ↓ PBKDF2-SHA512 (2048 iter)
64-byte seed (first 32 bytes used)
    ↓ HKDF derivation
Ed25519 Keys (signing) + X25519 Keys (encryption)
    ↓ Public key combination + SHA-256
Bech32m Address (mn_shield-addr_test1...)
```

### **Network Stack:**
```
Indexer: GraphQL queries for balance/transactions
Node: RPC calls for network state
Proof Server: Zero-knowledge proof generation
WebSocket: Real-time updates
```

---

## 🎯 **IMMEDIATE NEXT STEPS**

1. **Test current crypto polyfill** in React Native app
2. **Implement BIP39 seed derivation** (STEP 2)
3. **Add deterministic key generation** from seeds
4. **Create basic address generation** with Bech32m encoding
5. **Progress step-by-step** toward full wallet functionality

---

## 📚 **KEY REFERENCES**

- **Main Reverse Engineering Doc:** `chatReverseEngineering.md` (3.4MB analysis)
- **Midnight Bank Examples:** `midnight-bank/bank-api/src/test/commons.ts`
- **Lace Derivation Research:** `midnight-testing-playground/src/test-lace-cardano-methods.ts`
- **Network Configs:** Testnet endpoints from midnight-bank standalone setup
- **Crypto Libraries:** @noble/curves, @noble/hashes, curve25519-dalek

---

## 🚫 **WHAT WE'RE NOT DOING**

- ❌ **NOT** trying to fix the broken WASM `SecretKeys.fromSeed()`
- ❌ **NOT** using official Midnight SDK (it's broken for mobile)
- ❌ **NOT** using legacy HEX address format (Bech32m only)
- ❌ **NOT** rushing - taking step-by-step foundation-first approach

---

## 💡 **SUCCESS CRITERIA**

- [x] ✅ Web Crypto API working in React Native
- [ ] 🔄 Generate keys from BIP39 seeds deterministically  
- [ ] ⏳ Create valid Bech32m Midnight addresses
- [ ] ⏳ Connect to testnet and query balances
- [ ] ⏳ Sign and submit transactions
- [ ] 🎯 **Full parity with Lace wallet functionality**

**🌙 Building the future of privacy-first mobile wallets, one step at a time!**