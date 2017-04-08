//加载依赖库
var express = require ('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session');
var checkLogin = require('./checkLogin.js');
var moment = require('moment');


//引入mongoose
var mongoose = require('mongoose');
//引入模型
var models = require('./models/models');
 

//使用mongoose链接服务
mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error',console.error.bind(console,'链接数据库失败'));



//创建express实例
var app = express();

//定义EJS模板引擎和模板文件位置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//定义静态文件目录
app.use(express.static(path.join(__dirname,'public')));

//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//建立session模型
app.use(session({
	secret: '1234',
	name: 'note',
	cookie: {maxAge: 1000 * 60 * 20}, //设置session的保存时间为20min
	resave: false,
	saveUninitialized: true
}));



var User = models.User;
var Note = models.Note;

//响应首页get请求
app.get('/', checkLogin.noLogin);
app.get('/',function(req, res){
	Note.find({author: req.session.user.username})
		.exec(function(err,allNotes){
			if(err){
				console.log(err);
				return res.redirect('/');
			}
			res.render('index',{
				title:'首页',
				user:req.session.user,
				notes:allNotes
			});
		});
});




//响应注册页面get请求
app.get('/register',function(req, res){
	console.log('注册！');
	res.render('register',{
		user: req.session.user,
		title: '注册'
	});
	});
//post请求
app.post('/register', function(req,res){
	//req.body 可以获取表单每项数据
	var username = req.body.username,
		password = req.body.password,
		passwordRepeat = req.body.passwordRepeat;

	//检查输入的用户名是否为空，使用trim去掉两端空格
	if (username.trim().length == 0) {
		console.log('用户名不能为空！');
		return res.redirect('/register');
	}	
	
	//用户名：只能是字母、数字、下划线的组合，长度3-20个字符。
	if (username.match != ('^\\w+$')) {
	//其中\w指表示匹配字母、数字、下划线的组合; $表示一直匹配到末尾
	//	^ :字符串的开始  $:字符串的结束. 
	//	If you left off the ^, for example, ~@*##@horatio would pass your validation.
	//	 Likewise for the $ and the end of the string being checked. –
		console.log('用户名只能是字母、数字、下划线的组合');
		return res.redirect('/register');
	}	

	//用户名长度3-20
	 if(username.trim().length< 3||username.trim().length > 20){
        req.flash('error','用户名长度必须3-20个字符');
        return res.redirect('/register');
       } 

	



	//检查输入的密码是否为空，使用trim去掉两端空格
	if (password.trim().length == 0 || passwordRepeat.trim().length == 0){
		console.log('密码不能为空！');
		return res.redirect('/register');
	}	

	//检查两次输入的密码是否一致
	if(password != passwordRepeat){
		console.log('两次输入的密码不一致');
		return res.redirect('/register');
	}
	//检查用户名是否已经存在，如果不存在，保存该条记录
	User.findOne({username:username}, function(err,user){
		if(err){
			console.log(err);
			return res.redirect('/register');
		}
		if (user) {
			console.log('用户名已经存在');
			return res.redirect('/register');
		}
		
	//对密码进行md5加密
	var md5 = crypto.createHash('md5'),
		md5password = md5.update(password).digest('hex');

	//新建user对象用于保存数据
	var newUser = new User({
		username: username,
		password: md5password
	});

	newUser.save(function(err,doc){
		if(err){
			console.log(err);
			return res.redirect('/register');
		}
		console.log('注册成功');
		return res.redirect('/');
	});
});
});




app.get('/login',function(req, res){
	console.log('登陆！');
	res.render('login',{
		user: req.session.user,
		title: '登陆'
/*		user:req.user.username */
	});
	});


app.post('/login',function(req,res){
	var username = req.body.username,
		password = req.body.password;

	User.findOne({username:username},function (err,user){
		if(err){
			console.log(err);
			return res.redirect('/login');
		}
		if (!user) {
			console.log('用户不存在！');
			return res.redirect('/login');
		}
	//对密码进行md5加密
	var md5 = crypto.createHash('md5');
			md5password = md5.update(password).digest('hex');
	if(user.password != md5password){
		console.log('密码错误！');
		return res.redirect('/login');
	}
	console.log('登陆成功!');
	user.password = null;
	delete user.password;
	req.session.user = user;
	return res.redirect('/');
	});	
});






app.get('/quit',function(req, res){
	req.session.user=null;
	console.log('退出！');
	return res.redirect('/login');
	});

app.get('/post',function(req, res){
	console.log('发布！');
	res.render('post',{
		user: req.session.user,
		title:'发布'
	});
	});

app.post('/post',function(req,res){
	var note = new Note({
		title: req.body.title,
		author: req.session.user.username,
		tag: req.body.tag,
		content: req.body.content
	});

	note.save(function(err,doc){
		if(err){
			console.log(err);
			return res.redirect('/post');
		}
		console.log('文章发表成功！')
		return res.redirect('/');
	});
});

app.get('/detail/:_id',function(req,res){
	console.log('查看笔记！');
	Note.findOne({_id:req.params._id})
		.exec(function(err,art){
			if(err){
				console.log(err);
				return res.redirect('/');
			}
			if(art){
				res.render('detail',{
					title:'笔记详情',
					user:req.session.user,
					art: art,
					moment:moment
				});
			}
		});
});

//监听3000端口
app.listen(3000,function(req,res){
	console.log('app is running at port 3000');
});
