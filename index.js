'use strict'

/*
*----------------------------------------------------------------------
* Clean the app environment for any space 
*----------------------------------------------------------------------
*
* Clean the app environment for any spaces to prevent error at the
* moment of load 'config' module 
*
*/

process.env.NODE_ENV = process.env.NODE_ENV.trim();




/*
*----------------------------------------------------------------------
* Set global variablw with string messages
*----------------------------------------------------------------------
*
* Set a global variable 'st' with all messages of the application.
* This variable is used in the most modules of the application
*
*/

global.st = require('./lang/strings_en.json');




/*
*----------------------------------------------------------------------
* Load modules required for the application
*----------------------------------------------------------------------
*
* Load modules required for the application before start Express
* server.
*
*/

let mongoose = require('mongoose');
let app = require('./app');
let config = require('config');
let morgan = require('morgan');




/*
*----------------------------------------------------------------------
* Load port and current environment
*----------------------------------------------------------------------
*
* Load the port on server runs and the current envirnoment of the
* app. The environment has 3 main values: [production, development, test]
*
*/

let port = process.env.PORT || config.get('app.port');
let env = process.env.NODE_ENV;




/*
*----------------------------------------------------------------------
* Print the current environment and config loaded
*----------------------------------------------------------------------
*
* Print in a log console the current environment, the current
* environment used for Express and the current config file loaded. This
* file is located in ./config/
*
*/

console.log('Current Env: "' + env + '"');
console.log('Current Env Express: "' + app.get('env') + '"');
console.log('Config file loaded: ./config/' + config.get('env') + '.json');




/*
*----------------------------------------------------------------------
* Disable mongoose promises warning
*----------------------------------------------------------------------
*
* Disable the console log for mongoose promises warning.
*
*/

mongoose.Promise = global.Promise;




/*
*----------------------------------------------------------------------
* Create DB connection and start the server
*----------------------------------------------------------------------
*
* Create the MongoDB connection and start the server express.
* The db connection is defined in config file located in ./config/
* The config file loaded depends of the current environment
*
*/

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




/*
*----------------------------------------------------------------------
* Export app for test
*----------------------------------------------------------------------
*
* Export the express app for tests
*
*/

module.exports = app;