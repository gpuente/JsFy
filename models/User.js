'user strict'

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	name: {type: String, required: true},
	surname: {type: String, required: true},
	email: {type: String, required: true, unique: true},
	password: {type: String, required: true},
	role: String,
	image: String
});

UserSchema.pre('save', function(next){
	this.password = bcrypt.hashSync(this.password);
	next();
})

module.exports = mongoose.model('User', UserSchema);