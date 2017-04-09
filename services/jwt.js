'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var payload = require('../res/jwt-payload.json');
var secret_password = global.config.jwt.secret_password; //define this password in config.json

exports.createToken = function(user){
	payload.sub = user._id;
	payload.name = user.name;
	payload.surname = user.surname;
	payload.email = user.email;
	payload.role = user.role;
	payload.image = user.image;
	payload.iat = moment().unix();
	payload.exp = moment().add(30, 'days').unix();
	
	return jwt.encode(payload, secret_password);
};