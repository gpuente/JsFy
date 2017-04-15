'use strict'

var express = require('express');
var ArtistController = require('../controllers/ArtistController');
var multipart = require('connect-multiparty');
var config = require('config');

var mdAuth = require('../middlewares/auth');
var mdUpload = multipart({uploadDir: config.get('dir.user_images')});

var mdAuth = require('../middlewares/auth');
var mdUpload = multipart({uploadDir: config.get('dir.artist_images')});

var api = express.Router();

api.get('/artist/:id', mdAuth.checkApiAuth, ArtistController.getArtist);
api.post('/artist', mdAuth.checkApiAuth, ArtistController.saveArtist);
api.get('/artists/:page?', mdAuth.checkApiAuth, ArtistController.getArtists);
api.put('/artist/:id', mdAuth.checkApiAuth, ArtistController.updateArtist);
api.delete('/artist/:id', mdAuth.checkApiAuth, ArtistController.deleteCascadeArtist);
api.post('/upload-image-artist/:id', [mdAuth.checkApiAuth, mdUpload], ArtistController.uploadImage);
api.get('/get-image-artist/:image', ArtistController.getImageFile);

module.exports = api;