import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { webviewScript } from '../webview-script';
import { wasmLoaderScript } from '../webview/wasmLoader';
import { zswapGlueCode } from '../assets/zswapGlueCode';

interface WasmTestResult {
  success: boolean;
  message: string;
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
        
        console.log('🎯 USING REAL ZSWAP GLUE FILE - This should work!');
        
        // Load zswap WASM file (the one with SecretKeys.fromSeed)
        const zswapWasmAsset = Asset.fromModule(require('../assets/midnight_zswap_wasm_bg.wasm'));
        await zswapWasmAsset.downloadAsync();
        
        // Read zswap WASM as base64
        const zswapResponse = await fetch(zswapWasmAsset.localUri!);
        const zswapArrayBuffer = await zswapResponse.arrayBuffer();
        const zswapBytes = new Uint8Array(zswapArrayBuffer);
        
        let zswapBase64 = '';
        const chunk = 8192;
        for (let i = 0; i < zswapBytes.length; i += chunk) {
          const slice = zswapBytes.slice(i, i + chunk);
          zswapBase64 += String.fromCharCode.apply(null, Array.from(slice));
        }
        const zswapBase64String = btoa(zswapBase64);
        
        console.log(`Zswap WASM loaded: ${(zswapBase64String.length / 1024 / 1024 * 3/4).toFixed(1)}MB`);
        console.log(`Zswap glue code loaded: ${(zswapGlueCode.length / 1024).toFixed(1)}KB`);
        
        setWasmData({ wasmBase64: zswapBase64String, jsCode: zswapGlueCode });
        
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
      const result = JSON.parse(event.nativeEvent.data);
      
      if (result.success && result.message === 'WebView ready') {
        console.log('✅ WebView is ready');
        return;
      }
      
      setTestResult(result);
      setIsLoading(false);
      
      if (result.success) {
        console.log('✅ WASM Test Success:', result.message);
      } else {
        console.log('❌ WASM Test Failed:', result.message);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
      setTestResult({ success: false, message: 'Failed to parse message' });
      setIsLoading(false);
    }
  };

  const testWasmLoading = () => {
    if (!wasmData) {
      Alert.alert('Error', 'Assets not loaded yet');
      return;
    }
    
    setIsLoading(true);
    setTestResult(null);
    
    console.log('🚀 Sending message to WebView...');
    console.log('WASM loader script first 200 chars:', wasmLoaderScript.substring(0, 200));
    
    const message = {
      action: 'testMidnightWasm',
      wasmData: wasmData,
      wasmLoaderCode: wasmLoaderScript,
      timestamp: Date.now()
    };
    
    console.log('Message JSON first 300 chars:', JSON.stringify(message).substring(0, 300));
    console.log('wasmData:', wasmData ? 'EXISTS' : 'NULL');
    console.log('wasmData.jsCode:', wasmData?.jsCode ? `EXISTS (${wasmData.jsCode.length} chars)` : 'NULL');
    
    // Send message to WebView with WASM data, JS glue code, and loader code
    webViewRef.current?.postMessage(JSON.stringify(message));
    
    // Set a timeout to detect hangs
    (window as any).wasmTestTimeout = setTimeout(() => {
      console.log('⚠️ WASM test timed out after 60 seconds');
      setTestResult({ success: false, message: 'Test timed out after 60 seconds' });
      setIsLoading(false);
    }, 60000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Midnight WASM Test</Text>
      <Text style={styles.subtitle}>SecretKeys.fromSeed() - Step 1 of Wallet Building</Text>
      
      <Button
        title={isLoading ? "Testing..." : "Test SecretKeys.fromSeed()"}
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
        </View>
      )}
      
      <Text style={styles.statusText}>
        Assets: {wasmData ? 'Loaded' : 'Loading...'}
      </Text>
      
      <WebView
        ref={webViewRef}
        source={{ html: `<html><body><div id="status">WebView Loading...</div></body></html>` }}
        onMessage={handleWebViewMessage}
        injectedJavaScript={webviewScript}
        style={styles.webView}
        javaScriptEnabled={true}
        onError={(error) => console.error('WebView error:', error)}
        onLoad={() => console.log('WebView loaded')}
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
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
  },
  statusText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#666',
  },
  webView: {
    height: 1,
    opacity: 0,
  },
});