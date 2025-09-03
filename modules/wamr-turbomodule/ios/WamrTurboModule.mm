#import "WamrTurboModule.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import <React/RCTLog.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCommon/CallInvoker.h>

@implementation WamrTurboModule {
    std::unordered_map<int, std::shared_ptr<WamrModuleInstance>> _modules;
    int _nextModuleId;
    bool _initialized;
}

RCT_EXPORT_MODULE()

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

RCT_EXPORT_METHOD(loadModule:(NSData *)wasmBytes
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    
    if (!_initialized) {
        reject(@"WAMR_NOT_INITIALIZED", @"WAMR runtime not initialized", nil);
        return;
    }
    
    // Convert NSData to bytes
    const uint8_t *bytes = (const uint8_t *)[wasmBytes bytes];
    uint32_t size = (uint32_t)[wasmBytes length];
    
    // Load WASM module
    char error_buf[128];
    wasm_module_t module = wasm_runtime_load(bytes, size, error_buf, sizeof(error_buf));
    if (!module) {
        NSString *errorMsg = [NSString stringWithFormat:@"Failed to load WASM module: %s", error_buf];
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

RCT_EXPORT_METHOD(callFunction:(NSNumber *)moduleId
                  functionName:(NSString *)functionName
                  args:(NSArray<NSNumber *> *)args
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    
    int modId = [moduleId intValue];
    auto it = _modules.find(modId);
    if (it == _modules.end()) {
        reject(@"MODULE_NOT_FOUND", @"Module not found", nil);
        return;
    }
    
    auto moduleInstance = it->second;
    
    // Find function
    wasm_function_inst_t func = wasm_runtime_lookup_function(moduleInstance->instance, 
                                                             [functionName UTF8String], 
                                                             NULL);
    if (!func) {
        reject(@"FUNCTION_NOT_FOUND", 
               [NSString stringWithFormat:@"Function '%@' not found", functionName], 
               nil);
        return;
    }
    
    // Prepare arguments
    uint32_t argc = (uint32_t)[args count];
    uint32_t argv[argc + 1]; // +1 for potential return value
    
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

RCT_EXPORT_METHOD(getExports:(NSNumber *)moduleId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    
    int modId = [moduleId intValue];
    auto it = _modules.find(modId);
    if (it == _modules.end()) {
        reject(@"MODULE_NOT_FOUND", @"Module not found", nil);
        return;
    }
    
    auto moduleInstance = it->second;
    NSMutableArray *exports = [[NSMutableArray alloc] init];
    
    // Get export count
    uint32_t export_count = wasm_runtime_get_export_count(moduleInstance->instance);
    
    for (uint32_t i = 0; i < export_count; i++) {
        wasm_runtime_get_export_by_index(moduleInstance->instance, i, 
                                         ^(const char *name, wasm_extern_kind_t kind) {
            if (kind == WASM_EXTERN_FUNC) {
                [exports addObject:[NSString stringWithUTF8String:name]];
            }
        });
    }
    
    resolve(exports);
}

RCT_EXPORT_METHOD(releaseModule:(NSNumber *)moduleId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    
    int modId = [moduleId intValue];
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

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeWamrTurboModuleSpecJSI>(params);
}

@end