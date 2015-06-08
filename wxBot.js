function _debug(msg){
    DEBUG && console.log(msg);
}

function callBotAPI(newmsg,callback,sendto,jumpback) {
    //jsonp proxy
    var url = 'https://cuhk.me/wx/jsonp.php';
    $.ajax({
        'url': url,
        'data': {msg: encodeURIComponent(newmsg), s: session_id} ,
        'dataType': 'jsonp',
        'success': function(response) {
            if (typeof(response)=='undefined') {
                setTimeout(function(){
                    ans = '太累了，我想休息一下，zzz～'; 
                    callback(ans,sendto,jumpback);
                },60*1000);
            } else {
                ans = response.text;
                callback(ans,sendto,jumpback);
            }
        },
        'error': function() {
            _debug("ajax error occured");
        }
    });
}

function sendmsg_callback(ans,sendto,jumpback){
    _debug("bot resp with: " + ans);
    sendto && $(sendto).click();
    $('#textInput')[0].value=ans;
    $('.chatSend')[0].click();
    $(jumpback).click();
    var name = $(sendto).find('.left.name').text();
    setTimeout(function(){
        $(sendto).find('.desc').removeClass('read'); //clear read mark
    },100); // dirty: prevent extreme timing case
    _debug('msg sent to: '+name);
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
        '<img class="bot-home botico" title="我是微信聊天机器人大白" src="https://raw.githubusercontent.com/SaneBow/wxBot/master/icons/baymax1.png" draggable="true" />',
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
        //identify user by cookie
        C = function(k){return encodeURIComponent(document.cookie.match(k+'=([^;]*)')[1])};
        session_id = C('xsid');
        nm = encodeURIComponent($('.myProfile .nickName').text());
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
    if ( $('.activeColumn:has(".bot.active")').length ) {
        var lastchat = $('#chat_chatmsglist').children().last();
            if ($(lastchat).not('.read').hasClass('chatItem you')) {  //has read or self msg
                var name = $(activechat).find('.left.name').text();
                var newmsg = $(lastchat).find('pre').text();
                _debug("msg from: " + name);
                if (newmsg) {
                    _debug("msg content: " + newmsg);
                    $(lastchat).addClass('read'); //add read mark
                    callBotAPI(newmsg,sendmsg_callback,activechat);
                } else {
                    _debug("no msg found");
                }
            }
    }

    //reply for red dotted item
    $('.unreadDot:visible, .unreadDotS:visible').each(function()
    {
        var receiver = $(this).parent();
        is_active = $(receiver).find(".bot").hasClass("active");
        if (!is_active) return;
        if ($(receiver).find('.desc').hasClass('read')) return;  //has read, wait for response
        var name = $(receiver).find(".left.name").text();
        _debug("msg from: " + name);
        var newmsg = $(receiver).find('.desc').text();
        if (newmsg) {
            _debug("msg content: " + newmsg);
            $(receiver).find('.desc').addClass('read'); // add read mark
            callBotAPI(newmsg,sendmsg_callback,$(receiver),$(activechat));
        } else {
            _debug("no msg found");
        }
    });
}

DEBUG = true;
VERSION = "2.2.2";
botinit();
botstart(runtimeGlobal.interval);
botupdate();
