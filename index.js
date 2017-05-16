'use strict'
/*
*----------------------------------------------------------------------
* Set a default environment if not exist
*----------------------------------------------------------------------
*
* Set a default environmet if any environment is set when launch
* the Node.js app.
*
*/

if(!process.env.NODE_ENV) process.env.NODE_ENV = 'development';





/*
*----------------------------------------------------------------------
* Clean the app environment of any space 
*----------------------------------------------------------------------
*
* Clean the app environment of any spaces to prevent error at the
* moment of load 'config' module 
*
*/

process.env.NODE_ENV = process.env.NODE_ENV.trim();




/*
*----------------------------------------------------------------------
* Set global variable with string messages
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
let clc = require('cli-color');




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

console.log(clc.whiteBright('Current Env: ') + clc.yellowBright('"' + env + '"'));
console.log(clc.whiteBright('Current Env Express: ') + clc.yellowBright('"' + app.get('env') + '"'));
console.log(clc.whiteBright('Config file loaded: ') + clc.yellowBright('./config/' + config.get('env') + '.json'));




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