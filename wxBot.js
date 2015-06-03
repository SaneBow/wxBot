function _dubug(msg){
    DEBUG && console.log(msg);
}

function callBotAPI(newmsg,callback) {
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
            callback(ans);
        },
        'error': function() {
            _dubug("ajax error occured");
        }
    });
}

function sendmsg(ans) {
    _dubug("bot resp with: " + ans);
    $('#textInput')[0].value=ans;
    $('.chatSend')[0].click();
    _dubug("msg sent to: " + name);
    $('#conv_filehelper').click();
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

    _dubug("installed "+chats.length.toString()+" bots");
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
    _dubug("bot home constructed");
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
        _dubug(bots.length.toString()+" bots initiated");
    });
}

function botstart(interval){
    interval = typeof interval !== 'undefined' ? interval : 30;
    setInterval(chatbot,interval*1000);
    _dubug("started with interval: "+interval.toString()+"s");
}

function botupdate(){
    uninstalled = $(['.chatListColumn',
            ':not([un="newsapp"])',
            ':not([un="filehelper"])',
            ':not([un="fmessage"])',
            ':not(".loadMoreConv")',
            ':not(:has(".bot"))'].join(''));
    uninstalled.length && _dubug(uninstalled.length.toString()+" nodes to update");
    uninstalled.length && installbot(uninstalled);
}

function chatbot() {
    botupdate();

    //if paused
    if ( $('.bot-home').hasClass('paused') ) return;
    //if no bot-took-overed
    if ( $('.bot.active').length == 0 )  return;

    //reply in current chat window
    if ( $('.activeColumn:has(".bot.active")').length ) {
        var observer = new MutationObserver(function(mutations) {
         mutations.forEach(function(mutation) {
            e = mutation.addNodes;
            console.log(e);
            //dirty hack: disconnect every time bot runs
            if (mutation.addNodes !== undefined && mutation.addedNodes[1].className == 'chatItem you'){
                observer.disconnect();
            }
         });
        });
        observer.observe($('#chat_chatmsglist')[0], { childList: true});
    }

    //reply for red dotted item
    //$('#conv_filehelper').click();
    $('.unreadDot:visible,.unreadDotS:visible').each(function()
    {
        is_active = $(this).parent().find(".bot").hasClass("active");
        if (!is_active) return;
        name = $(this).parent().find(".left.name").text();
        _dubug("msg from: " + name);
        $(this).click();
        //Wait till chat box loaded
        setTimeout(function(){
            newmsg = $("#chat_chatmsglist").children(".chatItem.you").last().find("pre").text();
            if (newmsg) {
                _dubug("msg content: " + newmsg);
                callBotAPI(newmsg,sendmsg);
            } else {
                _dubug("no msg found")
            }
        },500);
    });
}

DEBUG = true;
botinit();
botstart(runtimeGlobal.interval);
botupdate();
