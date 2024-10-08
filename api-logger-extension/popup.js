document.addEventListener('DOMContentLoaded', function() {
    const logDiv = document.getElementById('log');
    
    // 从 chrome.storage 获取记录并显示
    chrome.storage.local.get('apiCalls', (data) => {
        const apiCalls = data.apiCalls || [];
        logDiv.innerHTML += apiCalls.map(call => `<div>${JSON.stringify(call)}</div>`).join(''); // 使用 JSON.stringify 以正确显示对象
    });
    document.getElementById('downloadButton').addEventListener('click', function() {
        console.log("Sending message to background script");
        chrome.runtime.sendMessage({ action: "downloadApiCalls" }, function(response) {
            if (response && response.apiCalls) {
                const blob = new Blob([response.apiCalls.map(call => JSON.stringify(call)).join('\n')], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);

                chrome.downloads.download({
                    url: url,
                    filename: 'api_calls.txt',
                    saveAs: true
                });
            }
        });
    });

    // 清除按钮点击事件
    document.getElementById('clearButton').addEventListener('click', function() {
        chrome.storage.local.set({ apiCalls: [] }, () => {
            logDiv.innerHTML = ''; // 清空页面显示的记录
            console.log("Cleared API calls");
        });
    });
});

