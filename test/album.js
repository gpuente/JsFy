process.env.NODE_ENV = 'test';

let mongoose = require('mongoose');
let Album = require('../models/Album');
let Artist = require('../models/Artist');
let bcrypt = require('bcrypt-nodejs');
let config = require('config');
let fs = require('fs');
let faker = require('faker');
let testArtist = require('./artists');
faker.locale = 'es';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

let st = require('../lang/strings_en.json');

let invalidOId = '58eeeda1c345071010095a09';


chai.use(chaiHttp);

describe('Album:', () => {

	beforeEach((done) => {
		Album.remove({}, (err) => {
			Artist.remove({}, (err) => {
				done();
			});
		})
	});


	describe('/POST album', () => {
		it('it should not register an incomplete album', (done) => {
			_createFakeAlbum().then((album) => {
				delete album.title;
				chai.request(server)
					.post('/api/album')
					.send(album)
					.end((err, res) => {
						res.should.have.status(206);
						res.body.should.have.a('object');
						res.body.should.have.property('message').eql(st.album_incomplete);
						done();
					});
			});
		});


		it('it should not register an album with a invalid artist reference id', (done) => {
			_createFakeAlbum().then((album) => {
				album.artist = 'idnotvalid';
				chai.request(server)
					.post('/api/album')
					.send(album)
					.end((err, res) => {
						res.should.have.status(500);
						res.body.should.have.a('object');
						res.body.should.have.property('message').eql(st.album_error_save);
						done();
					});
			});
		});


		it('it should not register an album with a not registered artist reference id', (done) => {
			_createFakeAlbum().then((album) => {
				album.artist = invalidOId;
				chai.request(server)
					.post('/api/album')
					.send(album)
					.end((err, res) => {
						res.should.have.status(206);
						res.body.should.have.a('object');
						res.body.should.have.property('message').eql(st.album_invalid_artist);
						done();
					});
			});
		});


		it('it should register a new album', (done) => {
			_createFakeAlbum().then((album) => {
				chai.request(server)
					.post('/api/album')
					.send(album)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.a('object');
						res.body.should.have.property('album');
						res.body.album.should.have.property('_id');
						res.body.album.should.have.property('title').eql(album.title);
						res.body.album.should.have.property('description').eql(album.description);
						res.body.album.should.have.property('year').eql(album.year);
						res.body.album.should.have.property('image').eql(album.image);
						res.body.album.should.have.property('artist').eql(album.artist);
						done();
					});
			});
		});
	});



});

function _createFakeAlbum(){
	var promise = new Promise(function (resolve, reject) {
		testArtist.getNewArtist().then((artist) => {
			var album = {
				title: faker.lorem.words(),
				description: faker.lorem.sentence(),
				year: 1992,
				image: 'null',
				artist: artist.id
			}
			resolve(album);
		}).catch((err) => {
			reject(err);
		});
	});
	return promise;
}