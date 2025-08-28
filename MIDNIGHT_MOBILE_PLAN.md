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
**Status:** ✅ COMPLETED

- [x] **STEP 2:** Implement BIP39 mnemonic → PBKDF2-SHA512 seed derivation (2048 iterations)
- [x] Test with official Midnight HD Wallet SDK (`@midnight-ntwrk/wallet-sdk-hd`)
- [x] Validate seed-to-key deterministic generation
- [x] Integration with midnight-bank examples for correctness
- [x] Created reusable Step2_SeedDerivation component

### **PHASE 3: KEY DERIVATION** 🔑
**Status:** ✅ COMPLETED

- [x] **STEP 3:** Implement deterministic key derivation from seeds
- [x] Create deterministic Ed25519 keys for coin operations
- [x] Create deterministic X25519 keys for encryption operations
- [x] Test key consistency across sessions (PASS: All keys deterministic)
- [x] Built complete MidnightWallet SDK (`lib/midnightWallet.ts`)
- [x] Support for all 5 Midnight roles (NightExternal, NightInternal, Dust, Zswap, Metadata)

### **PHASE 4: ADDRESS GENERATION** 🏠
**Status:** ✅ COMPLETED

- [x] **STEP 4:** Implement mobile-compatible Bech32m address generation
- [x] Combine Ed25519 + X25519 public keys for shield addresses
- [x] Support all network types: `mn_shield-addr_test1...`, `mn_shield-addr_undeployed1...`
- [x] Network-aware address generation with proper NetworkId types
- [x] Validate address format compatibility with Lace wallet
- [x] Created reusable address generation SDK (`lib/addressGeneration.ts`)

### **PHASE 5: NETWORK INTEGRATION** 🌐
**Status:** ✅ COMPLETED

- [x] **STEP 5:** Real network connectivity to TestNet-02
- [x] HTTP/WebSocket endpoint testing with axios
- [x] GraphQL indexer integration for blockchain queries
- [x] RPC node connectivity for system health checks
- [x] Local prover server fallback for ZK proof generation
- [x] Real wallet balance fetching via direct GraphQL
- [x] Hybrid network configuration (TestNet + Local Prover)
- [x] Mobile-compatible approach without WASM dependencies

### **PHASE 6: MULTI-WALLET SYSTEM** 💼
**Status:** ✅ COMPLETED

- [x] **Multi-Wallet Manager:** Production-ready wallet management system
- [x] **Secure Storage:** AsyncStorage-based persistence with encryption-ready architecture
- [x] **Wallet Operations:** Create, import, delete, and switch between up to 5 wallets
- [x] **Visual Identity:** Unique emoji icons and color themes for each wallet
- [x] **Network Integration:** Full compatibility with existing network connection system
- [x] **TypeScript Safety:** Complete type safety with proper interfaces
- [x] **User Experience:** Professional UI with confirmation dialogs and error handling
- [x] **Storage Architecture:** Prepared for future encryption and biometric security

### **PHASE 7: PRODUCTION READY** 🏆
**Status:** 🔄 IN PROGRESS

- [x] ✅ Complete wallet functionality (create, import, manage, network connectivity)
- [x] ✅ Real TestNet-02 integration with local prover fallback
- [x] ✅ Multi-wallet storage system with secure persistence
- [ ] ⏳ Security audit of crypto implementation
- [ ] ⏳ Performance optimization for mobile devices
- [ ] ⏳ Enhanced error handling and recovery mechanisms
- [ ] ⏳ Biometric authentication (Face ID / Touch ID)
- [ ] ⏳ Transaction signing and submission capabilities
- [ ] ⏳ Zero-knowledge proof integration for private transactions

---

## 🛠 **TECHNICAL ARCHITECTURE**

### **Core Components:**
```
MidnightWasmTest/
├── lib/
│   ├── cryptoSetup.ts              # Web Crypto API polyfill
│   ├── midnightWallet.ts           # Complete wallet SDK
│   ├── keyDerivationUtils.ts       # Deterministic key generation
│   ├── addressGeneration.ts        # Bech32m address encoding
│   ├── networkConnection.ts        # TestNet-02 connectivity
│   └── walletManager.ts            # Multi-wallet storage system
├── components/
│   ├── WalletBuilder.tsx           # Phase navigation system
│   ├── Step1_BasicCrypto.tsx       # Crypto algorithm validation
│   ├── Step2_SeedDerivation.tsx    # BIP39 + HD wallet
│   ├── Step3_KeyDerivation.tsx     # Ed25519 + X25519 keys
│   ├── Step4_AddressGeneration.tsx # Bech32m addresses
│   ├── Step5_NetworkIntegration.tsx # Network connectivity
│   └── MultiWalletManager.tsx      # Production wallet manager
└── phase5/
    └── NetworkConnection.tsx       # Network testing UI
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
TestNet-02 Indexer: https://indexer.testnet-02.midnight.network/api/v1/graphql
TestNet-02 RPC Node: https://rpc.testnet-02.midnight.network  
Local Prover (Fallback): http://localhost:6300
WebSocket: wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws
Axios HTTP Client: Proper request handling with timeouts
```

### **Multi-Wallet Architecture:**
```
WalletStore (AsyncStorage)
├── wallets: StoredWallet[]          # Up to 5 wallets
├── activeWalletId: string          # Currently selected wallet
└── metadata: { themes, version }    # Storage metadata

StoredWallet
├── metadata: { name, network, color, icon, dates }
├── wallet: MidnightWallet          # Keys + addresses
└── encryptedSeed: string?          # Future encryption
```

---

## 🎯 **CURRENT STATUS & NEXT STEPS**

### **✅ COMPLETED FEATURES:**
1. **Complete Wallet Development Stack** - All 5 phases working
2. **Multi-Wallet System** - Store/manage up to 5 wallets with themes
3. **Real Network Integration** - TestNet-02 connectivity with local prover fallback  
4. **Production-Ready UI** - Professional wallet management interface
5. **Mobile-Compatible Architecture** - No WASM dependencies, pure React Native

### **🔄 NEXT PRIORITIES:**
1. **Transaction Signing** - Implement Ed25519 transaction signatures
2. **ZK Proof Integration** - Use local prover for private transactions
3. **Enhanced Security** - Add biometric authentication and seed encryption
4. **Performance Optimization** - Optimize for mobile device constraints
5. **User Experience** - Polish UI/UX for production deployment

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

### **✅ ACHIEVED MILESTONES:**
- [x] ✅ Web Crypto API working perfectly in React Native
- [x] ✅ Generate keys from BIP39 seeds deterministically (all roles)
- [x] ✅ Create valid Bech32m Midnight addresses (test/undeployed/mainnet)
- [x] ✅ Connect to TestNet-02 and query blockchain data
- [x] ✅ Multi-wallet storage system with up to 5 wallets
- [x] ✅ Production-ready UI with professional wallet management
- [x] ✅ Real network integration with local prover fallback
- [x] ✅ Complete mobile-compatible architecture (no WASM)

### **🎯 REMAINING GOALS:**
- [ ] 🔄 Sign and submit transactions to TestNet-02
- [ ] 🔄 Zero-knowledge proof integration for privacy
- [ ] 🔄 Biometric authentication and seed encryption
- [ ] 🎯 **Full parity with Lace wallet functionality**

**🌙 Building the future of privacy-first mobile wallets, one step at a time!**