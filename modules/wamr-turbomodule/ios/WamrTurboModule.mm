#import "WamrTurboModule.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import <React/RCTLog.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCommon/CallInvoker.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "WamrModuleSpec/WamrModuleSpec.h"
#endif

@implementation WamrTurboModule {
    std::unordered_map<int, std::shared_ptr<WamrModuleInstance>> _modules;
    int _nextModuleId;
    bool _initialized;
}

RCT_EXPORT_MODULE(WamrTurboModule)

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (instancetype)init {
    if (self = [super init]) {
        _nextModuleId = 1;
        _initialized = false;
        [self initializeWamr];
    }
    return self;
}

- (void)initializeWamr {
    if (_initialized) return;
    
    // Initialize WAMR runtime (no arguments needed)
    if (!wasm_runtime_init()) {
        RCTLogError(@"Failed to initialize WAMR runtime");
        return;
    }
    
    _initialized = true;
    RCTLogInfo(@"WAMR runtime initialized successfully");
}

- (void)dealloc {
    // Clean up all modules
    _modules.clear();
    
    if (_initialized) {
        wasm_runtime_destroy();
    }
}

// MARK: - TurboModule Methods

RCT_EXPORT_METHOD(loadModule:(NSString *)wasmBytesBase64
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    
    if (!_initialized) {
        reject(@"WAMR_NOT_INITIALIZED", @"WAMR runtime not initialized", nil);
        return;
    }
    
    // Decode base64 to NSData
    NSData *wasmBytes = [[NSData alloc] initWithBase64EncodedString:wasmBytesBase64 options:0];
    if (!wasmBytes) {
        reject(@"INVALID_BASE64", @"Invalid base64 data", nil);
        return;
    }
    
    // Convert NSData to bytes (WAMR needs non-const pointer)
    uint8_t *bytes = (uint8_t *)[wasmBytes bytes];
    uint32_t size = (uint32_t)[wasmBytes length];
    
    // Debug: Log the first 16 bytes of the WASM module
    RCTLogInfo(@"WASM module size: %u bytes", size);
    if (size >= 16) {
        RCTLogInfo(@"WASM header: %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x %02x",
                   bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7],
                   bytes[8], bytes[9], bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15]);
    }
    
    // Load WASM module
    char error_buf[128];
    wasm_module_t module = wasm_runtime_load(bytes, size, error_buf, sizeof(error_buf));
    if (!module) {
        NSString *errorMsg = [NSString stringWithFormat:@"Failed to load WASM module: %s", error_buf];
        RCTLogError(@"WAMR load error: %s", error_buf);
        reject(@"LOAD_MODULE_FAILED", errorMsg, nil);
        return;
    }
    
    // Create module instance
    uint32_t stack_size = 64 * 1024; // 64KB
    uint32_t heap_size = 64 * 1024;  // 64KB
    
    wasm_module_inst_t instance = wasm_runtime_instantiate(module, stack_size, heap_size, 
                                                           error_buf, sizeof(error_buf));
    if (!instance) {
        wasm_runtime_unload(module);
        NSString *errorMsg = [NSString stringWithFormat:@"Failed to instantiate WASM module: %s", error_buf];
        reject(@"INSTANTIATE_FAILED", errorMsg, nil);
        return;
    }
    
    // Create execution environment
    wasm_exec_env_t exec_env = wasm_runtime_create_exec_env(instance, stack_size);
    if (!exec_env) {
        wasm_runtime_deinstantiate(instance);
        wasm_runtime_unload(module);
        reject(@"CREATE_EXEC_ENV_FAILED", @"Failed to create execution environment", nil);
        return;
    }
    
    // Store module instance
    int moduleId = _nextModuleId++;
    auto moduleInstance = std::make_shared<WamrModuleInstance>();
    moduleInstance->module = module;
    moduleInstance->instance = instance;
    moduleInstance->exec_env = exec_env;
    moduleInstance->stack_size = stack_size;
    moduleInstance->heap_size = heap_size;
    
    _modules[moduleId] = moduleInstance;
    
    resolve(@(moduleId));
}

RCT_EXPORT_METHOD(callFunction:(double)moduleId
                  functionName:(NSString *)functionName
                  args:(NSArray *)args
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    
    int modId = (int)moduleId;
    auto it = _modules.find(modId);
    if (it == _modules.end()) {
        reject(@"MODULE_NOT_FOUND", @"Module not found", nil);
        return;
    }
    
    auto moduleInstance = it->second;
    
    // Find function
    wasm_function_inst_t func = wasm_runtime_lookup_function(moduleInstance->instance, 
                                                             [functionName UTF8String]);
    if (!func) {
        reject(@"FUNCTION_NOT_FOUND", 
               [NSString stringWithFormat:@"Function '%@' not found", functionName], 
               nil);
        return;
    }
    
    // Prepare arguments (fixed size array for C++ compatibility)
    uint32_t argc = (uint32_t)[args count];
    uint32_t argv[16]; // Fixed size array, max 15 args + return value
    if (argc > 15) {
        reject(@"TOO_MANY_ARGS", @"Maximum 15 arguments supported", nil);
        return;
    }
    
    for (uint32_t i = 0; i < argc; i++) {
        argv[i] = [[args objectAtIndex:i] unsignedIntValue];
    }
    
    // Call function
    if (!wasm_runtime_call_wasm(moduleInstance->exec_env, func, argc, argv)) {
        const char *error = wasm_runtime_get_exception(moduleInstance->instance);
        NSString *errorMsg = [NSString stringWithFormat:@"Function call failed: %s", 
                              error ? error : "unknown error"];
        reject(@"FUNCTION_CALL_FAILED", errorMsg, nil);
        return;
    }
    
    // Return the result (assuming i32 return type for now)
    resolve(@(argv[0]));
}

RCT_EXPORT_METHOD(getExports:(double)moduleId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    
    int modId = (int)moduleId;
    auto it = _modules.find(modId);
    if (it == _modules.end()) {
        reject(@"MODULE_NOT_FOUND", @"Module not found", nil);
        return;
    }
    
    auto moduleInstance = it->second;
    NSMutableArray *exports = [[NSMutableArray alloc] init];
    NSMutableArray *debugInfo = [[NSMutableArray alloc] init];
    
    // Get export count first
    int32_t export_count = wasm_runtime_get_export_count(moduleInstance->module);
    [debugInfo addObject:[NSString stringWithFormat:@"Export count: %d", export_count]];
    
    // Enumerate actual exports using WAMR's export enumeration
    for (int32_t i = 0; i < export_count; i++) {
        wasm_export_t export_type;
        wasm_runtime_get_export_type(moduleInstance->module, i, &export_type);
        
        if (export_type.name) {
            [debugInfo addObject:[NSString stringWithFormat:@"Export %d: name='%s' kind=%d", i, export_type.name, (int)export_type.kind]];
            
            // Check if it's a function export
            if (export_type.kind == WASM_IMPORT_EXPORT_KIND_FUNC) {
                [exports addObject:[NSString stringWithUTF8String:export_type.name]];
                [debugInfo addObject:[NSString stringWithFormat:@"✅ Added function export: %s", export_type.name]];
            } else {
                [debugInfo addObject:[NSString stringWithFormat:@"⚠️ Non-function export: %s (kind=%d)", export_type.name, (int)export_type.kind]];
            }
        } else {
            [debugInfo addObject:[NSString stringWithFormat:@"❌ Export %d: null name", i]];
        }
    }
    
    // If we found exports, test function lookup with the actual names
    if ([exports count] > 0) {
        NSString *firstExport = [exports objectAtIndex:0];
        wasm_function_inst_t func = wasm_runtime_lookup_function(moduleInstance->instance, [firstExport UTF8String]);
        if (func) {
            [debugInfo addObject:[NSString stringWithFormat:@"✅ Function lookup successful for: %@", firstExport]];
        } else {
            [debugInfo addObject:[NSString stringWithFormat:@"❌ Function lookup failed for: %@", firstExport]];
        }
    }
    
    // Add debug info if no exports found or for debugging
    if ([exports count] == 0) {
        [exports addObject:[NSString stringWithFormat:@"DEBUG: %@", [debugInfo componentsJoinedByString:@" | "]]];
    } else {
        // Add debug info as a separate entry for visibility
        [exports addObject:[NSString stringWithFormat:@"DEBUG_INFO: %@", [debugInfo componentsJoinedByString:@" | "]]];
    }
    
    resolve(exports);
}

RCT_EXPORT_METHOD(releaseModule:(double)moduleId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    
    int modId = (int)moduleId;
    auto it = _modules.find(modId);
    if (it == _modules.end()) {
        reject(@"MODULE_NOT_FOUND", @"Module not found", nil);
        return;
    }
    
    auto moduleInstance = it->second;
    
    // Clean up WAMR resources
    if (moduleInstance->exec_env) {
        wasm_runtime_destroy_exec_env(moduleInstance->exec_env);
    }
    if (moduleInstance->instance) {
        wasm_runtime_deinstantiate(moduleInstance->instance);
    }
    if (moduleInstance->module) {
        wasm_runtime_unload(moduleInstance->module);
    }
    
    _modules.erase(it);
    resolve([NSNull null]);
}

// MARK: - TurboModule Protocol

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeWamrModuleSpecJSI>(params);
}
#endif

@end