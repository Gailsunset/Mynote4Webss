var express = require('express');

//这个cookieParser是express提供的一个分析Cookie信息，并将信息保存在req.cookie中的中间�?
var cookieParser = require('cookie-parser');

var app = express();
app.use(cookieParser());

app.get('/read',function(req,res,next){
	res.json(req.cookies);
});

app.get('/write',function(req, res, next){
	res.cookie('a','123');
	res.cookie('b','456',{httpOnly: true});
	//res.json(req.cookies);
//	res.cookie('my_cookie','hello',{domain: 'www.abc.com'});
	res.json(req.cookies);
	//		expires: new Date(Date.now() + 2*60*1000)  //2分钟后过�?
});

app.listen(3001);
console.log("Server running at port:3001");
