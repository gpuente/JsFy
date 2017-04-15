'use strict'

var fs = require('fs');
var path = require('path');
var config = require('config');
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
		res.status(500).send({message: global.st.error_get_artist});
	}
}

async function saveArtist(req, res){
	try{
		var artist = new Artist();
		var params = req.body;
		if(!_isValidArtist(params)) return res.status(206).send({message: global.st.artist_incomplete});

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

async function getArtists(req, res){
	try{
		var page = 1;
		var itemsPerPage = config.get('artist.items_per_page');

		if(req.params.page) page = req.params.page;
		var promise = Artist.find().sort('name');
		var users = await promise;
		if(!users) return res.status(404).send({message: global.st.there_is_not_artists});
		var pagination = await Artist.paginate(users, {page: page, limit: itemsPerPage});
		if(!pagination) return res.response(500).send({message: global.st.error_get_artists});
		res.status(200).send({
			total: pagination.total,
			limit: pagination.limit,
			page: pagination.page,
			pages: pagination.pages,
			artists: pagination.docs
		});
	}catch(err){
		res.status(500).send({message: global.st.error_get_artists});
	}
}

async function updateArtist(req, res){
	try{
		var artistId = req.params.id;
		var artistData = req.body;

		var promise = Artist.findByIdAndUpdate(artistId, artistData);
		var artistUpdated = await promise;
		if(!artistUpdated) return res.status(404).send({message: global.st.artist_not_updated});
		res.status(200).send({artist: artistUpdated});
	}catch(err){
		res.status(500).send({message: global.st.error_update_artist});
	}
}

async function deleteCascadeArtist(req, res){
	try{
		var artistId = req.params.id;

		var artist = await Artist.findByIdAndRemove(artistId);
		if(!artist) return res.status(404).send({message: global.st.artist_delete_not_fount});
		var albums = await Album.find({artist: artist._id});
		if(!albums) return res.status(404).send({message: global.st.album_delete_not_found});
		var songs = [];
		for (var i = 0; i < albums.lenght ; i++) {
			var album = await Album.findByIdAndRemove(albums[i]._id);
			if(!album) continue;
			var song = await Song.find().remove({album: album._id});
			if(!song) continue;
			songs.concat(song);
		}
		res.status(200).send({artist: artist, albums: albums, songs: songs});
	}catch(err){
		res.status(500).send({message: global.st.error_delete_artist});
	}
}

async function uploadImage(req, res){
	try{
		var artistId = req.params.id;
		var fileName = null;
		if(!req.files.image) return res.status(200).send({message: global.st.upload_artist_image_not_sended});
		var fileSplit = req.files.image.path.split(config.get('dir.file_system_separator'));
		var fileFullName = fileSplit[fileSplit.length - 1];
		var fileName = fileFullName.split('\.')[0];
		var fileExt = fileFullName.split('\.')[1];
		var isValidExt = false;
		
		for (var i = 0 ; i < config.get('dir.file_image_ext_supported').length; i++) {
			if(config.get('dir.file_image_ext_supported')[i] == fileExt) isValidExt = true;
		}

		if(!isValidExt) return res.status(200).send({message: global.st.upload_artist_image_error_ext});

		var promise = Artist.findByIdAndUpdate(artistId, {image: fileFullName});
		var artistUpdated = await promise;
		if(!artistUpdated) return res.status(404).send({message: global.st.artist_image_not_updated});
		res.status(200).send({artist: artistUpdated});
	}catch(err){
		res.status(500).send({message: global.st.upload_artist_image_error});
	}
}

function getImageFile(req, res){
	var imageFile = req.params.image;
	var pathImage = config.get('dir.artist_images') + imageFile;
	if(!fs.existsSync(pathImage)) return res.status(200).send({message: global.st.get_artist_image_not_exists}); 
	res.sendFile(path.resolve(pathImage));
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
	saveArtist,
	getArtists,
	updateArtist,
	deleteCascadeArtist,
	uploadImage,
	getImageFile
};