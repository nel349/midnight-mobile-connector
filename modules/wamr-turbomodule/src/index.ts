import NativeWamrModule from '../specs/NativeWamrModule';

export class WamrModule {
  private native = NativeWamrModule;

  /**
   * Load a WebAssembly module from bytes
   * @param wasmBytes - The WASM module bytes as Uint8Array
   * @returns Promise resolving to module ID
   */
  async loadModule(wasmBytes: Uint8Array): Promise<number> {
    return this.native.loadModule(wasmBytes);
  }

  /**
   * Call a function in a loaded WASM module
   * @param moduleId - The module ID returned from loadModule
   * @param functionName - The name of the function to call
   * @param args - Array of numeric arguments
   * @returns Promise resolving to the function result
   */
  async callFunction(moduleId: number, functionName: string, args: number[] = []): Promise<number> {
    return this.native.callFunction(moduleId, functionName, args);
  }

  /**
   * Get list of exported functions from a WASM module
   * @param moduleId - The module ID
   * @returns Promise resolving to array of function names
   */
  async getExports(moduleId: number): Promise<string[]> {
    return this.native.getExports(moduleId);
  }

  /**
   * Release/cleanup a WASM module
   * @param moduleId - The module ID to release
   */
  async releaseModule(moduleId: number): Promise<void> {
    return this.native.releaseModule(moduleId);
  }
}

export default new WamrModule();