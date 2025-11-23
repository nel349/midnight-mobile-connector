import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx']
    },
    deps: {
      inline: [
        // Inline React Native modules to avoid import issues
        'react-native',
        'react-native-get-random-values',
        'react-native-webview',
        '@react-native-async-storage/async-storage',
        'expo-crypto'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    }
  }
});