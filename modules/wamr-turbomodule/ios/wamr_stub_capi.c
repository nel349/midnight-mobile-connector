// Stub implementations for WASM C API functions that we don't need
#include <stddef.h>

// Forward declare the opaque types
typedef struct wasm_trap_t wasm_trap_t;

// Minimal stub for wasm_trap_delete
void wasm_trap_delete(wasm_trap_t* trap) {
    // Do nothing - we don't use traps in our basic implementation
    if (trap) {
        // Could free memory here if needed
    }
}

// Additional stubs if needed
wasm_trap_t* wasm_trap_new(void* store, void* message) {
    // Return NULL to indicate no trap
    return NULL;
}