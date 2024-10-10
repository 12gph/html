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
            const apiCalls = data.apiCalls || [];
            const formattedCalls = apiCalls.map(call => {
                let payload;
                try {
                    payload = JSON.parse(call.payload);
                } catch (e) {
                    payload = call.payload; // 处理解析失败的情况
                }
                return { ...call, payload }; // 合并
            });

            sendResponse({ apiCalls: formattedCalls }); // 返回合并后的数据
        });
        return true; // 保持消息通道开启
    }
});






let requestPayloads = {};
let responseBodies = {};

// 捕获请求体
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        // 只处理 POST 请求
        if (details.method === "POST" && details.url.startsWith("https://")) {
            // 存储请求的 payload
            if (details.requestBody && details.requestBody.raw) {
                const encoder = new TextDecoder();
                const payload = details.requestBody.raw.map(buffer => encoder.decode(new Uint8Array(buffer.bytes)));
                requestPayloads[details.requestId] = payload.join('');  // 处理并存储为字符串
            } else {
                requestPayloads[details.requestId] = null;
            }
        }
    },
    { urls: ["<all_urls>"] },  // 监听所有 URLs
    ["requestBody"]  // 需要请求体
);

// 捕获请求完成事件
chrome.webRequest.onCompleted.addListener(
    (details) => {
        // 只处理 POST 请求
        if (details.method === "POST" && details.url.startsWith("https://")) {
            const requestInfo = {
                url: details.url,
                method: details.method,
                requestId: details.requestId,
                statusCode: details.statusCode,
                statusLine: details.statusLine,
                payload: requestPayloads[details.requestId],  // 关联请求体
                response: responseBodies[details.requestId],  // 关联响应内容
                timestamp: details.timeStamp
            };

            // 存储请求记录
            chrome.storage.local.get('apiCalls', (data) => {
                let apiCalls = data.apiCalls || [];
                apiCalls.push(requestInfo);
                chrome.storage.local.set({ apiCalls });
            });

            // 清除请求体记录
            delete requestPayloads[details.requestId];
            delete responseBodies[details.requestId];
        }
    },
    { urls: ["<all_urls>"] }  // 捕获所有 URL
);

// 捕获响应体
chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (details.method === "POST" && details.url.startsWith("https://")) {
            const filter = chrome.webRequest.filterResponseData(details.requestId);
            const decoder = new TextDecoder('utf-8');
            let responseBody = '';

            filter.ondata = (event) => {
                responseBody += decoder.decode(event.data, { stream: true });
                filter.write(event.data);  // 将数据传递回去
            };

            filter.onstop = () => {
                filter.disconnect();
                responseBodies[details.requestId] = responseBody;  // 保存响应内容
            };
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking", "responseHeaders"]
);
