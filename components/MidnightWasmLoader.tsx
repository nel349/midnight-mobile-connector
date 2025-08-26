import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { wasmGlueCode } from '../assets/wasmGlue';

interface WasmTestResult {
  success: boolean;
  message: string;
  loadTime?: number;
  memoryUsage?: number;
}

export default function MidnightWasmLoader() {
  const webViewRef = useRef<WebView>(null);
  const [testResult, setTestResult] = useState<WasmTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wasmBase64, setWasmBase64] = useState<string | null>(null);

  // Load WASM file from React Native assets on component mount
  useEffect(() => {
    const loadWasmFile = async () => {
      try {
        console.log('Loading WASM file from React Native assets...');
        
        // Load the WASM file 
        const wasmAsset = Asset.fromModule(require('../assets/midnight_onchain_runtime_wasm_bg.wasm'));
        await wasmAsset.downloadAsync();
        
        console.log('WASM asset loaded:', wasmAsset.localUri);
        
        // Read the WASM file as base64
        const wasmResponse = await fetch(wasmAsset.localUri!);
        const arrayBuffer = await wasmResponse.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Convert to base64
        let base64 = '';
        const chunk = 8192;
        for (let i = 0; i < bytes.length; i += chunk) {
          const slice = bytes.slice(i, i + chunk);
          base64 += String.fromCharCode.apply(null, Array.from(slice));
        }
        const base64String = btoa(base64);
        
        console.log(`WASM file loaded as base64: ${(base64String.length / 1024 / 1024 * 3/4).toFixed(1)}MB`);
        console.log(`JS glue code available: ${(wasmGlueCode.length / 1024).toFixed(1)}KB`);
        
        setWasmBase64(JSON.stringify({ wasmBase64: base64String, jsCode: wasmGlueCode }));
        
      } catch (error) {
        console.error('Failed to load WASM file:', error);
        Alert.alert('WASM Load Error', `Failed to load WASM file: ${error instanceof Error ? error.message : error}`);
      }
    };
    
    loadWasmFile();
  }, []);

  const handleWebViewMessage = (event: any) => {
    try {
      const result: WasmTestResult = JSON.parse(event.nativeEvent.data);
      setTestResult(result);
      setIsLoading(false);
      
      if (result.success) {
        Alert.alert('WASM Test Success!', result.message);
      } else {
        Alert.alert('WASM Test Failed', result.message);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
      setIsLoading(false);
    }
  };

  const testWasmLoading = () => {
    if (!wasmBase64) {
      Alert.alert('WASM Not Ready', 'WASM files are still loading. Please wait...');
      return;
    }
    
    setIsLoading(true);
    setTestResult(null);
    
    // Send message to WebView with WASM data and JS glue code
    webViewRef.current?.postMessage(JSON.stringify({
      action: 'testMidnightWasm',
      wasmData: wasmBase64,
      timestamp: Date.now()
    }));
  };

  const getWebViewHTML = (): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Midnight WASM Test</title>
</head>
<body>
    <div id="status">Initializing WASM test...</div>
    
    <script>
        console.log('WebView script loaded');
        
        // Immediate test - just send back that WebView is working
        function sendMessage(msg) {
            console.log('Sending message:', msg);
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(msg));
            } else {
                console.error('ReactNativeWebView not available');
            }
        }

        // Listen for messages from React Native
        window.addEventListener('message', async (event) => {
            console.log('Received message:', event.data);
            try {
                const { action, wasmData, timestamp } = JSON.parse(event.data);
                
                if (action === 'testMidnightWasm') {
                    console.log('Starting Midnight WASM test');
                    
                    // First, test if basic communication is working
                    sendMessage({
                        success: true,
                        message: 'WebView received Midnight WASM test message'
                    });
                    
                    // For now, let's test basic functionality first
                    await testBasicFunctionality();
                    
                    // Later we'll add: const { wasmBase64, jsCode } = JSON.parse(wasmData);
                    // Later we'll add: await testMidnightWasm(wasmBase64, jsCode);
                } else if (action === 'testWasm') {
                    console.log('Starting basic WASM test');
                    await testBasicFunctionality();
                }
            } catch (error) {
                console.error('Message parsing error:', error);
                sendMessage({
                    success: false,
                    message: 'Message parsing failed: ' + error.message
                });
            }
        });

        async function testMidnightWasm(wasmBase64, jsCode) {
            const statusDiv = document.getElementById('status');
            
            try {
                console.log('=== Step 1: Starting Midnight WASM test ===');
                statusDiv.textContent = 'Step 1: Validating input data...';
                
                if (!wasmBase64 || !jsCode) {
                    throw new Error('Missing WASM base64 data or JS glue code from React Native');
                }
                
                console.log(\`✓ Received WASM base64 data: \${(wasmBase64.length / 1024 / 1024 * 3/4).toFixed(1)}MB\`);
                console.log(\`✓ Received JS glue code: \${(jsCode.length / 1024).toFixed(1)}KB\`);
                
                // Step 2: Transform ES6 exports
                console.log('=== Step 2: Transforming ES6 exports ===');
                statusDiv.textContent = 'Step 2: Transforming ES6 exports...';
                
                try {
                    const transformedJsCode = jsCode
                        .replace(/export function /g, 'exports.')
                        .replace(/export const /g, 'exports.')
                        .replace(/export let /g, 'exports.')
                        .replace(/export var /g, 'exports.');
                    
                    console.log('✓ ES6 exports transformed to CommonJS');
                    
                    // Step 3: Execute JS glue code
                    console.log('=== Step 3: Executing JS glue code ===');
                    statusDiv.textContent = 'Step 3: Executing JavaScript glue code...';
                    
                    const moduleExports = {};
                    
                    // Execute the transformed JS glue code with better error handling
                    const wrappedJsCode = \`
                        (function(exports) {
                            try {
                                // Provide minimal globals
                                const util = { TextEncoder, TextDecoder };
                                function require(name) {
                                    if (name === 'util') return util;
                                    console.warn('Required module not available:', name);
                                    return {};
                                }
                                
                                \${transformedJsCode}
                                return exports;
                            } catch (error) {
                                console.error('Error in glue code execution:', error);
                                throw error;
                            }
                        })
                    \`;
                    
                    const glueFunction = eval(wrappedJsCode);
                    const glueExports = glueFunction(moduleExports);
                    
                    console.log('✓ JS glue code executed successfully');
                    console.log('Available exports count:', Object.keys(glueExports).length);
                    console.log('First 10 exports:', Object.keys(glueExports).slice(0, 10));
                    
                } catch (glueError) {
                    console.error('Failed to execute JS glue code:', glueError);
                    throw new Error(\`JS glue code execution failed: \${glueError.message}\`);
                }
                
                // Decode base64 to bytes
                statusDiv.textContent = 'Step 3: Converting base64 to bytes...';
                const binaryString = atob(wasmBase64);
                const wasmBytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    wasmBytes[i] = binaryString.charCodeAt(i);
                }
                
                console.log('WASM bytes decoded, size:', wasmBytes.length);
                
                statusDiv.textContent = 'Step 4: Instantiating WASM with imports...';
                
                // Try to instantiate the WASM module with the imports from JS glue
                const wasmModule = await WebAssembly.instantiate(wasmBytes.buffer, {
                    './midnight_onchain_runtime_wasm_bg.js': glueExports
                });
                console.log('WASM module instantiated successfully');
                
                // Check what exports are available
                const exports = Object.keys(wasmModule.instance.exports);
                console.log('WASM exports:', exports.slice(0, 10)); // Log first 10
                
                statusDiv.textContent = 'Step 3: Testing WASM exports...';
                
                // Try to call memory or basic functions
                let testResults = [];
                if (wasmModule.instance.exports.memory) {
                    testResults.push('memory export available');
                }
                if (wasmModule.instance.exports.__wbindgen_malloc) {
                    testResults.push('malloc function available');
                }
                
                statusDiv.textContent = 'Midnight WASM loaded successfully!';
                
                sendMessage({
                    success: true,
                    message: \`Midnight WASM loaded! Size: \${(wasmBytes.byteLength / 1024 / 1024).toFixed(1)}MB, Exports: \${exports.length}\`,
                    loadTime: 0,
                    memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
                });
                
            } catch (error) {
                console.error('Midnight WASM test failed:', error);
                statusDiv.textContent = 'Midnight WASM test failed: ' + error.message;
                
                sendMessage({
                    success: false,
                    message: 'Midnight WASM failed: ' + error.message,
                    loadTime: 0
                });
            }
        }

        async function testBasicFunctionality() {
            const statusDiv = document.getElementById('status');
            
            try {
                console.log('Step 1: Testing basic functionality');
                statusDiv.textContent = 'Step 1: Testing basic functionality...';
                
                // Test 1: Basic JavaScript
                const basicTest = 5 + 3;
                console.log('Basic JS test result:', basicTest);
                
                // Test 2: Check WebAssembly availability
                console.log('Step 2: Checking WebAssembly support');
                statusDiv.textContent = 'Step 2: Checking WebAssembly support...';
                
                if (typeof WebAssembly === 'undefined') {
                    throw new Error('WebAssembly not supported in this WebView');
                }
                
                console.log('WebAssembly is available');
                
                // Test 3: Try to create simple WASM
                console.log('Step 3: Testing simple WASM creation');
                statusDiv.textContent = 'Step 3: Creating simple WASM module...';
                
                // Simple WASM module that adds two numbers
                const wasmBytes = new Uint8Array([
                    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,  // magic + version
                    0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f,  // type section
                    0x03, 0x02, 0x01, 0x00,  // function section
                    0x07, 0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x00,  // export section
                    0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b  // code section
                ]);
                
                console.log('Instantiating WASM module...');
                const wasmModule = await WebAssembly.instantiate(wasmBytes);
                console.log('WASM module created successfully');
                
                // Test the add function
                const addResult = wasmModule.instance.exports.add(5, 3);
                console.log('WASM add function result:', addResult);
                
                if (addResult !== 8) {
                    throw new Error(\`WASM add function failed: expected 8, got \${addResult}\`);
                }
                
                statusDiv.textContent = 'All tests passed!';
                
                sendMessage({
                    success: true,
                    message: 'WebView WASM test successful! WebAssembly works correctly.',
                    loadTime: 0,
                    memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
                });
                
            } catch (error) {
                console.error('Test failed:', error);
                statusDiv.textContent = 'Test failed: ' + error.message;
                
                sendMessage({
                    success: false,
                    message: error.message,
                    loadTime: 0
                });
            }
        }
        
        // Test message passing on load
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded');
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = 'WebView loaded. Ready for test.';
            
            // Send initial message to confirm WebView is working
            sendMessage({
                success: true,
                message: 'WebView initialized successfully'
            });
        });
        
        console.log('Script setup complete');
    </script>
</body>
</html>
    `;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Midnight WASM WebView Test</Text>
      
      <Button
        title={isLoading ? "Testing..." : wasmBase64 ? "Test Midnight WASM" : "Loading WASM..."}
        onPress={testWasmLoading}
        disabled={isLoading || !wasmBase64}
      />
      
      {testResult && (
        <View style={styles.resultContainer}>
          <Text style={[
            styles.resultText,
            { color: testResult.success ? 'green' : 'red' }
          ]}>
            {testResult.success ? '✅' : '❌'} {testResult.message}
          </Text>
          {testResult.loadTime && (
            <Text style={styles.detailText}>
              Load Time: {testResult.loadTime.toFixed(2)}ms
            </Text>
          )}
          {testResult.memoryUsage && (
            <Text style={styles.detailText}>
              Memory Usage: {(testResult.memoryUsage / 1024 / 1024).toFixed(2)}MB
            </Text>
          )}
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ html: getWebViewHTML() }}
        onMessage={handleWebViewMessage}
        style={styles.hiddenWebView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={false}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  hiddenWebView: {
    height: 0,
    width: 0,
  },
});