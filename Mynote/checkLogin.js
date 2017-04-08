function noLogin(req, res, next){
	if(!req.session.user){
		console.log('抱歉，您还没有登陆！');
		return res.redirect('/login');//返回登陆页面
	}
	next();
}
exports.noLogin = noLogin;