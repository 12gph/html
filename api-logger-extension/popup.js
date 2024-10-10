document.addEventListener('DOMContentLoaded', function() {
    const logDiv = document.getElementById('log');
    
    // 从 chrome.storage 获取记录并显示
    // 显示存储的 API 调用
    // 显示存储的 API 调用
    chrome.storage.local.get('apiCalls', (data) => {
        const apiCalls = data.apiCalls || [];
        logDiv.innerHTML += apiCalls.map(call => {
            let payload;
            try {
                payload = JSON.parse(call.payload); // 尝试解析 payload
            } catch (e) {
                payload = call.payload; // 如果解析失败，直接使用原字符串
            }
            // 将 payload 嵌套到请求信息中
            const combinedCall = {
                ...call,
                payload: payload
            };
            return `
                <div>
                    <h4>请求信息:</h4>
                    <pre>${JSON.stringify(combinedCall, null, 2)}</pre> <!-- 显示整个对象 -->
                </div>
            `;
        }).join('');
    });
    document.getElementById('downloadButton').addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: "downloadApiCalls" }, function(response) {
            if (response.apiCalls) {
                const blob = new Blob([JSON.stringify(response.apiCalls, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                chrome.downloads.download({
                    url: url,
                    filename: 'api_calls.json', // 设置下载文件名
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

