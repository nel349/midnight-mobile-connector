# externref Bridge Architecture Design

## Overview

We need to create a bridge that allows passing JavaScript objects to WASM functions as externref parameters and receiving externref return values back as JavaScript objects.

## WAMR externref API Summary

WAMR provides these key functions:

```c
// Map JS object -> WASM externref index
bool wasm_externref_obj2ref(wasm_module_inst_t module_inst, void *extern_obj, uint32_t *p_externref_idx);

// Map WASM externref index -> JS object  
bool wasm_externref_ref2obj(uint32_t externref_idx, void **p_extern_obj);

// Delete externref mapping
bool wasm_externref_objdel(wasm_module_inst_t module_inst, void *extern_obj);

// Retain externref (prevent cleanup)
bool wasm_externref_retain(uint32_t externref_idx);

// Set cleanup callback
bool wasm_externref_set_cleanup(wasm_module_inst_t module_inst, void *extern_obj, void (*cleanup)(void *));
```

## Bridge Architecture

### 1. Native Side (Objective-C++)

```objc
// Add to WamrModuleInstance struct
struct WamrModuleInstance {
    wasm_module_t module;
    wasm_module_inst_t instance;
    wasm_exec_env_t exec_env;
    uint32_t stack_size;
    uint32_t heap_size;
    std::unordered_map<std::string, wasm_function_inst_t> functionMap;
    
    // NEW: externref management
    std::unordered_map<void*, uint32_t> jsObjectToExternref;  // Track JS object -> externref mappings
    NSMutableSet* retainedObjects;  // Prevent JS objects from being freed
};

// New externref management functions
@interface WamrTurboModule (ExternrefSupport)
- (NSNumber *)createExternref:(id)jsObject forModule:(int)moduleId;
- (id)getExternrefObject:(NSNumber *)externrefId;  
- (void)releaseExternref:(NSNumber *)externrefId forModule:(int)moduleId;
@end
```

### 2. JavaScript Side

```typescript
// Extend the existing TurboModule spec
export interface Spec extends TurboModule {
  // Existing methods
  loadModule(wasmBytesBase64: string): Promise<number>;
  callFunction(moduleId: number, functionName: string, args: number[]): Promise<number>;
  getExports(moduleId: number): Promise<string[]>;
  releaseModule(moduleId: number): Promise<void>;
  
  // NEW: externref support
  createExternref(moduleId: number, jsObject: any): Promise<number>;  // Returns externref ID
  getExternrefObject(externrefId: number): Promise<any>;             // Returns JS object
  releaseExternref(moduleId: number, externrefId: number): Promise<void>;
  
  // NEW: Enhanced function calling with externref support
  callFunctionWithExternref(
    moduleId: number, 
    functionName: string, 
    args: Array<number | {type: 'externref', value: any}>
  ): Promise<any>;
}
```

### 3. Enhanced Function Calling Flow

```typescript
// JavaScript wrapper (src/index.ts)
class WamrModule {
  async callFunctionWithExternref(
    moduleId: number,
    functionName: string,
    args: Array<number | {type: 'externref', value: any}>
  ): Promise<any> {
    
    // Convert arguments
    const processedArgs: Array<number | {type: 'externref', id: number}> = [];
    
    for (const arg of args) {
      if (typeof arg === 'number') {
        processedArgs.push(arg);
      } else if (arg.type === 'externref') {
        // Create externref for JS object
        const externrefId = await NativeWamrModule.createExternref(moduleId, arg.value);
        processedArgs.push({type: 'externref', id: externrefId});
      }
    }
    
    // Call native function with processed args
    const result = await NativeWamrModule.callFunctionWithExternref(moduleId, functionName, processedArgs);
    
    // Handle return value (could be externref)
    if (result && typeof result === 'object' && result.type === 'externref') {
      return await NativeWamrModule.getExternrefObject(result.id);
    }
    
    return result;
  }
}
```

## Implementation Steps

### Phase 2A: Basic externref Support (Week 1)

1. **Extend TurboModule Interface**
   ```objc
   RCT_EXPORT_METHOD(createExternref:(double)moduleId
                     jsObject:(id)jsObject
                     resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject)
   ```

2. **Implement Object-to-externref Mapping**
   ```objc
   - (void)createExternref:(double)moduleId 
                  jsObject:(id)jsObject 
                   resolve:(RCTPromiseResolveBlock)resolve 
                    reject:(RCTPromiseRejectBlock)reject {
       
       auto moduleInstance = getModule(moduleId);
       uint32_t externref_idx;
       
       // Use WAMR API to create externref
       bool success = wasm_externref_obj2ref(moduleInstance->instance, 
                                            (__bridge void*)jsObject, 
                                            &externref_idx);
       
       if (success) {
           // Retain the object to prevent deallocation
           [moduleInstance->retainedObjects addObject:jsObject];
           resolve(@(externref_idx));
       } else {
           reject(@"EXTERNREF_FAILED", @"Failed to create externref", nil);
       }
   }
   ```

3. **Test with Simple externref WASM**
   - Load externref-test.wasm
   - Test `echo_externref` function
   - Test `check_externref` function

### Phase 2B: Function Calling with externref (Week 1-2)

1. **Extend callFunction to Handle externref Parameters**
   ```objc
   RCT_EXPORT_METHOD(callFunctionWithExternref:(double)moduleId
                     functionName:(NSString *)functionName
                     args:(NSArray *)args  // Mixed array of numbers and externref objects
                     resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject)
   ```

2. **Argument Processing**
   - Detect externref arguments: `{type: 'externref', id: number}`
   - Convert externref IDs to WAMR externref values
   - Mix with regular i32/i64 arguments

3. **Return Value Processing**
   - Detect if return type is externref
   - Convert externref back to JavaScript object
   - Handle cleanup/lifecycle

### Phase 2C: Advanced Features (Week 2)

1. **Automatic Type Detection**
   - Inspect WASM function signatures
   - Auto-convert JS objects to externrefs based on signature
   - Remove need for explicit `{type: 'externref', value: obj}` syntax

2. **Memory Management**
   - Implement proper cleanup when modules are released
   - Handle externref lifecycle correctly
   - Prevent memory leaks

3. **Error Handling**
   - Validate externref parameters
   - Handle null externrefs correctly
   - Provide clear error messages

## Test Cases

### Test 1: Basic externref Creation and Retrieval
```javascript
const wamr = new WamrModule();
const moduleId = await wamr.loadModule(externrefTestWasm);

// Create externref for a JS object
const testObj = { name: "test", value: 42 };
const externrefId = await wamr.createExternref(moduleId, testObj);

// Get it back
const retrieved = await wamr.getExternrefObject(externrefId);
console.log(retrieved); // Should be { name: "test", value: 42 }
```

### Test 2: Function Call with externref Parameter
```javascript
// Call echo_externref(obj) -> obj
const result = await wamr.callFunctionWithExternref(moduleId, "echo_externref", [
  {type: 'externref', value: testObj}
]);
console.log(result); // Should be testObj
```

### Test 3: Mixed Parameters
```javascript
// Call a function with both regular args and externref
const result = await wamr.callFunctionWithExternref(moduleId, "process_data", [
  42,                                    // i32
  {type: 'externref', value: dataObj},  // externref  
  3.14                                   // f64
]);
```

## Integration with Midnight

Once externref bridge is working, we can test with Midnight modules:

```javascript
// Load Midnight ledger module
const ledgerModule = await wamr.loadModule(ledgerWasmBytes);

// Create SecretKeys object
const secretKeys = new SecretKeys(/* ... */);

// Call Midnight function with externref
const balance = await wamr.callFunctionWithExternref(ledgerModule, "getBalance", [
  {type: 'externref', value: secretKeys}
]);

console.log("Balance:", balance);
```

## Success Criteria

- ✅ WASM_ENABLE_REF_TYPES builds successfully  
- ⏳ Can load WASM modules with externref functions
- ⏳ Can create externref from JS objects
- ⏳ Can retrieve JS objects from externref
- ⏳ Can call WASM functions with externref parameters
- ⏳ Can receive externref return values as JS objects
- ⏳ Memory management works correctly (no leaks)
- ⏳ Integration with Midnight modules works

This design provides a solid foundation for Phase 2 implementation.