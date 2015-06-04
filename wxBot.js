function _debug(msg){
    DEBUG && console.log(msg);
}

function callBotAPI(newmsg,callback,activechat) {
    //YQL for cross region json ajax
    var yql_url = 'https://query.yahooapis.com/v1/public/yql';
    var url = 'http://www.tuling123.com/openapi/api?key=abab9d3783d6e367e71e56c721e3165a&info='+encodeURIComponent(newmsg);
    $.ajax({
        'url': yql_url,
        'data': {
              'q': 'SELECT * FROM json WHERE url="'+url+'"',
                   'format': 'json',
                   'jsonCompat': 'new',
        },
        'dataType': 'jsonp',
        'success': function(response) {
            ans = response.query.results.json.text;
            callback(ans,activechat);
        },
        'error': function() {
            _debug("ajax error occured");
        }
    });
}

function sendmsg(ans,jumpback){
    _debug("bot resp with: " + ans);
    $('#textInput')[0].value=ans;
    $('.chatSend')[0].click();
    $(jumpback).click();
}

function installbot(chats){
    //add bot notes
    for (i=0;i<chats.length;i++) {
        var bot = document.createElement('div');
        bot.className='bot';
        chats[i].appendChild(bot);
    }

    //listen on bot click event
    $(chats).children('.bot').click(function(e){
        e.stopPropagation();
        $(this).toggleClass('active');
        typeof(observer) !== 'undefined' && observer.disconnect();
    });

    //add drag drop event to bot div
    jQuery.event.props.push('dataTransfer');
    $(chats).on({
        dragenter: function(e) {
            $(this).addClass('over');
        },
        dragover: function(e) {
            e.preventDefault();
        },
        dragleave: function(e) {
            $(this).removeClass('over');
        },
        drop: function() {
            $(this).find('.bot').toggleClass('active');
        },
    });

    _debug("installed "+chats.length.toString()+" bots");
}

function buildbothome() {
    //add bot home
    $('#profile').append([
    '<div id="bot-wrapper">',
        '<img class="bot-home botico" title="wxBot - a WeChat chat bot" src="https://raw.githubusercontent.com/SaneBow/wxBot/master/icons/baymax1.png" draggable="true" />',
        '<span class="tooltip blink">',
            '<p>快把我拖到聊天列表上</p>',
            '<p>点击我可以 暂停/恢复</p>',
        '</span>',
        '<img class="bot-home pauseico" src="https://raw.githubusercontent.com/SaneBow/wxBot/master/icons/pause.png" draggable="false" />',
    '</div>'].join(''));

    //show tooltip for 10s
    $('img.botico').load(function(){
        $('#bot-wrapper span').show();
        setTimeout(function(){
            $('#bot-wrapper span').hide();
        },10*1000);
    });

    //clear tooltip on mousedown
    $('.bot-home').mousedown(function(){
        $('#bot-wrapper span').hide();
    });

    //listen on bot-home click event
    $('.bot-home').click(function(){
        $('.bot-home').toggleClass('paused');
    });

    //listen drag event
    jQuery.event.props.push('dataTransfer');
    $('.bot-home').on({
        dragstart: function() {
            $(this).css('opacity', '0.5');
            $('.chatListColumn *').css('pointer-events','none');
        },
        dragend: function() {
            $(this).css('opacity', '1');
            $('.chatListColumn *').css('pointer-events','');
            $('.chatListColumn').removeClass('over');
        },
    });
    _debug("bot home constructed");
}

function botinit(){
    $(document).ready(function(){
        //init bot-home
        buildbothome();
        //init bot divs
        var bots = $(['.chatListColumn',
            ':not([un="newsapp"])',
            ':not([un="filehelper"])',
            ':not([un="fmessage"])',
            ':not(".loadMoreConv")'].join(''))
        installbot(bots);
        _debug(bots.length.toString()+" bots initiated");
        //set chat list update listener
        setupdater();
    });
}

function botstart(interval){
    interval = typeof interval !== 'undefined' ? interval : 30;
    setInterval(chatbot,interval*1000);
    _debug("started with interval: "+interval.toString()+"s");
}

function botupdate(){
    uninstalled = $(['.chatListColumn',
            ':not([un="newsapp"])',
            ':not([un="filehelper"])',
            ':not([un="fmessage"])',
            ':not(".loadMoreConv")',
            ':not(:has(".bot"))'].join(''));
    uninstalled.length && installbot(uninstalled);
}

function setupdater() {
    updater = new MutationObserver(function(mutations) {
        botupdate();
    });
    updater.observe($('#conversationContainer')[0], { childList: true});
    _debug('updater set');
}

function chatbot() {
    //if paused
    if ( $('.bot-home').hasClass('paused') ) return;
    //if no bot-took-overed
    if ( $('.bot.active').length == 0 )  return;

    //record current chat
    var activechat = $('.activeColumn');

    //reply in current chat window
    typeof(observer) !== 'undefined' && observer.disconnect();
    if ( $('.activeColumn:has(".bot.active")').length ) {
        observer = new MutationObserver(function(mutations) {
            var m = mutations.pop();
            console.log(m);
            var newnode = m.addedNodes[1];
            if (newnode.className == 'chatItem you') {
                var newmsg = $(newnode).find('pre').text();
                var name = $(activechat).find('.left.name').text();
                _debug("msg from: " + name);
                if (newmsg) {
                    _debug("msg content: " + newmsg);
                    callBotAPI(newmsg,sendmsg,activechat);
                } else {
                    _debug("no msg found");
                }
            }
        });
        observer.observe($('#chat_chatmsglist')[0], { childList: true});
    }

    //reply for red dotted item
    $('.unreadDot:visible, .unreadDotS:visible').each(function()
    {
        is_active = $(this).parent().find(".bot").hasClass("active");
        if (!is_active) return;
        var name = $(this).parent().find(".left.name").text();
        _debug("msg from: " + name);

        $(this).parent().click();
        //Wait till chat box loaded
        setTimeout(function(){
            newmsg = $("#chat_chatmsglist").children(".chatItem.you").last().find("pre").text();
            if (newmsg) {
                _debug("msg content: " + newmsg);
                callBotAPI(newmsg,sendmsg,activechat);
            } else {
                _debug("no msg found");
            }
        },500);
    });
}

DEBUG = true;
VERSION = 2.0.0;
botinit();
botstart(runtimeGlobal.interval);
botupdate();
