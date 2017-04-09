'use strict'

var express = require('express');
var UserController = require('../controllers/UserController');

var api = express.Router();

api.get('/prueba-controlador', UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);

module.exports = api;