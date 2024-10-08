// 监听扩展的安装事件
chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [
            {
                id: 1,
                priority: 1,
                action: {
                    type: "allow"
                },
                condition: {
                    urlFilter: ".*",
                    resourceTypes: ["xmlhttprequest"]
                }
            }
        ],
        removeRuleIds: [1]
    });
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadApiCalls") {
        chrome.storage.local.get('apiCalls', (data) => {
            sendResponse({ apiCalls: data.apiCalls || [] });
        });
        return true; // 表示异步响应
    }
});






let requestPayloads = {};

// chrome.webRequest.onBeforeRequest.addListener(
//     (details) => {
//         // 只处理 https 请求
//         if (details.url.startsWith("https://")) {
//             // 存储请求的 payload
//             requestPayloads[details.requestId] = details.requestBody ? details.requestBody.raw : null;

//             // 存储 URL 以便稍后使用
//             chrome.storage.local.get('apiCalls', (data) => {
//                 let apiCalls = data.apiCalls || [];
//                 // 记录请求的 URL
//                 apiCalls.push({ url: details.url, payload: requestPayloads[details.requestId] });
//                 chrome.storage.local.set({ apiCalls });
//             });
//         }
//     },
//     { urls: ["<all_urls>"] },
//     ["blocking", "requestBody"]  // 需要请求体
// );

chrome.webRequest.onCompleted.addListener(
    (details) => {
        // 获取响应内容
        if (details.url.startsWith("https://")) {
            chrome.storage.local.get('apiCalls', (data) => {
                let apiCalls = data.apiCalls || [];
                const payload = requestPayloads[details.requestId] || null;

                // 记录请求的 URL、payload 和响应
                const responseEntry = {
                    url: details.url,
                    payload: payload,
                    response: { statusCode: details.statusCode, data: details.data } // 可以扩展此处以存储更多响应信息
                };
                apiCalls.push(responseEntry);
                chrome.storage.local.set({ apiCalls });
            });

            // 删除已处理的请求 payload
            delete requestPayloads[details.requestId];
        }
    },
    { urls: ["<all_urls>"] }
);


