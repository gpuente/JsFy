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

let qtyAlbums = 30;

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



	describe('/GET album', () => {
		it('it should not get an album with invalid id', (done) => {
			chai.request(server)
				.get('/api/album/' + 'idnotvalid')
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.album_get_error);
					done();
				});
		});


		it('it should not get an album with id not registered', (done) => {
			chai.request(server)
				.get('/api/album/' + invalidOId)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.album_does_not_exist);
					done();
				});
		});


		it('it should get an album', (done) => {
			_createFakeAlbum().then((fakeAlbum) => {
				album = new Album(fakeAlbum);
				album.save((err, albumStored) => {
					chai.request(server)
						.get('/api/album/' + albumStored.id)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('album');
							res.body.album.should.have.property('artist');
							res.body.album.artist.should.have.property('_id').eql(albumStored.artist.toString());
							res.body.album.should.have.property('title').eql(albumStored.title);
							res.body.album.should.have.property('description').eql(albumStored.description);
							res.body.album.should.have.property('year').eql(albumStored.year);
							res.body.album.should.have.property('image').eql(albumStored.image);
							done();
						});
				});
			});
		});

	});



	describe('/GET albumsbyartist', () => {
		it('it should not get the albums if the artist id is invalid', (done) => {
			chai.request(server)
				.get('/api/albumsbyartist/' + 'idnotvalid')
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.album_get_error);
					done();
				});
		});


		it('it should not get the albums if the artist id is not registered', (done) => {
			chai.request(server)
				.get('/api/albumsbyartist/' + invalidOId)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.albums_does_not_exists);
					done();
				});
		});


		it('it should get the albums of an artist', (done) => {
			_createFakeAlbum().then((album) => {
				var album2 = _createFakeAlbumOnly();
				var album3 = _createFakeAlbumOnly();
				album2.artist = album.artist;
				album3.artist = album.artist;
				var promises = [];
				promises.push(new Album(album).save());
				promises.push(new Album(album2).save());
				promises.push(new Album(album3).save());
				Promise.all(promises).then(albums => {
					chai.request(server)
						.get('/api/albumsbyartist/' + album.artist)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('albums');
							res.body.albums.should.have.lengthOf(3);
							res.body.albums[0].should.have.property('_id');
							res.body.albums[0].artist.should.have.a('object');
							res.body.albums[0].should.have.property('artist');
							res.body.albums[0].artist.should.have.property('_id').eql(album.artist);
							done();
						});
				});
			});
		});

	});



	describe('/GET albums', () => {
		it('it should not get albums if not exist any album', (done) => {
			chai.request(server)
				.get('/api/albums/')
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.albums_does_not_exists);
					done();
				});
		});
		

		it('it should get albums paginated', (done) => {
			var promises = [];
			var max = qtyAlbums;
			var cnt = 0;

			_createFakeAlbum().then(function callback(album) {
				promises.push(new Album(album).save());
				if(++cnt < max){
					_createFakeAlbum().then(callback);
				}else{
					Promise.all(promises).then(albums => {
						chai.request(server)
							.get('/api/albums/')
							.end((err, res) => {
								res.should.have.status(200);
								res.body.should.have.a('object');
								res.body.should.have.property('total').eql(qtyAlbums);
								res.body.should.have.property('limit').eql(config.get('album.items_per_page'));
								res.body.should.have.property('page').eql(1);
								res.body.should.have.property('pages');
								res.body.should.have.property('albums');
								res.body.albums.should.have.a('array');
								done();
							});
					});
				}
			});
			
		});


		it('it should get albums page requested', (done) => {
			var promises = [];
			var max = qtyAlbums;
			var cnt = 0;

			_createFakeAlbum().then(function callback(album) {
				promises.push(new Album(album).save());
				if(++cnt < max){
					_createFakeAlbum().then(callback);
				}else{
					Promise.all(promises).then(albums => {
						chai.request(server)
							.get('/api/albums/3')
							.end((err, res) => {
								res.should.have.status(200);
								res.body.should.have.a('object');
								res.body.should.have.property('total').eql(qtyAlbums);
								res.body.should.have.property('limit').eql(config.get('album.items_per_page'));
								res.body.should.have.property('page').eql('3');
								res.body.should.have.property('pages');
								res.body.should.have.property('albums');
								res.body.albums.should.have.a('array');
								done();
							});
					});
				}
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
				artist: String(artist.id)
			}
			resolve(album);
		}).catch((err) => {
			reject(err);
		});
	});
	return promise;
}

function _createFakeAlbumOnly(){
	var album = {
			title: faker.lorem.words(),
			description: faker.lorem.sentence(),
			year: 1992,
			image: 'null',
			artist: 'null'
		};
	return album;
}