export const webviewScript = `
function sendMessage(msg) {
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
}

window.addEventListener('message', async (event) => {
    try {
        const { action, wasmData, wasmLoaderCode } = JSON.parse(event.data);
        if (action === 'testMidnightWasm') {
            // Dynamically load the WASM loader function
            console.log('WASM loader code length:', wasmLoaderCode.length);
            console.log('First 200 chars:', wasmLoaderCode.substring(0, 200));
            
            // Use Function constructor instead of eval for better parsing
            const loaderFunction = new Function(wasmLoaderCode);
            loaderFunction();
            
            const { wasmBase64, jsCode } = wasmData;
            const result = await window.loadMidnightWasm(wasmBase64, jsCode);
            sendMessage(result);
        }
    } catch (error) {
        sendMessage({ success: false, message: 'Error: ' + error.message });
    }
});

sendMessage({ success: true, message: 'WebView ready' });
`;