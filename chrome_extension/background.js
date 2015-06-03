function checkForValidUrl(tabId, changeInfo, tab) {
    console.log(tab.url);
    if (tab.url.match(/.*((wx2?)|(weixin))\.qq\.com/)) {
        chrome.pageAction.show(tabId);
    }
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);
