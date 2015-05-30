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
    $('#conv_filehelper').click();
    $('.unreadDot:visible').each(function()
    {
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


//setInterval(chatbot,30*1000)
