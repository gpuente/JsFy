'use strict'

var fs = require('fs');
var path = require('path');
var config = require('config');
var Artist = require('../models/Artist');
var Album = require('../models/Album');
var Song = require('../models/Song');

async function saveSong(req, res){
	try{
		if(!_isValidSong(req.body)) return res.status(206).send({message: global.st.song_save_incomplete});
		var album = await Album.findById(req.body.album);
		if(!album) return res.status(404).send({message: global.st.song_album_not_exist});
		var song = new Song(req.body);
		song.image = 'null';
		var songStored = await song.save();
		if(!songStored) return res.status(500).send({message: global.st.song_save_error});
		res.status(200).send({song: songStored});
	}catch(err){
		res.status(500).send({message: global.st.song_save_error});
	}
}

function _isValidSong(song){
	if(song.name != null && song.number != null && song.duration != null && song.album != null){
		return true;
	}else{
		return false;
	}
}

module.exports = {
	saveSong
}