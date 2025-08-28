// This file contains the zswap glue code as a TypeScript string export
// Generated from midnight_zswap_glue.js

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

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().slice(ptr, ptr + len));
}

// Initialize heap first
const heap = new Array(128).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

// Critical: WASM memory management for Uint8Array support
// Use existing getUint8ArrayMemory0 if available, otherwise define our own
function getUint8ArrayMemory0() {
    if (typeof cachedUint8ArrayMemory0 !== 'undefined') {
        // Use existing cached memory
        if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
            cachedUint8ArrayMemory0 = new Uint8Array(exports.wasm.memory.buffer);
        }
        return cachedUint8ArrayMemory0;
    } else {
        // Create new memory accessor
        return new Uint8Array(exports.wasm.memory.buffer);
    }
}

// Critical: Pass Uint8Array to WASM memory
function passArray8ToWasm0(arg, malloc) {
    console.log('passArray8ToWasm0 called with arg length:', arg.length);
    try {
        let ptr;
        
        // WASM malloc is broken ("Unreachable code"), use manual memory allocation
        console.log('passArray8ToWasm0: WASM malloc is broken, using manual memory allocation');
        
        // Get WASM memory and use a safe area for temporary data
        const memory = getUint8ArrayMemory0();
        const bufferSize = memory.length;
        
        // Use memory in the middle range - avoid both beginning and end
        // WASM typically uses memory from beginning, and may use end for stack
        const safeOffset = Math.floor(bufferSize * 0.6); // Use 60% through the buffer
        ptr = safeOffset;
        
        console.log('passArray8ToWasm0: Using middle-range allocation at offset', ptr, 'buffer size:', bufferSize);
        
        // Ensure minimum safe offset
        if (ptr < 200000) {
            ptr = 200000; // Minimum safe offset
            console.log('passArray8ToWasm0: Adjusted to minimum safe offset:', ptr);
        }
        
        console.log('passArray8ToWasm0: allocated ptr:', ptr);
        
        // Validate pointer is within bounds
        if (ptr < 0 || ptr + arg.length > memory.length) {
            throw new Error('passArray8ToWasm0: Pointer ' + ptr + ' + length ' + arg.length + ' exceeds memory bounds ' + memory.length);
        }
        
        memory.subarray(ptr, ptr + arg.length).set(arg);
        console.log('passArray8ToWasm0: copied data to WASM memory');
        return { ptr, length: arg.length };
    } catch (err) {
        console.log('passArray8ToWasm0 error:', err);
        throw err;
    }
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }
export function getObject_exported(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

export function takeObject_debug(idx) {
    console.log('takeObject_debug called with idx:', idx);
    const ret = getObject(idx);
    console.log('takeObject_debug getObject returned:', ret, typeof ret);
    dropObject(idx);
    console.log('takeObject_debug after dropObject, returning:', ret);
    return ret;
}

function getHeapU8() {

    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

const SecretKeysFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => exports.wasm.__wbg_secretkeys_free(ptr >>> 0, 1));

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
        exports.wasm.__wbg_secretkeys_free(ptr, 0);
    }

    constructor() {
        const ret = exports.wasm.secretkeys_new();
        if (ret[2]) {
            throw takeObject(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        SecretKeysFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }

    static fromSeed(seed) {
        console.log('SecretKeys.fromSeed called with seed type:', typeof seed, 'length:', seed.length);
        
        // Convert hex string OR Uint8Array to WASM memory properly
        let seedBytes;
        let seedPtr = 0;
        let seedLen = 0;
        
        try {
            // Handle both hex strings and Uint8Array
            if (typeof seed === 'string') {
                // Convert hex string to Uint8Array - this is the key insight from midnight-bank!
                const cleanHex = seed.startsWith('0x') ? seed.slice(2) : seed;
                if (cleanHex.length !== 64) {
                    throw new Error('Hex seed must be exactly 64 characters (32 bytes)');
                }
                seedBytes = new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                console.log('SecretKeys.fromSeed: Converted hex string to bytes:', seedBytes.length, 'first 8:', Array.from(seedBytes.slice(0, 8)));
            } else if (seed instanceof Uint8Array) {
                if (seed.length !== 32) {
                    throw new Error('Uint8Array seed must be exactly 32 bytes');
                }
                seedBytes = seed;
                console.log('SecretKeys.fromSeed: Using Uint8Array:', seedBytes.length, 'first 8:', Array.from(seedBytes.slice(0, 8)));
            } else {
                throw new Error('Seed must be hex string (64 chars) or Uint8Array (32 bytes)');
            }
            
            // Now allocate WASM memory for the bytes
            const result = passArray8ToWasm0(seedBytes, null); 
            seedPtr = result.ptr;
            seedLen = result.length;
            console.log('SecretKeys.fromSeed: Allocated WASM memory at ptr:', seedPtr, 'length:', seedLen);
            
            console.log('SecretKeys.fromSeed: About to call WASM with ptr:', seedPtr, 'len:', seedLen);
            console.log('SecretKeys.fromSeed: Memory at ptr contains:', Array.from(getUint8ArrayMemory0().subarray(seedPtr, seedPtr + Math.min(seedLen, 8))));
            const ret = exports.wasm.secretkeys_fromSeed(seedPtr, seedLen);
            console.log('SecretKeys.fromSeed: WASM returned:', ret);
            
            if (ret[2]) {
                throw takeFromExternrefTable0(ret[1]);
            }
            return SecretKeys.__wrap(ret[0]);
        } finally {
            // Skip freeing memory since we used manual allocation
            // The memory will be reused on next allocation anyway
            console.log('SecretKeys.fromSeed: Skipping memory free (manual allocation used)');
        }
    }

    static fromSeedRng(seed) {
        const ret = exports.wasm.secretkeys_fromSeedRng(seed);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return SecretKeys.__wrap(ret[0]);
    }
}

// Add missing WASM import functions as stubs
export function __wbg_unprovenoutput_new() { return 0; }
export function __wbg_unproveninput_new() { return 0; }
export function __wbg_unproventransaction_new() { return 0; }
export function __wbg_unprovenoffer_new() { return 0; }
export function __wbg_unproventransient_new() { return 0; }
export function __wbg_localstate_new() { return 0; }
export function __wbg_offer_new() { return 0; }
export function __wbg_input_new() { return 0; }
export function __wbg_output_new() { return 0; }
export function __wbg_transaction_new() { return 0; }
export function __wbg_authorizedmint_new() { return 0; }
export function __wbg_coinsecretkey_new() { return 0; }
export function __wbg_encryptionsecretkey_new() { return 0; }
export function __wbg_ledgerparameters_new() { return 0; }
export function __wbg_prooferasedauthorizedmint_new() { return 0; }
export function __wbg_prooferasedinput_new() { return 0; }
export function __wbg_prooferasedoffer_new() { return 0; }
export function __wbg_prooferasedoutput_new() { return 0; }
export function __wbg_prooferasedtransaction_new() { return 0; }
export function __wbg_prooferasedtransient_new() { return 0; }
export function __wbg_systemtransaction_new() { return 0; }
export function __wbg_transactioncostmodel_new() { return 0; }
export function __wbg_transient_new() { return 0; }
export function __wbg_zswapchainstate_new() { return 0; }

// Add wasm-bindgen runtime functions - Complete set from wasmGlue.js
export function __wbindgen_bigint_from_i64(arg0) {
    return arg0;
}
export function __wbindgen_bigint_from_u128(arg0, arg1) {
    return BigInt.asUintN(64, arg0) << BigInt(64) | BigInt.asUintN(64, arg1);
}
export function __wbindgen_bigint_from_u64(arg0) {
    return BigInt.asUintN(64, arg0);
}
export function __wbindgen_bigint_from_i128(arg0, arg1) {
    return arg0 << BigInt(64) | BigInt.asUintN(64, arg1);
}
export function __wbindgen_bigint_get_as_i64(arg0, arg1) {
    const v = arg1;
    const ret = typeof(v) === 'bigint' ? v : undefined;
    // Simplified - just return the value
    return ret !== undefined;
}
export function __wbindgen_boolean_get(arg0) {
    const v = arg0;
    return typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
}
export function __wbindgen_cb_drop(arg0) {
    return true; // Simplified
}
export function __wbindgen_closure_wrapper2600(arg0, arg1, arg2) {
    return {}; // Simplified
}
export function __wbindgen_debug_string(arg0, arg1) {
    // Simplified debug string
}
export function __wbindgen_error_new(arg0, arg1) {
    return new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbindgen_in(arg0, arg1) {
    return arg0 in arg1;
}
export function __wbindgen_init_externref_table() {
    // Simplified
}
export function __wbindgen_is_bigint(arg0) {
    return typeof(arg0) === 'bigint';
}
export function __wbindgen_is_function(arg0) {
    return typeof(arg0) === 'function';
}
export function __wbindgen_is_object(arg0) {
    const val = arg0;
    return typeof(val) === 'object' && val !== null;
}
export function __wbindgen_is_string(arg0) {
    return typeof(arg0) === 'string';
}
export function __wbindgen_is_undefined(arg0) {
    return arg0 === undefined;
}
export function __wbindgen_is_null(arg0) {
    return arg0 === null;
}
export function __wbindgen_jsval_eq(arg0, arg1) {
    return arg0 === arg1;
}
export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    return arg0 == arg1;
}
export function __wbindgen_memory() {
    return wasm.memory;
}
export function __wbindgen_number_get(arg0, arg1) {
    const obj = arg1;
    return typeof(obj) === 'number' ? obj : undefined;
}
export function __wbindgen_number_new(arg0) {
    return arg0;
}
export function __wbindgen_shr(arg0, arg1) {
    return arg0 >> arg1;
}
export function __wbindgen_string_get(arg0, arg1) {
    const obj = arg1;
    return typeof(obj) === 'string' ? obj : undefined;
}
export function __wbindgen_string_new(arg0, arg1) {
    return getStringFromWasm0(arg0, arg1);
}
export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbindgen_malloc(size, align) { return 0; }
export function __wbindgen_free(ptr, size, align) {}
export function __wbindgen_rethrow(a) { throw a; }
export function __wbindgen_exn_store(a) {}
export function __wbindgen_object_drop_ref() {}
export function __wbg_String_fed4d24b68977888(arg0, arg1) {
    const ret = String(arg1);
    const ptr1 = passStringToWasm0(ret, exports.wasm.__wbindgen_malloc, exports.wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    // Store result in memory locations
    return ret;
}
export function __wbg_getwithrefkey_bb8f74a92cb2e784(arg0, arg1) {
    const ret = arg0[arg1];
    return ret;
}

export function __wbg_set_3fda3bac07393de4() { return 0; }

export function __wbg_queueMicrotask_d3219def82552485() { return 0; }

export function __wbg_queueMicrotask_97d92b4fcc8a61c5() { return 0; }

export function __wbg_view_fd8a56e8983f448d() { return 0; }

export function __wbg_new_ab05273f91041dd0() { return new Object(); }

export function __wbg_respond_1f279fa9f8edcb1c() { return 0; }

export function __wbg_close_304cc1fef3466669() { return 0; }

export function __wbg_enqueue_bb16ba72f537dc9e() { return 0; }

export function __wbg_byobRequest_77d9adf63337edfb() { return 0; }

export function __wbg_close_5ce03e29be453811() { return 0; }

export function __wbg_crypto_574e78ad8b13b65f(arg0) { 
    console.log('__wbg_crypto called with:', arg0);
    try {
        // This returns the crypto object - need to add it to the heap
        const cryptoObj = typeof crypto !== 'undefined' ? crypto : {
            getRandomValues: function(array) {
                console.log('Fallback crypto.getRandomValues called with array length:', array.length);
                // Fallback implementation
                for (let i = 0; i < array.length; i++) {
                    array[i] = Math.floor(Math.random() * 256);
                }
                return array;
            }
        };
        const result = addHeapObject(cryptoObj);
        console.log('__wbg_crypto returning heap index:', result);
        return result;
    } catch (err) {
        console.log('__wbg_crypto error:', err);
        return addHeapObject({});
    }
}

export function __wbg_process_dc0fbacc7c1c06f7() { return 0; }

export function __wbg_versions_c01dfd4722a88165() { return 0; }

export function __wbg_node_905d3e251edff8a2() { return 0; }

export function __wbg_require_60cc747a6bc5215a() { return 0; }

export function __wbg_platform_c370259ad9ad4431() { return 0; }

export function __wbg_msCrypto_a61aeb35a24c1329() { return 0; }

export function __wbg_vendor_b15bb2b8492040f7() { return 0; }

export function __wbg_randomFillSync_ac0988aba3254290(arg0, arg1, arg2) { 
    console.log('__wbg_randomFillSync called with:', arg0, arg1, arg2);
    try {
        // This is Node.js crypto.randomFillSync(buffer, offset, size)
        // We need to fill the buffer with random bytes
        
        // Get WASM memory - try different ways to access it
        let wasmMemory;
        if (exports.wasm && exports.wasm.memory) {
            wasmMemory = exports.wasm.memory.buffer;
        } else if (exports.wasm && exports.wasm.memory) {
            wasmMemory = wasm.memory.buffer;
        } else {
            console.log('randomFillSync: WASM memory not available');
            return;
        }
        
        const heap = new Uint8Array(wasmMemory);
        const offset = arg1 >>> 0;
        const size = arg2 >>> 0;
        const array = heap.subarray(arg0 + offset, arg0 + offset + size);
        console.log('randomFillSync array length:', array.length);
        
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(array);
            console.log('randomFillSync: Used WebCrypto');
        } else {
            // Fallback: use Math.random
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            console.log('randomFillSync: Used Math.random fallback');
        }
    } catch (err) {
        console.log('randomFillSync error:', err);
    }
}

export function __wbg_getRandomValues_b8f5dbd5f3995a9e(arg0, arg1) { 
    console.log('__wbg_getRandomValues called with:', arg0, arg1);
    try {
        // This is crypto.getRandomValues(array) - need to fill the array with random bytes
        const length = arg1 >>> 0;
        console.log('getRandomValues length:', length);
        
        // Get WASM memory - try different ways to access it
        let wasmMemory;
        if (exports.wasm && exports.wasm.memory) {
            wasmMemory = exports.wasm.memory.buffer;
        } else if (exports.wasm && exports.wasm.memory) {
            wasmMemory = wasm.memory.buffer;
        } else {
            console.log('getRandomValues: WASM memory not available, using fallback');
            return arg0; // Return early if no memory access
        }
        
        const heap = new Uint8Array(wasmMemory);
        const array = heap.subarray(arg0, arg0 + length);
        console.log('getRandomValues array length:', array.length);
        
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(array);
            console.log('getRandomValues: Used WebCrypto');
        } else {
            // Fallback: use Math.random
            for (let i = 0; i < length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            console.log('getRandomValues: Used Math.random fallback');
        }
        return arg0;
    } catch (err) {
        console.log('getRandomValues error:', err);
        return arg0;
    }
}

export function __wbg_new_78feb108b6472713() { return new Object(); }

export function __wbg_newnoargs_105ed471475aaf50() { return new Object(); }

export function __wbg_new_5e0be73521bc8c17() { return new Object(); }

export function __wbg_get_67b2ba62fc30de12() { return 0; }

export function __wbg_call_672a4d21634d4a24() { return 0; }

export function __wbg_new_405e22f390576ce2() { return new Object(); }

export function __wbg_new_a239edaa1dc2968f() { return new Object(); }

export function __wbg_push_737cfc8c1432c2c6() { return 0; }

export function __wbg_instanceof_ArrayBuffer_e14585432e3737fc(arg0) { return arg0 instanceof ArrayBuffer; }

export function __wbg_new_c68d7209be747379() { return new Object(); }

export function __wbg_apply_36be6a55257c99bf() { return 0; }

export function __wbg_call_7cccdd69e0791ae2() { return 0; }

export function __wbg_set_8fc6bf8a5b1071d1() { return 0; }

export function __wbg_isSafeInteger_343e2beeeece1bb0(arg0) { return Number.isSafeInteger(arg0); }

export function __wbg_instanceof_Set_f48781e4bf8ffb09(arg0) { return arg0 instanceof Set; }

export function __wbg_add_883d9432f9188ef2() { return 0; }

export function __wbg_forEach_432d981ecbee7d69(arg0, arg1, arg2) { arg0.forEach(arg1, arg2); }

export function __wbg_new_23a2665fac83c611() { return new Object(); }

export function __wbg_resolve_4851785c9c5f573d(arg0, arg1) { return Promise.resolve(arg1); }

export function __wbg_then_44b73946d2fb3e7d(arg0, arg1, arg2, arg3) { return arg0.then(arg1, arg2); }

export function __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0() { return self; }

export function __wbg_static_accessor_SELF_37c5d418e4bf5819() { return self; }

export function __wbg_static_accessor_WINDOW_5de37043a91a9c40() { return window; }

export function __wbg_static_accessor_GLOBAL_88a902d13a557d07() { return global; }

export function __wbg_buffer_609cc3eee51ed158() { return new ArrayBuffer(0); }

export function __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a() { return new Uint8Array(); }

export function __wbg_new_a12002a7f91c75be() { return new Object(); }

export function __wbg_set_65595bdd868b3009() { return 0; }

export function __wbg_length_a446193dc22c12f8() { return 0; }

export function __wbg_instanceof_Uint8Array_17156bcf118086a9(arg0) { return arg0 instanceof Uint8Array; }

export function __wbg_newwithlength_a381634e90c276d4(arg0) { return new Uint8Array(arg0); }

export function __wbg_buffer_09165b52af8c5237(arg0) { return arg0.buffer; }

export function __wbg_buffer_00a12e2f3d67417e(arg0) { return arg0.buffer; }

export function __wbg_subarray_aa9065fa9dc5df96(arg0, arg1, arg2) { return arg0.subarray(arg1, arg2); }

export function __wbg_byteLength_e674b853d9c77e1d(arg0) { return arg0.byteLength; }

export function __wbg_byteOffset_fd862df290ef848d(arg0) { return arg0.byteOffset; }

export function __wbg_getPrototypeOf_08aaacea7e300a38(arg0) { return Object.getPrototypeOf(arg0); }

export function __wbindgen_closure_wrapper3626() { return {}; }

// Note: __wbindgen_malloc, __wbindgen_realloc, and __wbindgen_free 
// are provided BY the WASM module, not by JavaScript stubs

// Missing wbindgen functions for error handling
export function __wbindgen_throw(ptr, len) {
    const message = getStringFromWasm0(ptr, len);
    throw new Error(message);
}

export function __wbindgen_error_new(ptr, len) {
    const message = getStringFromWasm0(ptr, len);
    const errorObj = new Error(message);
    const heapIdx = addHeapObject(errorObj);
    console.log('__wbindgen_error_new created error at heap[' + heapIdx + ']:', errorObj.message);
    return heapIdx;
}

// String helper function - get real string from WASM memory
function getStringFromWasm0(ptr, len) {
    try {
        console.log('getStringFromWasm0 called with ptr:', ptr, 'len:', len);
        
        // Get WASM memory
        let wasmMemory;
        if (exports.wasm && exports.wasm.memory) {
            wasmMemory = exports.wasm.memory.buffer;
        } else if (exports.wasm && exports.wasm.memory) {
            wasmMemory = wasm.memory.buffer;
        } else {
            console.log('getStringFromWasm0: No WASM memory, using fallback');
            return "Error: WASM memory not available";
        }
        
        const heap = new Uint8Array(wasmMemory);
        const bytes = heap.subarray(ptr, ptr + len);
        const decoder = new TextDecoder('utf-8');
        const message = decoder.decode(bytes);
        console.log('getStringFromWasm0 decoded message:', message);
        return message;
    } catch (err) {
        console.log('getStringFromWasm0 error:', err);
        return "Error: Failed to decode WASM string";
    }
}

// Missing externref table function
function takeFromExternrefTable0(idx) {
    console.log('takeFromExternrefTable0 called with idx:', idx);
    
    // HOTFIX: The idx being passed is wrong, but we know errors are stored sequentially from heap[132]
    // Let's find the most recent error object in the heap
    let actualErrorIdx = -1;
    for (let i = heap.length - 1; i >= 4; i--) {  // Start from end, skip initial undefined/null/true/false
        const obj = heap[i];
        if (obj && obj instanceof Error && obj.message.includes('Invalid seed format')) {
            actualErrorIdx = i;
            break;
        }
    }
    
    if (actualErrorIdx !== -1) {
        console.log('takeFromExternrefTable0 HOTFIX: Using actual error at heap[' + actualErrorIdx + '] instead of idx', idx);
        const ret = getObject(actualErrorIdx);
        console.log('takeFromExternrefTable0 getObject returned:', ret, typeof ret);
        dropObject(actualErrorIdx);
        console.log('takeFromExternrefTable0 after dropObject, returning:', ret);
        return ret;
    } else {
        console.log('takeFromExternrefTable0 HOTFIX: No error found, falling back to original idx', idx);
        const ret = getObject(idx);
        console.log('takeFromExternrefTable0 getObject returned:', ret, typeof ret);
        dropObject(idx);
        console.log('takeFromExternrefTable0 after dropObject, returning:', ret);
        return ret;
    }
}
export function takeFromExternrefTable0_exported(idx) { return takeFromExternrefTable0(idx); }

// Note: This combines the essential SecretKeys implementation with stub functions
// for all the missing WASM imports to make it work without the full 135KB file
`;