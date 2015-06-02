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
            console.log("ajax error occured");
        }
    });
}

function sendmsg(ans) {
    console.log("bot resp with: " + ans);
    $('#textInput')[0].value=ans;
    $('.chatSend')[0].click();
    console.log("msg sent to: " + name);
    $('#conv_filehelper').click();
}

function chatbot() {
    //if paused
    if ( $('.bot-home').hasClass('paused') ) return;
    //if no bot-took-overed
    if ( $('.bot.active').length == 0 )  return;

    $('#conv_filehelper').click();
    $('.unreadDot:visible,.unreadDotS:visible').each(function()
    {
        is_active = $(this).parent().find(".bot").hasClass("active");
        if (!is_active) return;
        name = $(this).parent().find(".left.name").text();
        console.log("msg from: " + name);
        $(this).click();
        //Wait till chat box loaded
        setTimeout(function(){
            newmsg = $("#chat_chatmsglist").children(".chatItem.you").last().find("pre").text();
            if (newmsg) {
                console.log("msg content: " + newmsg);
                callBotAPI(newmsg,sendmsg);
            } else {
                console.log("no msg found")
            }
        },500);
    });
}

function botinit(){
    //setInterval(chatbot,30*1000)
    $(document).ready(function(){
        //add bot notes
        chats = document.getElementsByClassName('chatListColumn');
        for (i=0;i<chats.length;i++) {
            var bot = document.createElement('div');
            bot.className='bot';
            chats[i].appendChild(bot);
        }

        //listen on bot click event
        $('.bot').click(function(e){
            e.stopPropagation();
            $(this).toggleClass('active');
        });

        //add bot home
        $('#profile').append([
        '<div id="bot-wrapper">',
            '<img class="bot-home botico" title="wxBot - a WeChat chat bot" src="https://raw.githubusercontent.com/SaneBow/wxBot/master/icons/baymax1.png" draggable="true" />',
            '<span class="tooltip blink">drag & drop me</span>',
            '<img class="bot-home pauseico" src="https://raw.githubusercontent.com/SaneBow/wxBot/master/icons/pause.png" draggable="false" />',
        '</div>'].join(''));

        //show tooltip for 10s
        $('#bot-wrapper span').show();
        setTimeout(function(){
            $('#bot-wrapper span').hide();
        },5*1000);

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
        $('.chatListColumn').on({
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

        //start bot
        setInterval(chatbot,30*1000);
    });
}


botinit();
