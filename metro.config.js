const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add WASM support and other extensions
config.resolver.assetExts.push('wasm');
config.resolver.sourceExts.push('cjs', 'mjs');

// Fix module resolution for packages with broken main fields
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Override resolver platforms to handle ESM packages properly
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle packages that use exports instead of main
config.resolver.resolveRequest = (context, moduleName, platform) => {
  console.log(`🔍 Resolving module: ${moduleName}`);
  
  // Handle @midnight-ntwrk/onchain-runtime which uses exports instead of main
  if (moduleName === '@midnight-ntwrk/onchain-runtime') {
    try {
      // Get the actual resolved module path first
      const modulePath = require.resolve('@midnight-ntwrk/onchain-runtime');
      const packageDir = path.dirname(modulePath);
      
      // Use the background JS file directly to avoid WASM import issues
      const backgroundExport = path.join(packageDir, 'midnight_onchain_runtime_wasm_bg.js');
      
      console.log(`✅ Resolving ${moduleName} to background JS: ${backgroundExport}`);
      
      return {
        type: 'sourceFile',
        filePath: backgroundExport,
      };
    } catch (error) {
      console.error(`❌ Failed to resolve ${moduleName}:`, error);
    }
  }

  // Handle @midnight-ntwrk/compact-runtime - use our React Native compatible version
  if (moduleName === '@midnight-ntwrk/compact-runtime') {
    try {
      // Point to our React Native compatible runtime instead of the WASM version
      const reactNativeRuntime = path.join(__dirname, 'lib', 'reactNativeCompactRuntime.js');
      
      console.log(`✅ Resolving ${moduleName} to React Native runtime: ${reactNativeRuntime}`);
      
      return {
        type: 'sourceFile',
        filePath: reactNativeRuntime,
      };
    } catch (error) {
      console.error(`❌ Failed to resolve ${moduleName}:`, error);
    }
  }

  // Use the default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;