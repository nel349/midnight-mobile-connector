import NativeWamrModule from '../specs/NativeWamrModule';

if (!NativeWamrModule) {
  throw new Error('WamrTurboModule native module not found. Please rebuild the app.');
}

export class WamrModule {
  private native = NativeWamrModule;

  /**
   * Load a WebAssembly module from bytes
   * @param wasmBytes - The WASM module bytes as Uint8Array
   * @returns Promise resolving to module ID
   */
  async loadModule(wasmBytes: Uint8Array): Promise<number> {
    // Convert Uint8Array to base64 string for native bridge
    const base64 = Buffer.from(wasmBytes).toString('base64');
    return this.native.loadModule(base64);
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

  // externref support methods

  /**
   * Create an externref from a JavaScript object
   * @param moduleId - The module ID 
   * @param jsObject - The JavaScript object to convert to externref
   * @returns Promise resolving to externref ID
   */
  async createExternref(moduleId: number, jsObject: object): Promise<number> {
    return this.native.createExternref(moduleId, jsObject);
  }

  /**
   * Get a JavaScript object from an externref ID
   * @param externrefId - The externref ID
   * @returns Promise resolving to the JavaScript object
   */
  async getExternrefObject(externrefId: number): Promise<object> {
    return this.native.getExternrefObject(externrefId);
  }

  /**
   * Release an externref and its associated JavaScript object
   * @param moduleId - The module ID
   * @param externrefId - The externref ID to release
   */
  async releaseExternref(moduleId: number, externrefId: number): Promise<void> {
    return this.native.releaseExternref(moduleId, externrefId);
  }

  // Enhanced function calling with externref support

  /**
   * Call a WASM function with mixed arguments including externref (JS objects)
   * @param moduleId - The module ID
   * @param functionName - The function name to call
   * @param args - Array of arguments: numbers or {type: 'externref', value: jsObject}
   * @returns Promise resolving to function result (could be JS object if externref returned)
   */
  async callFunctionWithExternref(
    moduleId: number, 
    functionName: string, 
    args: Array<number | {type: 'externref', value: any}>
  ): Promise<any> {
    return this.native.callFunctionWithExternref(moduleId, functionName, args);
  }
}

export default new WamrModule();