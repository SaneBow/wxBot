function checkForValidUrl(tabId, changeInfo, tab) {
    if (tab.url.match(/.*((wx2?)|(weixin))\.qq\.com/)) {
        chrome.pageAction.show(tabId);
    }
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);

//set up a listener to transmit settings
//chrome.runtime.onMessage.addListener(
//    function(request, sender, sendResponse) {
//        if (request.action == "getSettings") {
//            chrome.storage.sync.get('botSleepInterval',function(items){
//                sendResponse({interval: items.botSleepInterval});
//            });
//        }
//    }
//);
