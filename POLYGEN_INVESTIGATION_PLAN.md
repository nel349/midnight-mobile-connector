# Polygen + Midnight Network Investigation Plan

**Objective:** Determine if Callstack Polygen can enable full Midnight Network wallet functionality in React Native by making `@midnight-ntwrk/zswap` WASM module work.

---

## 🎯 Investigation Goals

### Primary Questions to Answer:
1. Can Polygen compile the 2.4MB `midnight_zswap_wasm_bg.wasm` file?
2. Will the generated C code preserve all cryptographic functionality?
3. Can we access `SecretKeys.fromSeed()` and balance operations?
4. What's the migration effort to new React Native architecture?
5. What's the performance impact with such a large WASM module?

---

## 📋 Phase 1: Technical Prerequisites Analysis

### 1.1 Polygen Requirements Deep Dive
**Status:** 🔄 In Progress

**Tasks:**
- [ ] Analyze Polygen's technical architecture
- [ ] Understand the WASM → C compilation process
- [ ] Check compatibility with Rust-generated WASM modules
- [ ] Investigate JSI bindings generation process
- [ ] Review supported WASM features vs Midnight's requirements

**Key Files to Examine:**
```
node_modules/@midnight-ntwrk/zswap/
├── midnight_zswap_wasm_bg.wasm     # Main WASM file (2.4MB)
├── midnight_zswap_wasm_bg.js       # JS bindings
├── midnight_zswap_wasm.js          # Browser entry
├── midnight_zswap_wasm_fs.js       # Node.js entry
└── zswap.d.ts                      # TypeScript definitions
```

**Research Questions:**
- What WASM opcodes does the Midnight module use?
- Are there any WASM features not supported by Polygen?
- How does the current JS→WASM bridge work?

### 1.2 Current Architecture Analysis
**Status:** 📋 Pending

**Tasks:**
- [ ] Document our current Expo + Old RN Architecture setup
- [ ] List all Midnight Network dependencies and their WASM usage
- [ ] Map out current wallet functionality vs desired functionality
- [ ] Identify migration blockers and requirements

**Current Setup Analysis:**
```
React Native: 0.79.6 ✅ (Polygen needs 0.75+)
Architecture: Old RN Architecture ❌ (Polygen needs New Architecture)
Framework: Expo ⚠️ (May complicate New Architecture migration)
Platform: iOS + Android ⚠️ (Polygen currently iOS only)
```

---

## 📋 Phase 2: WASM Module Deep Analysis

### 2.1 Midnight WASM Module Investigation
**Status:** 📋 Pending

**Tasks:**
- [ ] Analyze WASM binary structure and imports/exports
- [ ] Document all functions exposed by SecretKeys class
- [ ] Map WASM memory usage and requirements
- [ ] Check for threading, exceptions, or GC usage
- [ ] Identify all external dependencies

**Analysis Tools:**
```bash
# WASM analysis tools to use
wabt-tools:
  wasm-objdump -x midnight_zswap_wasm_bg.wasm  # Show exports/imports
  wasm-validate midnight_zswap_wasm_bg.wasm    # Validate WASM
  wasm2wat midnight_zswap_wasm_bg.wasm         # Convert to text format

# Check specific features
wasm-objdump -j import midnight_zswap_wasm_bg.wasm  # Show imports
wasm-objdump -j export midnight_zswap_wasm_bg.wasm  # Show exports
```

### 2.2 Critical Functions Mapping
**Status:** 📋 Pending

**Focus Functions for Testing:**
```typescript
// These MUST work for balance fetching
SecretKeys.fromSeed(seed: Uint8Array)
SecretKeys.prototype.coinPublicKey (getter)
SecretKeys.prototype.encryptionPublicKey (getter)
SecretKeys.prototype.coinSecretKey (getter)
SecretKeys.prototype.encryptionSecretKey (getter)

// These MUST work for wallet operations
LocalState.apply() // For coin processing
LocalState.balance() // For balance calculation
```

---

## 📋 Phase 3: Compatibility Testing Strategy

### 3.1 Minimal Test Environment Setup
**Status:** 📋 Pending

**Approach:**
1. Create isolated test project (separate from main app)
2. Setup bare React Native with New Architecture
3. Install Polygen and attempt WASM compilation
4. Test basic functionality before full integration

**Test Project Structure:**
```
midnight-polygen-test/
├── package.json              # Bare RN + New Architecture
├── polygen.config.js         # Polygen configuration
├── src/
│   ├── wasm/
│   │   └── midnight_zswap_wasm_bg.wasm
│   └── test-midnight.ts      # Test SecretKeys functionality
└── README.md                 # Test results documentation
```

### 3.2 Progressive Testing Stages
**Status:** 📋 Pending

**Stage 1: Basic WASM Compilation**
- [ ] Can Polygen process the 2.4MB WASM file?
- [ ] Does compilation complete without errors?
- [ ] Are all exports properly generated?

**Stage 2: Module Loading**
- [ ] Can we import the generated module?
- [ ] Are TypeScript definitions compatible?
- [ ] Do basic object instantiations work?

**Stage 3: Cryptographic Operations**
- [ ] Does `SecretKeys.fromSeed()` work?
- [ ] Can we access key properties?
- [ ] Do cryptographic computations produce correct results?

**Stage 4: Integration Testing**
- [ ] Can we replicate balance fetching?
- [ ] Does performance meet requirements?
- [ ] Are there memory leaks or crashes?

---

## 📋 Phase 4: Migration Planning

### 4.1 Architecture Migration Assessment
**Status:** 📋 Pending

**Tasks:**
- [ ] Document New React Native Architecture requirements
- [ ] Plan migration from Expo to bare React Native
- [ ] Identify breaking changes in our current codebase
- [ ] Estimate migration effort and timeline

**Migration Checklist:**
- [ ] Enable New Architecture in React Native
- [ ] Migrate away from Expo managed workflow (if needed)
- [ ] Update all native dependencies for New Architecture compatibility
- [ ] Test all existing functionality after migration
- [ ] Setup Polygen integration

### 4.2 Fallback Strategy
**Status:** 📋 Pending

**If Polygen doesn't work:**
- [ ] Continue with hybrid Lace wallet integration
- [ ] Evaluate other WASM solutions (Hermes WASM, etc.)
- [ ] Consider backend service architecture
- [ ] Wait for Polygen maturity or Android support

---

## 📋 Phase 5: Performance & Security Analysis

### 5.1 Performance Testing
**Status:** 📋 Pending

**Metrics to Measure:**
- [ ] WASM compilation time (build time impact)
- [ ] App bundle size increase (2.4MB WASM → C code size)
- [ ] Cryptographic operation speed vs Node.js
- [ ] Memory usage during operations
- [ ] Battery impact on mobile devices

### 5.2 Security Considerations
**Status:** 📋 Pending

**Security Review:**
- [ ] Does AoT compilation preserve cryptographic security?
- [ ] Are there timing attack vulnerabilities?
- [ ] Is key material properly protected in memory?
- [ ] Does the compilation process introduce vulnerabilities?

---

## 🔧 Investigation Tools & Resources

### Essential Tools
```bash
# Polygen
npm install -g @callstack/polygen

# WASM analysis
brew install wabt  # For wasm-objdump, wasm-validate, etc.

# React Native New Architecture
npx react-native@latest init --template react-native-template-typescript

# Debugging
npx react-native log-ios
npx react-native log-android
```

### Key Documentation
- [Polygen GitHub](https://github.com/callstackincubator/polygen)
- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [WASM Binary Format](https://webassembly.github.io/spec/core/binary/index.html)
- [Midnight SDK Documentation](https://docs.midnight.network/)

---

## 📊 Success Criteria

### Minimum Viable Success
✅ **Must Have:**
- Polygen can compile midnight_zswap_wasm_bg.wasm
- SecretKeys.fromSeed() works and produces correct keys
- Basic balance fetching functionality works

### Full Success
🎯 **Nice to Have:**
- Performance comparable to Node.js implementation
- Full transaction creation and signing works
- Memory usage is acceptable for mobile devices
- Migration path from current codebase is clear

### Show Stopper Issues
❌ **Deal Breakers:**
- WASM compilation fails
- Cryptographic operations produce incorrect results
- Performance is unusably slow
- Memory usage causes crashes
- Security vulnerabilities introduced

---

## 📅 Investigation Timeline

### Week 1: Analysis & Setup
- [ ] Complete Phase 1 & 2 (Prerequisites + WASM Analysis)
- [ ] Setup test environment
- [ ] Initial Polygen compatibility testing

### Week 2: Core Testing
- [ ] Complete Phase 3 (Compatibility Testing)
- [ ] Test SecretKeys functionality
- [ ] Performance benchmarking

### Week 3: Integration Planning
- [ ] Complete Phase 4 & 5 (Migration + Security Analysis)
- [ ] Make Go/No-Go decision
- [ ] Create implementation roadmap

---

## 🎯 Next Immediate Actions

1. **START HERE:** Deep dive into Polygen's technical architecture
2. **THEN:** Analyze the midnight_zswap_wasm_bg.wasm binary
3. **THEN:** Create minimal test environment
4. **THEN:** Attempt basic WASM compilation test

---

*This plan ensures we thoroughly understand the feasibility before committing to implementation.*