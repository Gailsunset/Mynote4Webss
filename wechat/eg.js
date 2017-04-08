var PORT = 9530;
var http = require('http');
var qs = require('qs');
var TOKEN = 'kakawu';


function checkSignature(params, token){
    //1. 将token、timestamp、nonce三个参数进行字典序排序
    //2. 将三个参数字符串拼接成一个字符串进行sha1加密
    //3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信

    var key = [token, params.timestamp, params.nonce].sort().join('');
    var sha1 = require('crypto').createHash('sha1');
    sha1.update(key);

    return  sha1.digest('hex') == params.signature;
}

var server = http.createServer(function (request, response) {

    //解析URL中的query部分，用qs模块(npm install qs)将query解析成json
    var query = require('url').parse(request.url).query;
    var params = qs.parse(query);

    if(!checkSignature(params, TOKEN)){
        //如果签名不对，结束请求并返回
        response.end('signature fail');
        return;
    }


    if(request.method == "GET"){
        //如果请求是GET，返回echostr用于通过服务器有效校验
        response.end(params.echostr);
    }else{
        //否则是微信给开发者服务器的POST请求
        var postdata = "";

        request.addListener("data",function(postchunk){
            postdata += postchunk;
        });

        //获取到了POST数据
        request.addListener("end",function(){
            var parseString = require('xml2js').parseString;

            parseString(postdata, function (err, result) {
                if(!err){
                    var res = replyText(result);
                    response.end(res);
                }
            });
        });
    }
});

server.listen(PORT);

console.log("Server runing at port: " + PORT + ".");






function replyText(msg) {
    var msgtyppe = msg.xml.MsgType[0];
    switch(msgtyppe) {
        case 'text':
            feedback ='文本消息';
            break;
        case 'image':
            feedback ='图片消息';
            break;
        case 'shortvideo':
            feedback ='小视频';
            break;
        case 'video':
            feedback ='视频消息';
            break;
        case 'voice':
            feedback ='语音消息';
            break;
        case 'location':
            feedback ='位置消息';
            break;
        case 'link':
            feedback ='链接消息';
            break;
        default:
            feedback = '未知消息类型';
    }
    console.log(msg);


/*
    function replyText(msg, replyText){
    if(msg.xml.MsgType[0] !== 'text'){
        return '';
    }
    console.log(msg);
*/
    //将要返回的消息通过一个简单的tmpl模板（npm install tmpl）返回微信
    var tmpl = require('tmpl');
    var replyTmpl = '<xml>' +
        '<ToUserName><![CDATA[{toUser}]]></ToUserName>' +
        '<FromUserName><![CDATA[{fromUser}]]></FromUserName>' +
        '<CreateTime><![CDATA[{time}]]></CreateTime>' +
        '<MsgType><![CDATA[{type}]]></MsgType>' +
        '<Content><![CDATA[{content}]]></Content>' +
        '</xml>';

    return tmpl(replyTmpl, {
        toUser: msg.xml.FromUserName[0],
        fromUser: msg.xml.ToUserName[0],
        type: 'text',
        time: Date.now(),
        content: feedback
    });
}

