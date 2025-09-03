#pragma once

#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>
#import <memory>
#import <unordered_map>

#include "platform_common.h"
#include "wasm_export.h"

// Import the generated spec
#ifdef RCT_NEW_ARCH_ENABLED
#import "WamrModuleSpec/WamrModuleSpec.h"
#endif

struct WamrModuleInstance {
    wasm_module_t module;
    wasm_module_inst_t instance;
    wasm_exec_env_t exec_env;
    uint32_t stack_size;
    uint32_t heap_size;
    std::unordered_map<std::string, wasm_function_inst_t> functionMap;  // Map placeholder names to functions
};

#ifdef RCT_NEW_ARCH_ENABLED
@interface WamrTurboModule : NativeWamrModuleSpecBase <NativeWamrModuleSpec>
#else
@interface WamrTurboModule : NSObject <RCTBridgeModule>
#endif

@end