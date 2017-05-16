process.env.NODE_ENV = 'test';

let mongoose = require('mongoose');
let Album = require('../models/Album');
let Artist = require('../models/Artist');
let bcrypt = require('bcrypt-nodejs');
let config = require('config');
let fs = require('fs');
let faker = require('faker');
let testArtist = require('./artists');
let findRemoveSync = require('find-remove');
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


	afterEach((done) => {
		var users = findRemoveSync(config.get('dir.user_images'), {extensions: ['.jpg','.bad']});
		var artists = findRemoveSync(config.get('dir.artist_images'), {extensions: ['.jpg','.bad']});
		var albums = findRemoveSync(config.get('dir.album_images'), {extensions: ['.jpg','.bad']});
		done();
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


	describe('/PUT album', () => {
		it('it should not edit an album with invalid id', (done) => {
			chai.request(server)
				.put('/api/album/' + 'idnotvalid')
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.album_edit_error);
					done();
				});
		});


		it('it should not edit an album with an id not registered', (done) => {
			chai.request(server)
				.put('/api/album/' + invalidOId)
				.send({description: 'new description'})
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.album_edit_not_found);
					done();
				});
		});


		it('it should not edit an album if any property is sended', (done) => {
			_createFakeAlbum().then(fakeAlbum => {
				var album = new Album(fakeAlbum);
				album.save((err, albumStored) => {
					chai.request(server)
						.put('/api/album/' + albumStored.id)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('album');
							res.body.album.should.have.property('_id').eql(albumStored.id);
							res.body.album.should.have.property('title').eql(albumStored.title);
							res.body.album.should.have.property('description').eql(albumStored.description);
							res.body.album.should.have.property('year').eql(albumStored.year);
							res.body.album.should.have.property('image').eql(albumStored.image);
							res.body.album.should.have.property('artist').eql(albumStored.artist.toString());
							done();
						});
				});
			});
		});
		

		it('it should not edit an album id', (done) => {
			_createFakeAlbum().then(fakeAlbum => {
				var album = new Album(fakeAlbum);
				album.save((err, albumStored) => {
					chai.request(server)
						.put('/api/album/' + albumStored.id)
						.send({_id: 'idnotvalid'})
						.end((err, res) => {
							res.should.have.status(500);
							res.body.should.have.a('object');
							res.body.should.have.property('message').eql(st.album_edit_error);
							Album.findById(albumStored.id, (err, albumEdited) => {
								albumEdited.id.should.be.eql(albumStored.id);
								done();
							});
						});
				});
			});
		});


		it('it should not edit album image property and artist property', (done) => {
			_createFakeAlbum().then(fakeAlbum => {
				var album = new Album(fakeAlbum);
				album.save((err, albumStored) => {
					chai.request(server)
						.put('/api/album/' + albumStored.id)
						.send({image: 'newiamage.png', artist: 'idartist'})
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('album');
							res.body.album.should.have.property('image').eql(albumStored.image);
							res.body.album.should.have.property('artist').eql(albumStored.artist.toString());
							done();
						});
				});
			});
		});


		it('it should edit an album', (done) => {
			_createFakeAlbum().then(fakeAlbum => {
				var album = new Album(fakeAlbum);
				var newAlbum = _createFakeAlbumOnly();
				album.save((err, albumStored) => {
					chai.request(server)
						.put('/api/album/' + albumStored.id)
						.send(newAlbum)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('album');
							Album.findById(albumStored.id, (err, albumEdited) => {
								albumEdited.title.should.be.eql(newAlbum.title);
								albumEdited.description.should.be.eql(newAlbum.description);
								albumEdited.year.should.be.eql(newAlbum.year);
								albumEdited.image.should.be.eql(albumStored.image);
								albumEdited.artist.should.be.eql(albumStored.artist);
								done();
							});
						});
				});
			});
		});

	});



	describe('/DELETE album', () => {
		it('it should not delete an album with invalid id', (done) => {
			chai.request(server)
				.delete('/api/album/' + 'idnotvalid')
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.album_delete_error);
					done();
				});
		});


		it('it should not delete an album with id not registered', (done) => {
			chai.request(server)
				.delete('/api/album/' + invalidOId)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.album_delete_not_found);
					done();
				});	
		});


		it('it should delete an album recursive (delete their songs)', (done) => {
			_createFakeAlbum().then(fakeAlbum => {
				var album = new Album(fakeAlbum);
				album.save((err, albumStored) => {
					chai.request(server)
						.delete('/api/album/' + albumStored.id)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('album');
							Album.findById(albumStored.id, (err, albumFound) => {
								(albumFound === null).should.be.true;
								done();
							});
						});
				});
			});
		});

	});


	describe('/POST upload-image-album', () => {
		it('it should not upload an image album if it is not sended', (done) => {
			_createFakeAlbum().then(fakeAlbum => {
				var album = new Album(fakeAlbum);
				album.save((err, albumStored) => {
					chai.request(server)
						.post('/api/upload-image-album/' + albumStored.id)
						.end((err, res) => {
							res.should.have.status(206);
							res.body.should.have.a('object');
							res.body.should.have.property('message').eql(st.album_upload_image_incomplete);
							done();
						});
				});
			});
		});


		it('it should not upload an image album if the file have an invalid image ext', (done) => {
			_createFakeAlbum().then(fakeAlbum => {
				var album = new Album(fakeAlbum);
				album.save((err, albumStored) => {
					chai.request(server)
						.post('/api/upload-image-album/' + albumStored.id)
						.attach('image', fs.readFileSync(config.get('test.dir.album_image_bad')), config.get('test.dir.album_image_bad_name'))
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('message').eql(st.album_image_error_ext);
							done();
						});
				});
			});
		});

		it('it should not upload an album image if the album id is not valid', (done) => {
			chai.request(server)
				.post('/api/upload-image-album/' + 'idnotvalid')
				.attach('image', fs.readFileSync(config.get('test.dir.album_image')), config.get('test.dir.album_image'))
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.album_image_error);
					done();
				});
		});

		it('it should not upload an album image if the album id is not registered', (done) => {
			chai.request(server)
				.post('/api/upload-image-album/' + invalidOId)
				.attach('image', fs.readFileSync(config.get('test.dir.album_image')), config.get('test.dir.album_image'))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.album_image_not_exist);
					done();
				});
		});

		it('it should upload an album image', (done) => {
			_createFakeAlbum().then(fakeAlbum => {
				var album = new Album(fakeAlbum);
				album.save((err, albumStored) => {
					chai.request(server)
						.post('/api/upload-image-album/' + albumStored.id)
						.attach('image', fs.readFileSync(config.get('test.dir.album_image')), config.get('test.dir.album_image_name'))
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('album');
							res.body.album.should.have.property('_id').eql(albumStored.id);
							Album.findById(albumStored.id, (err, albumUpdated) => {
								(fs.existsSync(config.get('dir.album_images') + albumUpdated.image)).should.be.true;
								done();
							});
						});
				});
			});
		});

	});


	describe('/GET get-image-album', () => {
		it('it should not get an image if the image requested is not valid', (done) => {
			chai.request(server)
				.get('/api/get-image-album/' + 'idnotvalid')
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.a('object');
					res.body.should.have.property('message').eql(st.album_get_image_not_exist);
					done();
				});
		});

		it('it should get an album image', (done) => {
			_createFakeAlbum().then(fakeAlbum => {
				var album = new Album(fakeAlbum);
				album.save((err, albumStored) => {
					chai.request(server)
						.post('/api/upload-image-album/' + albumStored.id)
						.attach('image', fs.readFileSync(config.get('test.dir.album_image')), config.get('test.dir.album_image_name'))
						.end((err, respost) => {
							respost.should.have.status(200);
							Album.findById(albumStored.id, (err, albumUpdated) => {
								chai.request(server)
									.get('/api/get-image-album/' + albumUpdated.image)
									.end((err,resget) => {
										resget.should.have.status(200);
										resget.should.have.header('content-type', /^image/);
										done();
									});
							});	
						});
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
				artist: String(artist.id)
			}
			resolve(album);
		}).catch((err) => {
			reject(err);
		});
	});
	return promise;
}

function _createFakeAlbumAndStore(){
	var promise = new Promise(function (resolve, reject) {
		testArtist.getNewArtist().then((artist) => {
			var album = new Album({
				title: faker.lorem.words(),
				description: faker.lorem.sentence(),
				year: 1992,
				image: 'null',
				artist: String(artist.id)
			});
			album.save((err, albumStored) => {
				resolve(albumStored);
			});
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
			year: 1990,
			image: 'null',
			artist: 'null'
		};
	return album;
}

module.exports = {
	_createFakeAlbum,
	_createFakeAlbumOnly,
	_createFakeAlbumAndStore
}