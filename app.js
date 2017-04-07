'use strict'

/*
	global.st = global variable declared in "/index.js". Contains a json object referenced at "/lang/string_en.json"
				that contains all system messages.
*/

var express = require('express');
var bodyParser = require('body-parser');

var app = express();

//cargar rutas

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//configurar cabeceras http

//rutas base
app.get('/test', function(req, res){
	res.status(200).send({message : global.st.script_success});
});

module.exports = app;