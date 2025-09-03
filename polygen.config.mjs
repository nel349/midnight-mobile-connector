import {
  externalModule,
  localModule,
  polygenConfig,
} from '@callstack/polygen-config';

/**
 * @type {import('@callstack/polygen/config').PolygenConfig}
 */
export default polygenConfig({
  /**
   * Output configuration
   */
  output: {
    /**
     * Directory where the output files will be stored.
     */
    // directory: 'node_modules/.polygen-out'
  },

  /**
   * Configuration for the `scan` command.
   */
  scan: {
    /**
     * List of paths to scan for modules.
     *
     * Each item is a glob pattern that can use wildcards, or be used
     * to ignore specific element by prefixing it by `!`.
     */
    // paths: [
    //     "src/**/*.wasm",
    // ]
  },

  /**
   * List of modules to be used in the project.
   *
   * Each module can be individually configured, by passing options object as a second
   * argument (or 3rd, for external modules).
   */
  modules: [
    // Use local WASM files since external modules aren't supported by Metro yet
    localModule('src/wasm/simple_sha256_wasm_bg.wasm'),
    localModule('src/wasm/midnight_zswap_wasm_bg.wasm'),
  ],
});