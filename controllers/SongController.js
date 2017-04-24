'use strict'

var fs = require('fs');
var path = require('path');
var config = require('config');
var Artist = require('../models/Artist');
var Album = require('../models/Album');
var Song = require('../models/Song');

async function getSong(req, res){
	try{
		var song = await Song.findById(req.params.id).populate({path: 'album', populate: {path: 'artist', model: 'Artist'}}).exec();
		if(!song) return res.status(404).send({message: global.st.song_get_not_exist});
		res.status(200).send({song: song});
	}catch(err){
		res.status(500).send({message: global.st.song_get_error});
	}
}

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

async function getSongsByAlbum(req, res){
	try{
		var songs = await Song.find({album: req.params.id})
							.sort('number')
							.populate({path: 'album', 
										populate: {
												path: 'artist', 
												model: 'Artist'}
											})
							.exec();
		if(songs.length == 0) return res.status(404).send({message: global.st.songsbyalbum_album_not_exist});
		res.status(200).send({songs: songs});
	}catch(err){
		res.status(500).send({message: global.st.songsbyalbum_error});
	}
}

async function getSongs(req, res){
	try{
		var page = 1;
		var itemsPerPage = config.get('song.items_per_page');

		if(req.params.page) page = req.params.page;
		var options = {
			page: page,
			limit: itemsPerPage,
			sort: 'album number',
			populate: {
				path: 'album',
				populate: {
					path: 'artist',
					model: 'Artist'
				}
			}
		};
		var pagination = await Song.paginate({}, options);
		if(!pagination) return res.status(404).send({message: global.st.songs_get_not_found});
		res.status(200).send({
			total: pagination.total,
			limit: pagination.limit,
			page: pagination.page,
			pages: pagination.pages,
			songs: pagination.docs
		});
	}catch(err){
		res.status(500).send({message: global.st.songs_get_error});
	}
}

async function updateSong(req, res){
	try {
		if(req.body._id) delete req.body._id;
		if(req.body.file) delete req.body.file;
		if(req.body.album) delete req.body.album;
		var song = await Song.findByIdAndUpdate(req.params.id, req.body);
		if(!song) return res.status(404).send({message: global.st.song_update_not_exist});
		res.status(200).send({song: song});
	}catch(err){
		res.status(500).send({message: global.st.song_update_error});
	}
}

async function deleteSong(req, res){
	try {
		var song = await Song.findByIdAndRemove(req.params.id);
		if(!song) return res.status(404).send({message: global.st.song_delete_not_exist});
		res.status(200).send({song: song});
	} catch (err) {
		res.status(500).send({message: global.st.song_delete_error});
	}
}

async function uploadFileSong(req, res){
	try {
		var fileName = null;
		if(!req.files.song) return res.status(206).send({message: global.st.song_upload_file_missing});
		var fileSplit = req.files.song.path.split(path.sep);
		var fileFullName = fileSplit[fileSplit.length - 1];
		var fileName = fileFullName.split('\.')[0];
		var fileExt = fileFullName.split('\.')[1];
		var isValidExt = false;
		
		for(var i = 0; i < config.get('dir.file_song_ext_supported').length; i++){
			if(config.get('dir.file_song_ext_supported')[i] == fileExt) isValidExt = true;
		}
		if(!isValidExt) return res.status(200).send({message: global.st.song_upload_file_ext_err});
		var song = await Song.findByIdAndUpdate(req.params.id, {file: fileFullName});
		if(!song) return res.status(404).send({message: global.st.song_upload_file_not_exist});
		res.status(200).send({song: song});
	} catch (err) {
		res.status(500).send({message: global.st.song_upload_file_err});
	}
}

function getFileSong(req, res){
	var songFile = req.params.song;
	var pathFile = config.get('dir.song_file') + songFile;
	if(!fs.existsSync(pathFile)) return res.status(404).send({message: global.st.song_get_file_not_exist});
	res.sendFile(path.resolve(pathFile));
}

function _isValidSong(song){
	if(song.name != null && song.number != null && song.duration != null && song.album != null){
		return true;
	}else{
		return false;
	}
}

module.exports = {
	saveSong,
	getSong,
	getSongsByAlbum,
	getSongs,
	updateSong,
	deleteSong,
	uploadFileSong,
	getFileSong
}