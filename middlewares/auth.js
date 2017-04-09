'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret_password = global.config.jwt.secret_password; //define this password in config.json

exports.checkApiAuth = function(req, res, next){
	if(!req.headers.authorization) return res.status(403).send({message: global.st.error_login_header});
	var token = req.headers.authorization.replace(/['"]+/g, '');
	try{
		var payload = jwt.decode(token, secret_password);
		if(payload.exp < moment().unix()) return res.status(401).send({message: global.st.error_login_token_expired});
	}catch(e){
		//console.log(e);
		return res.status(404).send({message: global.st.error_login_invalid_token});
	}

	req.user = payload;
	next();
};