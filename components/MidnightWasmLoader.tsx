import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { wasmGlueCode } from '../assets/wasmGlue';
import { webviewScript } from '../webview-script';
import { wasmLoaderScript } from '../webview/wasmLoader';

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
  const [wasmData, setWasmData] = useState<{wasmBase64: string, jsCode: string} | null>(null);

  // Load assets
  useEffect(() => {
    const loadAssets = async () => {
      try {
        console.log('Loading assets...');
        
        console.log(`WebView script loaded: ${(webviewScript.length / 1024).toFixed(1)}KB`);
        console.log(`WASM loader loaded: ${(wasmLoaderScript.length / 1024).toFixed(1)}KB`);
        
        // Load WASM file 
        const wasmAsset = Asset.fromModule(require('../assets/midnight_onchain_runtime_wasm_bg.wasm'));
        await wasmAsset.downloadAsync();
        
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
        
        console.log(`Assets loaded - WASM: ${(base64String.length / 1024 / 1024 * 3/4).toFixed(1)}MB`);
        
        setWasmData({ wasmBase64: base64String, jsCode: wasmGlueCode });
        
      } catch (error) {
        console.error('Failed to load assets:', error);
        Alert.alert('Asset Load Error', `Failed to load assets: ${error instanceof Error ? error.message : error}`);
      }
    };
    
    loadAssets();
  }, []);

  const handleWebViewMessage = (event: any) => {
    // Clear any pending timeout
    if ((window as any).wasmTestTimeout) {
      clearTimeout((window as any).wasmTestTimeout);
      (window as any).wasmTestTimeout = null;
    }
    
    try {
      console.log('📨 Received WebView message:', event.nativeEvent.data.substring(0, 200));
      const result: WasmTestResult = JSON.parse(event.nativeEvent.data);
      setTestResult(result);
      setIsLoading(false);
      
      if (result.success) {
        console.log('✅ WASM Test Success:', result.message);
      } else {
        console.error('❌ WASM Test Failed:', result.message);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
      setIsLoading(false);
    }
  };

  const getButtonTitle = (): string => {
    if (isLoading) return "Testing...";
    if (wasmData) return "Test Midnight WASM";
    return "Loading Assets...";
  };

  const testWasmLoading = () => {
    if (!wasmData) {
      console.warn('Assets not ready - files are still loading. Please wait...');
      return;
    }
    
    setIsLoading(true);
    setTestResult(null);
    
    // Add timeout to prevent indefinite loading
    const timeout = setTimeout(() => {
      console.error('⏰ WebView test timed out after 10 seconds');
      setIsLoading(false);
      setTestResult({
        success: false,
        message: 'Test timed out - WebView may have crashed or hung'
      });
    }, 10000);
    
    // Store timeout so we can clear it when we get a response
    (window as any).wasmTestTimeout = timeout;
    
    console.log('🚀 Sending message to WebView...');
    console.log('WASM loader script first 200 chars:', wasmLoaderScript.substring(0, 200));
    
    const message = {
      action: 'testMidnightWasm',
      wasmData: wasmData,
      wasmLoaderCode: wasmLoaderScript,
      timestamp: Date.now()
    };
    
    console.log('Message JSON first 300 chars:', JSON.stringify(message).substring(0, 300));
    
    // Send message to WebView with WASM data, JS glue code, and loader code
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

  const getWebViewHTML = (): string => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Midnight WASM Test - Clean</title>
</head>
<body>
    <div id="status">WebView loaded, waiting for script injection...</div>
</body>
</html>`;
  };
  
  const getInjectedJavaScript = (): string => {
    // Just inject the minimal webview script, load WASM code via postMessage
    console.log('Injecting minimal script, length:', webviewScript.length);
    return webviewScript + '; true;';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Midnight WASM WebView Test</Text>
      
      <Button
        title={getButtonTitle()}
        onPress={testWasmLoading}
        disabled={isLoading || !wasmData}
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
        injectedJavaScript={getInjectedJavaScript()}
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