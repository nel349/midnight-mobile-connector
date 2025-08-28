export const webviewScript = `
function sendMessage(msg) {
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
}

// Forward console messages to React Native
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = function(...args) {
    originalLog.apply(console, args);
    sendMessage({ type: 'console', level: 'log', message: args.join(' ') });
};

console.warn = function(...args) {
    originalWarn.apply(console, args);
    sendMessage({ type: 'console', level: 'warn', message: args.join(' ') });
};

console.error = function(...args) {
    originalError.apply(console, args);
    sendMessage({ type: 'console', level: 'error', message: args.join(' ') });
};

console.log('DEBUG: webview-script.ts loaded and console forwarding active');

window.addEventListener('message', async (event) => {
    try {
        console.log('DEBUG: Received message event:', typeof event.data);
        const { action, wasmData, wasmLoaderCode } = JSON.parse(event.data);
        if (action === 'testMidnightWasm') {
            console.log('DEBUG: Executing wasmLoaderCode...');
            // Use eval instead of new Function to ensure proper global scope
            eval(wasmLoaderCode);
            
            console.log('DEBUG: wasmLoaderCode executed, calling window.loadMidnightWasm...');
            const { wasmBase64, jsCode } = wasmData;
            const result = await window.loadMidnightWasm(wasmBase64, jsCode);
            console.log('DEBUG: loadMidnightWasm result:', result);
            sendMessage(result);
        }
    } catch (error) {
        console.error('DEBUG: Error in webview-script:', error);
        sendMessage({ success: false, message: 'Error: ' + error.message });
    }
});

sendMessage({ success: true, message: 'WebView ready' });
`;