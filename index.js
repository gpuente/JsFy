'use strict'

var config = require('./config.json');
var st = require('./lang/strings_en.json');
var mongoose = require('mongoose');
console.log(config.dbconnection.conecctionString);

mongoose.connect(config.dbconnection.conecctionString, (err, res) => {
	if(err){
		console.log(st.db_connection_err);
		throw err;
	}else{
		console.log(st.db_connection_succsess);
	}
});