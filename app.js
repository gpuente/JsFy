'use strict'

/*
	global.st = global variable declared in "/index.js". Contains a json object referenced at "/lang/string_en.json"
				that contains all system messages.
*/

var express = require('express');
var bodyParser = require('body-parser');

var app = express();

//cargar rutas
var user_routes = require('./routes/UserRoutes');
var artist_routes = require('./routes/ArtistRoutes');
var album_routes = require('./routes/AlbumRoutes');
var song_routes = require('./routes/SongRoutes');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//configurar cabeceras http
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
	res.header('Allow', 'GET, POST, PUT, DELETE');
	next();
});

//rutas base
app.use('/api', user_routes);
app.use('/api', artist_routes);
app.use('/api', album_routes);
app.use('/api', song_routes);

module.exports = app;