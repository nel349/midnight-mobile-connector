# WAMR TurboModule Integration Plan for Midnight Network

## Background
We're using WAMR (WebAssembly Micro Runtime) as a TurboModule to enable Midnight Network's WASM modules in React Native. This approach was chosen because:
- Polygen (our initial choice) doesn't support externref types
- Midnight Network's WASM modules require externref to pass JavaScript objects (like SecretKeys) between JS and WASM

## Goal
Enable Midnight Network functionality in React Native, specifically:
```javascript
// What we're trying to achieve:
const secretKeys = await generateSecretKeys();  // JavaScript object
const balance = await getBalance(secretKeys);   // Pass JS object as externref to WASM
```

## Implementation Phases

### Phase 1: Basic WAMR Integration ✅ COMPLETED
**Timeline:** 1-2 weeks
**Status:** Done with workarounds

**Completed:**
- Created WAMR TurboModule structure
- Added WAMR runtime as dependency
- Implemented basic WASM loading
- Fixed compilation errors (GC/stringref, memory allocator, threading)
- Switched from mini loader to full loader
- Implemented function calling (with workaround for empty export names issue)

**Known Issues:**
- WAMR doesn't properly read export names from our WASM format (shows empty strings)
- Workaround: Using placeholder names (func_0, func_1) with manual mapping

### Phase 2: externref Prototype 🚧 IN PROGRESS
**Timeline:** 2-3 weeks
**Status:** Next step

**Tasks:**
1. Research WAMR externref implementation
   - Check if WAMR supports externref out of the box
   - Understand how to pass JS objects as externrefs
   
2. Implement simple externref passing
   - Create bridge between JS objects and WASM externrefs
   - Handle object lifecycle/memory management
   
3. Test with dummy objects
   - Pass simple JS objects to WASM
   - Return JS objects from WASM
   - Verify object identity preservation

### Phase 3: Midnight Integration
**Timeline:** 1 week
**Status:** Pending

**Tasks:**
1. Test with actual SecretKeys functions
   - Load Midnight's actual WASM modules
   - Pass SecretKeys objects as externrefs
   
2. Integrate balance fetching functionality
   - Call getBalance with SecretKeys
   - Handle async operations
   - Parse and return results

3. Full integration testing
   - Test all required Midnight functions
   - Performance testing
   - Error handling

## Technical Details

### Current Module Structure
```
modules/wamr-turbomodule/
├── ios/
│   ├── WamrTurboModule.h      # Header with WamrModuleInstance struct
│   ├── WamrTurboModule.mm     # Implementation with workarounds
│   └── wamr/                  # WAMR source files
├── src/
│   └── index.ts               # JS interface
└── specs/
    └── NativeWamrModule.ts    # TurboModule spec
```

### Key APIs
```typescript
interface WamrModule {
  loadModule(wasmBytes: string): Promise<number>;  // Returns module ID
  callFunction(moduleId: number, functionName: string, args: number[]): Promise<number>;
  getExports(moduleId: number): Promise<string[]>;
  releaseModule(moduleId: number): Promise<void>;
}
```

### Next Steps for externref Support
Need to extend the API to support:
```typescript
interface WamrModuleWithExternref {
  // New methods needed:
  callFunctionWithExternref(
    moduleId: number, 
    functionName: string, 
    args: (number | object)[]  // Support both numbers and JS objects
  ): Promise<any>;
  
  createExternref(jsObject: any): number;  // Create externref handle
  getExternrefValue(handle: number): any;  // Retrieve JS object from handle
}
```

## Current Blockers

1. **Export Name Issue**: WAMR reads export count correctly but returns empty names
   - Workaround in place using index-based mapping
   - May need to investigate WAMR source or use different WASM format

2. **externref Support**: Unknown if WAMR supports externref
   - Need to research WAMR capabilities
   - May need to implement custom bridge

3. **Midnight WASM Format**: Need to verify Midnight's WASM modules work with WAMR
   - Test with actual Midnight WASM files
   - May need format conversion

## Testing

### Current Test Setup
- Location: `app/(tabs)/wamr-test.tsx`
- Test WASM: Simple module with `test()` and `add()` functions
- Status: Basic function calls working with workaround

### Needed Tests
1. externref passing tests
2. Midnight module loading tests
3. Real SecretKeys integration tests
4. Performance benchmarks

## Resources
- WAMR GitHub: https://github.com/bytecodealliance/wasm-micro-runtime
- Midnight Network Docs: [Need to add]
- WebAssembly externref spec: https://github.com/WebAssembly/reference-types

## Notes
- WAMR was chosen over alternatives because it's lightweight and supports embedded systems
- TurboModules provide better performance than old React Native bridge
- externref is critical for Midnight - it allows passing JS objects without serialization