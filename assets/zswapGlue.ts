// Export the zswap glue code as a template literal
// This file contains the JavaScript glue code for the Midnight zswap WASM module

export const zswapGlueCode = `let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

// Note: This is a truncated version for testing - full file is too large for inline string
// In production, we would need to load this dynamically or use a build process
// Key exports we need: SecretKeys class with fromSeed() method

const SecretKeysFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_secretkeys_free(ptr >>> 0, 1));

export class SecretKeys {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SecretKeys.prototype);
        obj.__wbg_ptr = ptr;
        SecretKeysFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SecretKeysFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_secretkeys_free(ptr, 0);
    }
    
    static fromSeed(seed) {
        const ret = wasm.secretkeys_fromSeed(seed);
        return SecretKeys.__wrap(ret[0]);
    }
    
    static fromSeedRng(seed) {
        const ret = wasm.secretkeys_fromSeedRng(seed);
        return SecretKeys.__wrap(ret[0]);
    }
}

// Additional exports would be included in the full file...
`;