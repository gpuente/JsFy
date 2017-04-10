'use strict'

var express = require('express');
var ArtistController = require('../controllers/ArtistController');
var multipart = require('connect-multiparty');

var mdAuth = require('../middlewares/auth');
var mdUpload = multipart({uploadDir: global.config.dir.user_images});

var api = express.Router();

api.get('/artist/:id', mdAuth.checkApiAuth, ArtistController.getArtist);
api.post('/artist', mdAuth.checkApiAuth, ArtistController.saveArtist);
api.get('/artists/:page?', mdAuth.checkApiAuth, ArtistController.getArtists);
api.put('/update-artist/:id', mdAuth.checkApiAuth, ArtistController.updateArtist);
api.delete('/artist/:id', mdAuth.checkApiAuth, ArtistController.deleteCascadeArtist);

module.exports = api;