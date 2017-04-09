'use strict'

var fs = require('fs');
var path = require('path');
var Artist = require('../models/Artist');
var Album = require('../models/Album');
var Song = require('../models/Song');

async function getArtist(req, res){
	try{
		var artistId = req.params.id;
		var promise = Artist.findById(artistId);
		var artist = await promise;
		if(!artist) return res.status(404).send({message: global.st.artist_does_not_exist});
		res.status(200).send({artist: artist});
	}catch(err){
		res.status(500).send({messgae: global.st.error_get_artist});
	}
}

async function saveArtist(req, res){
	try{
		var artist = new Artist();
		var params = req.body;
		if(!_isValidArtist(params)) return res.status(200).send({message: global.st.artist_incomplete});

		artist.name = params.name;
		artist.description = params.description;
		artist.image = 'null';

		var promise = artist.save();
		var artistStored = await promise;
		if(!artistStored) return res.status(404).send({message: global.st.artist_no_registered});
		res.status(200).send({artist: artistStored});

	}catch(err){
		res.status(500).send({message: global.st.error_new_artist});
	}
}

function _isValidArtist(params){
	if(params.name != null && params.description != null){
		return true;
	}else{
		return false;
	}
}

module.exports = {
	getArtist,
	saveArtist
};