'use strict'

var fs = require('fs');
var path = require('path');
var config = require('config');
var Artist = require('../models/Artist');
var Album = require('../models/Album');
var Song = require('../models/Song');

async function saveAlbum(req, res){
	try{
		if(!_isValidAlbum(req.body)) return res.status(206).send({message: global.st.album_incomplete});
		var artist = await Artist.findById(req.body.artist);
		if(!artist) return res.status(206).send({message: global.st.album_invalid_artist});
		var album = new Album(req.body);
		album.image = 'null';
		var albumStored = await album.save();
		if(!albumStored) return res.status(404).send({message: global.st.album_not_registered});
		res.status(200).send({album: albumStored});
	}catch(err){
		res.status(500).send({message: global.st.album_error_save});
	}
}

function _isValidAlbum(params){
	if(params.title != null && params.year != null && params.artist != null){
		return true;
	}else{
		return false;
	}
}

module.exports = {
	saveAlbum
}