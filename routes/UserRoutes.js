'use strict'

var express = require('express');
var UserController = require('../controllers/UserController');
var multipart = require('connect-multiparty');
var config = require('config');

var mdAuth = require('../middlewares/auth');
var mdUpload = multipart({uploadDir: config.get('dir.user_images')});

var api = express.Router();

api.get('/prueba-controlador', mdAuth.checkApiAuth, UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.put('/user/:id', mdAuth.checkApiAuth, UserController.updateUser);
api.post('/upload-image-user/:id', [mdAuth.checkApiAuth, mdUpload], UserController.uploadImage);
api.get('/get-image-user/:image', UserController.getImageFile);

module.exports = api;