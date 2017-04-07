'use strict'

var config = require('./config.json');
global.st = require('./lang/strings_en.json');
var mongoose = require('mongoose');
var app = require('./app');
var port = process.env.PORT || config.app.port;


mongoose.connect(config.dbconnection.conecctionString, (err, res) => {
	if(err){
		console.log(global.st.db_connection_err);
		throw err;
	}else{
		console.log(global.st.db_connection_succsess);
		app.listen(port, function(){
			console.log(global.st.server_running + port);
		});
	}
});