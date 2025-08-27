console.log('WebView script loaded');

function sendMessage(msg) {
    console.log('Sending message:', msg);
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    } else {
        console.error('ReactNativeWebView not available');
    }
}

// Listen for messages from React Native
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('message', async (event) => {
    console.log('=== WebView Message Received ===');
    console.log('Raw event.data first 200 chars:', event.data.substring(0, 200));
    
    try {
        const { action, wasmData, timestamp } = JSON.parse(event.data);
        console.log('✓ JSON parsed successfully');
        console.log('action:', action);
        
        if (action === 'testMidnightWasm') {
            console.log('📥 WebView received testMidnightWasm message');
            
            try {
                const { wasmBase64, jsCode } = wasmData;
                console.log('✅ Data access successful');
                console.log('WASM size:', (wasmBase64.length / 1024 / 1024 * 3/4).toFixed(1) + 'MB');
                console.log('JS size:', (jsCode.length / 1024).toFixed(1) + 'KB');
                
                // Simple test for now
                sendMessage({
                    success: true,
                    message: 'WASM data received successfully in WebView!'
                });
                
            } catch (dataError) {
                console.error('❌ Data access failed:', dataError);
                sendMessage({
                    success: false,
                    message: 'Data access failed: ' + dataError.message
                });
            }
        }
    } catch (error) {
        console.error('Message parsing error:', error);
        sendMessage({
            success: false,
            message: 'Message parsing failed: ' + error.message
        });
    }
    });
}

// Test message passing on load
if (typeof document !== 'undefined' && document.addEventListener) {
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
}

console.log('Script setup complete');