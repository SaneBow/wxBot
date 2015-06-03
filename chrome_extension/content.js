function loadjscssfile(filename, filetype){
    if (filetype=="js"){ //if filename is a external JavaScript file
        var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", filename)
    }
    else if (filetype=="css"){ //if filename is an external CSS file
        var fileref=document.createElement("link")
        fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css")
        fileref.setAttribute("href", filename)
    }
    if (typeof fileref!="undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}

function waitForElementToDisplay(selector, time) {
    if(document.querySelector(selector)!=null) {
        loadjscssfile('https://rawgit.com/SaneBow/wxBot/master/wxBot.css','css');
        loadjscssfile('https://rawgit.com/SaneBow/wxBot/master/wxBot.js','js');
        return;
    }
    else {
        setTimeout(function() {
            waitForElementToDisplay(selector);
        }, time);
    }
}

waitForElementToDisplay('#accountAvatarWrapper',1000);

//set up a messager to fetch settings
var runtimeGlobal = {};
chrome.runtime.sendMessage({action: "getSettings"}, function(response) {
    runtimeGlobal.interval = response.interval;
});
