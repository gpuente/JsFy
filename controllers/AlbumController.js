'use strict'

var fs = require('fs');
var path = require('path');
var config = require('config');
var Artist = require('../models/Artist');
var Album = require('../models/Album');
var Song = require('../models/Song');

async function getAlbum(req, res){
	try{
		var album = await Album.findById(req.params.id).populate({path: 'artist'}).exec();
		if(!album) return res.status(404).send({message: global.st.album_does_not_exist});
		res.status(200).send({album: album});
	}catch(err){
		res.status(500).send({message: global.st.album_get_error});
	}
}

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

async function getAlbumsByArtist(req, res){
	try{
		var albums = await Album
							.find({artist: req.params.id})
							.sort('year')
							.populate({path: 'artist'})
							.exec();
		if(albums.length == 0) return res.status(404).send({message: global.st.albums_does_not_exists});
		res.status(200).send({albums});
	}catch(err){
		res.status(500).send({message: global.st.album_get_error});
	}
}

async function getAlbums(req, res){
	try{
		var page = 1;
		if(req.params.page) page = req.params.page;
		var albums = await Album
							.find()
							.sort('year')
							.populate({path: 'artist'})
							.exec();
		if(albums.length == 0) return res.status(404).send({message: global.st.albums_does_not_exists});
		var paginate = await Album.paginate(albums, {page: page, limit: config.get('album.items_per_page')});
		if(!paginate) return res.status(500).send({message: global.st.album_get_error});
		res.status(200).send({
			total: paginate.total,
			limit: paginate.limit,
			page: paginate.page,
			pages: paginate.pages,
			albums: paginate.docs
		});
	}catch(err){
		res.status(500).send({message: global.st.album_get_error});
	}
}

async function editAlbum(req, res){
	try{
		if(req.body.image) delete req.body.image;
		if(req.body.artist) delete req.body.artist;
		var album = await Album.findByIdAndUpdate(req.params.id, req.body);
		if(!album) return res.status(404).send({message: global.st.album_edit_not_found});
		res.status(200).send({album: album});
	}catch(err){
		res.status(500).send({message: global.st.album_edit_error});
	}
}

async function deleteAlbum(req, res){
	try{
		var album = await Album.findByIdAndRemove(req.params.id);
		if(!album) return res.status(404).send({message: global.st.album_delete_not_found});
		var songs = await Album.findByIdAndRemove(album.id);
		res.status(200).send({album: album, songs: songs});
	}catch(err){
		res.status(500).send({message: global.st.album_delete_error});
	}
}

async function uploadImage(req, res){
	try{
		var albumId = req.params.id;
		var fileName = null;
		if(!req.files.image) return res.status(206).send({message: global.st.album_upload_image_incomplete});
		var fileSplit = req.files.image.path.split(path.sep);
		var fileFullName = fileSplit[fileSplit.length - 1];
		var fileName = fileFullName.split('\.')[0];
		var fileExt = fileFullName.split('\.')[1];
		var isValidExt = false;
		
		for (var i = 0 ; i < config.get('dir.file_image_ext_supported').length; i++) {
			if(config.get('dir.file_image_ext_supported')[i] == fileExt) isValidExt = true;
		}

		if(!isValidExt) return res.status(200).send({message: global.st.album_image_error_ext});

		var promise = Album.findByIdAndUpdate(albumId, {image: fileFullName});
		var albumUpdated = await promise;
		if(!albumUpdated) return res.status(404).send({message: global.st.album_image_not_exist});
		res.status(200).send({album: albumUpdated});
	}catch(err){
		res.status(500).send({message: global.st.album_image_error});
	}
}

function getImageFile(req, res){
	var imageFile = req.params.image;
	var pathImage = config.get('dir.album_images') + imageFile;
	if(!fs.existsSync(pathImage)) return res.status(404).send({message: global.st.album_get_image_not_exist}); 
	res.sendFile(path.resolve(pathImage));
}


function _isValidAlbum(params){
	if(params.title != null && params.year != null && params.artist != null){
		return true;
	}else{
		return false;
	}
}

module.exports = {
	getAlbum,
	saveAlbum,
	getAlbumsByArtist,
	getAlbums,
	editAlbum,
	deleteAlbum,
	uploadImage,
	getImageFile
}