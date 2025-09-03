const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Get the default Expo config
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Add WASM support
    assetExts: [...defaultConfig.resolver.assetExts, 'wasm'],
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs', 'mjs'],
    
    // Fix module resolution for packages with broken main fields
    resolverMainFields: ['react-native', 'browser', 'main'],
    
    // Enable package exports support for modern packages
    unstable_enablePackageExports: true,
    
    // Override resolver platforms to handle ESM packages properly
    platforms: ['ios', 'android', 'native', 'web'],
    
    // Custom resolver for problematic packages
    resolveRequest: (context, moduleName, platform) => {
      // Handle @midnight-ntwrk/onchain-runtime which uses exports instead of main
      if (moduleName === '@midnight-ntwrk/onchain-runtime') {
        try {
          // This package uses exports with browser/node conditions
          // For React Native, use the browser export
          const packageDir = path.dirname(require.resolve('@midnight-ntwrk/onchain-runtime/package.json'));
          const browserExport = path.join(packageDir, 'midnight_onchain_runtime_wasm.js');
          
          if (fs.existsSync(browserExport)) {
            return {
              type: 'sourceFile',
              filePath: browserExport,
            };
          }
        } catch (error) {
          console.error(`❌ Failed to resolve ${moduleName}:`, error.message);
        }
        
        throw new Error(`Cannot resolve @midnight-ntwrk/onchain-runtime`);
      }

      // Handle @midnight-ntwrk/compact-runtime - use our React Native compatible version
      if (moduleName === '@midnight-ntwrk/compact-runtime') {
        try {
          // Point to our React Native compatible runtime instead of the WASM version
          const reactNativeRuntime = path.join(__dirname, 'lib', 'reactNativeCompactRuntime.js');
          
          if (fs.existsSync(reactNativeRuntime)) {
            return {
              type: 'sourceFile',
              filePath: reactNativeRuntime,
            };
          }
        } catch (error) {
          console.error(`❌ Failed to resolve ${moduleName}:`, error);
        }
      }

      // Use default resolution for everything else
      return context.resolveRequest(context, moduleName, platform);
    }
  }
};

// Merge with default Expo config
const mergedConfig = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    ...config.resolver,
    assetExts: config.resolver.assetExts,
    sourceExts: config.resolver.sourceExts,
  }
};

module.exports = mergedConfig;