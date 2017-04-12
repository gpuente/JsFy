'use strict'

//global.config = require('./config.json');
global.st = require('./lang/strings_en.json');
var mongoose = require('mongoose');
var app = require('./app');
var config = require('config');
var morgan = require('morgan');
var port = process.env.PORT || config.get('app.port');
let env = process.env.NODE_ENV;

console.log('Current Env: "' + env + '"');
console.log('Current Env Express: "' + app.get('env') + '"');
console.log('Config file loaded: ./config/' + config.get('env') + '.json');


mongoose.Promise = global.Promise;
mongoose.connect(config.get('dbconnection.conecctionString'), (err, res) => {
	if(err){
		console.log(global.st.db_connection_err);
		throw err;
	}else{
		if(env != 'test') console.log(global.st.db_connection_succsess);
		app.listen(port, function(){
			if(env != 'test') console.log(global.st.server_running + port);
		});
	}
});

module.exports = app;