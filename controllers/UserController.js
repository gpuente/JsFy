'use strict'

var fs = require('fs');
var path = require('path');
var bcrypt = require('bcrypt-nodejs');
var config = require('config');
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

async function updateUser(req, res){
	try{
		var userId = req.params.id;
		var userData = req.body;

		var promise = User.findByIdAndUpdate(userId, userData);
		var userUpdated = await	promise;
		if(!userUpdated) return res.status(404).send({message: global.st.user_not_updated});
		res.status(200).send({user: userUpdated});

	}catch(err){
		res.status(500).send({message: global.st.error_update_user});
	}
}

async function uploadImage(req, res){
	try{
		var userId = req.params.id;
		var fileName = null;
		if(!req.files.image) return res.status(200).send({message: global.st.upload_user_image_not_sended});
		var fileSplit = req.files.image.path.split(config.get('dir.file_system_separator'));
		var fileFullName = fileSplit[fileSplit.length - 1];
		var fileName = fileFullName.split('\.')[0];
		var fileExt = fileFullName.split('\.')[1];
		var isValidExt = false;
		
		for (var i = 0 ; i < config.get('dir.file_image_ext_supported').length; i++) {
			if(config.get('dir.file_image_ext_supported')[i] == fileExt) isValidExt = true;
		}

		if(!isValidExt) return res.status(200).send({message: global.st.upload_user_image_error_ext});

		var promise = User.findByIdAndUpdate(userId, {image: fileFullName});
		var userUpdated = await promise;
		if(!userUpdated) return res.status(404).send({message: global.st.user_image_not_updated});
		res.status(200).send({user: userUpdated});
	}catch(err){
		res.status(500).send({message: global.st.upload_user_image_error});
	}
}

function getImageFile(req, res){
	var imageFile = req.params.image;
	var pathImage = config.get('dir.user_images') + imageFile;
	if(!fs.existsSync(pathImage)) return res.status(200).send({message: global.st.get_user_image_not_exists}); 
	res.sendFile(path.resolve(pathImage));
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
	loginUser,
	updateUser,
	uploadImage,
	getImageFile
};