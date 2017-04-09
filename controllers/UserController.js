'use strict'

var bcrypt = require('bcrypt-nodejs');
var User = require('../models/User');
var jwt = require('../services/jwt');

function pruebas(req, res){
	res.status(200).send({
		message : 'test de prueba'
	});
}

function saveUser(req, res){
	var user = new User();
	var params = req.body;
	
	if(_isValidUser(params)){
		user.name = params.name;
		user.surname = params.surname;
		user.email = params.email;
		user.role = 'ROLE_ADMIN';
		user.image = 'null';
		user.password = bcrypt.hashSync(params.password);
		console.log(user);

		var promise = user.save();
		promise
			.then(function(userStored){
				if(userStored) res.status(200).send({ user: userStored });
			}).catch(function(err){
				res.status(500).send({ message: global.st.user_no_registered });
			});
	}else{
		res.status(200).send({ message: global.st.user_incomplete });
	}
}

async function loginUser(req, res){
	try{
		var params = req.body;
		var email = params.email;
		var password = params.password;

		var promise = User.findOne({email: email.toLowerCase()});
		var user = await promise;
		if(!user) return res.status(404).send({ message: global.st.user_password_incorrect});
		if(!bcrypt.compareSync(password, user.password)) return res.status(404).send({message: global.st.user_password_incorrect});
		if(params.gethash === 'true') return res.status(200).send({token: jwt.createToken(user)});
		res.status(200).send({user: user});
	}catch(err){
		console.log(err);
		res.status(404).send({message: global.st.user_password_incorrect});
	}
}


function _isValidUser(params){
	if(params.name != null && params.surname != null && params.email != null && params.password != null){
		return true;
	}else{
		return false;
	}
}

module.exports = {
	pruebas,
	saveUser,
	loginUser
};