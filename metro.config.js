const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add WASM support
config.resolver.assetExts.push('wasm');

// Fix module resolution for packages with broken main fields
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add custom resolver to handle packages with missing main field
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @midnight-ntwrk/onchain-runtime which has exports but no main field
  if (moduleName === '@midnight-ntwrk/onchain-runtime') {
    try {
      // Use the browser export for React Native
      const packagePath = require.resolve('@midnight-ntwrk/onchain-runtime/package.json');
      const packageDir = packagePath.replace('/package.json', '');
      const resolvedPath = `${packageDir}/midnight_onchain_runtime_wasm.js`;
      return {
        type: 'sourceFile',
        filePath: resolvedPath,
      };
    } catch (error) {
      console.warn('Failed to resolve @midnight-ntwrk/onchain-runtime:', error);
    }
  }

  // Fall back to default resolver
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;