import NativeWamrModule from '../specs/NativeWamrModule';
import {
  CoinInfo,
  TokenType,
  SecretKeys,
  ExternrefArg,
  WamrError,
  ModuleNotFoundError,
  FunctionNotFoundError,
  InvalidArgumentError,
} from './types';

// Export all types
export * from './types';

if (!NativeWamrModule) {
  throw new Error('WamrTurboModule native module not found. Please rebuild the app.');
}

export class WamrModule {
  private native = NativeWamrModule;
  private loadedModules = new Map<number, string[]>(); // Track loaded modules and their exports

  /**
   * Load a WebAssembly module from bytes
   * @param wasmBytes - The WASM module bytes as Uint8Array
   * @returns Promise resolving to module ID
   */
  async loadModule(wasmBytes: Uint8Array): Promise<number> {
    // Convert Uint8Array to base64 string for native bridge
    const base64 = Buffer.from(wasmBytes).toString('base64');
    const moduleId = await this.native.loadModule(base64);
    
    // Get and cache exports for this module
    try {
      const exports = await this.native.getExports(moduleId);
      this.loadedModules.set(moduleId, exports);
    } catch (error) {
      console.warn(`Failed to get exports for module ${moduleId}:`, error);
    }
    
    return moduleId;
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
   * @throws {ModuleNotFoundError} If the module doesn't exist
   */
  async releaseModule(moduleId: number): Promise<void> {
    if (!this.loadedModules.has(moduleId)) {
      throw new ModuleNotFoundError(moduleId);
    }
    
    await this.native.releaseModule(moduleId);
    this.loadedModules.delete(moduleId);
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
   * @throws {ModuleNotFoundError} If the module doesn't exist
   * @throws {FunctionNotFoundError} If the function doesn't exist
   */
  async callFunctionWithExternref(
    moduleId: number, 
    functionName: string, 
    args: Array<number | ExternrefArg>
  ): Promise<any> {
    if (!this.loadedModules.has(moduleId)) {
      throw new ModuleNotFoundError(moduleId);
    }
    
    const exports = this.loadedModules.get(moduleId);
    if (exports && !exports.includes(functionName)) {
      throw new FunctionNotFoundError(functionName);
    }
    
    return this.native.callFunctionWithExternref(moduleId, functionName, args);
  }

  /**
   * Helper method to create an externref argument
   * @param value - The JavaScript object to wrap as externref
   * @returns ExternrefArg wrapper
   */
  static externref<T>(value: T): ExternrefArg<T> {
    return { type: 'externref', value };
  }
}

export default new WamrModule();