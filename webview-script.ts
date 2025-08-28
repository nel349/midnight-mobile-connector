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