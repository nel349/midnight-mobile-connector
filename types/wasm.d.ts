// Type declarations for WebAssembly modules imported via Polygen
declare module "*.wasm" {
  const content: ArrayBuffer;
  export default content;
}

// Specific declarations for our WASM modules
declare module "../../src/wasm/simple_sha256_wasm_bg.wasm" {
  const content: ArrayBuffer;
  export default content;
}

declare module "../../src/wasm/midnight_zswap_wasm_bg.wasm" {
  const content: ArrayBuffer;
  export default content;
}