'use strict'

var express = require('express');
var SongController = require('../controllers/SongController');
var multipart = require('connect-multiparty');
var config = require('config');

var mdAuth = require('../middlewares/auth');
//var mdUpload = multipart({uploadDir: config.get('dir.album_images')});

var api = express.Router();

api.get('/song/:id', mdAuth.checkApiAuth, SongController.getSong);
api.post('/song', mdAuth.checkApiAuth, SongController.saveSong);

module.exports = api;