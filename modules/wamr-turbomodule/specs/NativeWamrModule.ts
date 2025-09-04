import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Load a WASM module from bytes (base64 encoded), returns module ID
  loadModule(wasmBytesBase64: string): Promise<number>;
  
  // Call a function in a loaded WASM module
  callFunction(moduleId: number, functionName: string, args: number[]): Promise<number>;
  
  // Get list of exported functions from a WASM module
  getExports(moduleId: number): Promise<string[]>;
  
  // Release/cleanup a WASM module
  releaseModule(moduleId: number): Promise<void>;
  
  // externref support - convert JS objects to externref and back
  createExternref(moduleId: number, jsObject: Object): Promise<number>;
  getExternrefObject(externrefId: number): Promise<Object>;
  releaseExternref(moduleId: number, externrefId: number): Promise<void>;
  
  // Enhanced function calling with externref support
  callFunctionWithExternref(moduleId: number, functionName: string, args: Object[]): Promise<Object>;
  
  // Debug method to check native symbol registration
  debugGetNativeSymbolStatus(): Promise<Object>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WamrTurboModule');