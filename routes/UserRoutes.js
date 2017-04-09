'use strict'

var express = require('express');
var UserController = require('../controllers/UserController');
var multipart = require('connect-multiparty');

var mdAuth = require('../middlewares/auth');
var mdUpload = multipart({uploadDir: global.config.dir.user_images});

var api = express.Router();

api.get('/prueba-controlador', mdAuth.checkApiAuth, UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.put('/update-user/:id', mdAuth.checkApiAuth, UserController.updateUser);
api.post('/upload-image-user/:id', [mdAuth.checkApiAuth, mdUpload], UserController.uploadImage);

module.exports = api;