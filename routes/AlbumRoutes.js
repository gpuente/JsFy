'use strict'

var express = require('express');
var AlbumController = require('../controllers/AlbumController');
var multipart = require('connect-multiparty');
var config = require('config');

var mdAuth = require('../middlewares/auth');
var mdUpload = multipart({uploadDir: config.get('dir.album_images')});

var api = express.Router();

api.get('/album/:id', mdAuth.checkApiAuth, AlbumController.getAlbum);
api.post('/album', mdAuth.checkApiAuth, AlbumController.saveAlbum);

module.exports = api;