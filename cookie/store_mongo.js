
/*有时候，我们需要session的声明周期要长一点，比如好多网站有个免密码两周内自动登录的功能。
基于这个需求，session必须寻找内存之外的存储载体，数据库能提供完美的解决方案。
这里，我选用的是mongodb数据库，作为一个NoSQL数据库，
它的基础数据对象时database-collection-document 对象模型非常直观并易于理解，
针对node.js 也提供了丰富的驱动和API。express框架提供了针对mongodb的中间件：
connect-mongo，我们只需在挂载session的时候在options中传入mongodb的参数即可，
程序运行的时候, express app 会自动的替我们管理session的存储，更新和删除。具体可以参考：
https://github.com/kcbanner/connect-mongo
*/
var express = require('express')
var cookieParser = require ('cookie-parser')
var parseurl = require('parseurl')
var session = require('express-session')
var MyFileStore = require('connect-mongo')(session)//定义变量，作业中要求命名为Session ID
//connect-mongo，我们只需在挂载session的时候在options中传入mongodb的参数即可，
const mongoose = require('mongoose')

//var MyFileStore = require('session-file-store')(session)//引入session-file-store模块



var app = express()
 
app.use(cookieParser());
app.use(session({
  secret: 'foo',
  resave: false,
  saveUninitialized: true,
  store: new MyFileStore({ 
   mongooseConnection: mongoose.connection,
   collection: 'Session ID'
})


}))

app.use(function (req, res, next) {
  var views = req.session.views
 
  if (!views) {
    views = req.session.views = {}
  }
 
  // get the url pathname 
  var pathname = parseurl(req).pathname
 
  // count the views 
  views[pathname] = (views[pathname] || 0) + 1
 
  next()
})
 
app.get('/foo', function (req, res, next) {
  res.send('you viewed this page ' + req.session.views['/foo'] + ' times')
})
 
app.get('/bar', function (req, res, next) {
  res.send('you viewed this page ' + req.session.views['/bar'] + ' times')
})

app.listen(3000);
console.log("running on http://123/206.69.15/");