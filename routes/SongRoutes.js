'use strict'

var express = require('express');
var SongController = require('../controllers/SongController');
var multipart = require('connect-multiparty');
var config = require('config');

var mdAuth = require('../middlewares/auth');
var mdUpload = multipart({uploadDir: config.get('dir.song_file')});

var api = express.Router();

api.get('/song/:id', mdAuth.checkApiAuth, SongController.getSong);
api.get('/songsbyalbum/:id', mdAuth.checkApiAuth, SongController.getSongsByAlbum);
api.get('/songs/:page?', mdAuth.checkApiAuth, SongController.getSongs);
api.post('/song', mdAuth.checkApiAuth, SongController.saveSong);
api.put('/song/:id', mdAuth.checkApiAuth, SongController.updateSong);
api.delete('/song/:id', mdAuth.checkApiAuth, SongController.deleteSong);
api.post('/upload-file-song/:id', [mdAuth.checkApiAuth, mdUpload], SongController.uploadFileSong);

module.exports = api;