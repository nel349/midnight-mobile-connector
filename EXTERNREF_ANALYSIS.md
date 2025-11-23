# externref Analysis for Midnight Network Integration

## Key Findings

### 1. Midnight's WASM Module Requirements

Midnight's WASM modules (ledger, onchain-runtime, zswap) heavily use externref:
- **521 exports** in the ledger module alone
- Functions accept and return externref types
- Examples of externref usage patterns:
  ```
  type[18] (externref, i32) -> (i32, i32, i32)
  type[19] (i32) -> externref
  type[21] (externref) -> i32
  type[22] (externref) -> externref
  type[36] (externref, externref) -> externref
  ```

### 2. wasm-bindgen's externref Implementation

Midnight uses wasm-bindgen which manages externrefs through:

1. **externref Table**: A WebAssembly table that stores JavaScript object references
   ```javascript
   function addToExternrefTable0(obj) {
       const idx = wasm.__externref_table_alloc();
       wasm.__wbindgen_export_2.set(idx, obj);
       return idx;
   }
   ```

2. **Table Operations**:
   - `__externref_table_alloc()`: Allocate slot for JS object
   - `__externref_table_dealloc(idx)`: Free slot
   - `__externref_drop_slice(ptr, len)`: Drop multiple refs
   - `__wbindgen_export_2`: The actual WebAssembly.Table

3. **Usage Pattern**: JavaScript objects are stored in the table and passed to WASM as indices

### 3. WAMR's Reference Type Support

WAMR does support reference types but needs to be enabled:
- Compile flag: `WASM_ENABLE_REF_TYPES=1` 
- Already updated in our podspec
- Provides the foundation for externref support

## What We Need to Implement

### 1. externref Table Management

We need to create a bridge that mimics wasm-bindgen's table management:

```objc
// Native side (Objective-C++)
class ExternrefTable {
    std::unordered_map<uint32_t, id> jsObjects;  // Map indices to ObjC objects
    uint32_t nextIndex = 1;
    
    uint32_t allocate(id object);
    id get(uint32_t index);
    void deallocate(uint32_t index);
};
```

```typescript
// JavaScript side
interface ExternrefBridge {
    createExternref(object: any): number;  // Returns table index
    getExternref(index: number): any;      // Returns JS object
    dropExternref(index: number): void;    // Frees table slot
}
```

### 2. Function Call Bridge

Extend our function calling to handle externref parameters:

```typescript
// Current API
callFunction(moduleId: number, functionName: string, args: number[]): Promise<number>;

// Needed API
callFunctionWithExternref(
    moduleId: number,
    functionName: string, 
    args: (number | { type: 'externref', value: any })[]
): Promise<any>;
```

### 3. WAMR Runtime Integration

We need to:
1. Initialize WAMR with reference type support
2. Create externref values using WAMR's API
3. Pass externref values to/from WASM functions
4. Manage the lifecycle of externref objects

### 4. Type Mapping

Map JavaScript types to WASM types:
- `number` → `i32`/`i64`/`f32`/`f64`
- `object` → `externref`
- Handle type inspection for proper conversion

## Implementation Steps

### Step 1: Verify Reference Types Work
1. Rebuild with `WASM_ENABLE_REF_TYPES=1` ✓
2. Test loading a simple WASM module with externref
3. Verify WAMR can handle externref types

### Step 2: Create externref Table
1. Implement native externref table in Objective-C++
2. Expose table operations to JavaScript
3. Test object storage and retrieval

### Step 3: Extend Function Calling
1. Modify `callFunction` to detect externref arguments
2. Convert JS objects to externref table indices
3. Pass indices to WAMR as externref values
4. Convert return externrefs back to JS objects

### Step 4: Test with Midnight Modules
1. Load a Midnight WASM module
2. Call a function that accepts externref
3. Verify SecretKeys can be passed
4. Test balance fetching

## WAMR API Research Needed

Need to investigate WAMR's C API for:
1. Creating externref values: `wasm_ref_new()`?
2. Getting JS values from externref: `wasm_ref_get()`?
3. Table management APIs
4. Type checking for externref parameters

## Example: What Success Looks Like

```javascript
// This should work after implementation:
const wamr = new WamrModule();

// Load Midnight's ledger module
const ledgerModule = await wamr.loadModule(ledgerWasmBytes);

// Create a SecretKeys object (JavaScript object)
const secretKeys = {
    spendingKey: "0x1234...",
    viewingKey: "0x5678..."
};

// Call function that accepts externref
// The bridge automatically converts secretKeys to externref
const balance = await wamr.callFunctionWithExternref(
    ledgerModule,
    "getBalance",
    [secretKeys]  // Automatically handled as externref
);

console.log("Balance:", balance);
```

## Potential Challenges

1. **Object Lifecycle**: Need to properly manage when JS objects are freed
2. **Type Safety**: Ensure correct types are passed to WASM functions
3. **Performance**: Minimize overhead of object table lookups
4. **Memory Management**: Prevent memory leaks in both JS and native side
5. **WAMR Limitations**: May need workarounds if WAMR's externref support is incomplete

## Next Actions

1. Test that reference types are properly enabled in WAMR
2. Research WAMR's externref C API functions
3. Create a minimal externref test case
4. Design the externref table architecture
5. Implement the bridge layer