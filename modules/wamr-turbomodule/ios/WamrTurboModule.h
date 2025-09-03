#pragma once

#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>
#import <memory>
#import <unordered_map>

#include "wasm_export.h"

struct WamrModuleInstance {
    wasm_module_t module;
    wasm_module_inst_t instance;
    wasm_exec_env_t exec_env;
    uint32_t stack_size;
    uint32_t heap_size;
};

@interface WamrTurboModule : NSObject <RCTBridgeModule, RCTTurboModule>

@end