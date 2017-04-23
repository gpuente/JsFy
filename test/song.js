process.env.NODE_ENV = 'test';

let mongoose = require('mongoose');
let Album = require('../models/Album');
let Artist = require('../models/Artist');
let Song = require('../models/Song');
let config = require('config');
let fs = require('fs');
let faker = require('faker');
let testAlbum = require('./album');
let findRemoveSync = require('find-remove');
faker.locale = 'es';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

let st = require('../lang/strings_en.json');

let invalidOId = '58eeeda1c345071010095a09';


chai.use(chaiHttp);

describe('Songs:', () => {

	beforeEach((done) => {
		Song.remove({}, (err) => {
			done();
		})
	});


	afterEach((done) => {
		var users = findRemoveSync(config.get('dir.user_images'), {extensions: ['.jpg','.bad']});
		var artists = findRemoveSync(config.get('dir.artist_images'), {extensions: ['.jpg','.bad']});
		var albums = findRemoveSync(config.get('dir.album_images'), {extensions: ['.jpg','.bad']});
		var songs = findRemoveSync(config.get('dir.song_file'), {extensions: ['.mp3','.bad']});
		done();
	});


	describe('/POST song', () => {
		it('it should not create a song with missing data', (done) => {
			var song = _createFakeSongOnly();
			delete song.name;
			chai.request(server)
				.post('/api/song')
				.send(song)
				.end((err, res) => {
					res.should.have.status(206);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.song_save_incomplete);
					done();
				});
		});


		it('it should not create a song with an invalid album id', (done) => {
			var song = _createFakeSongOnly();
			song.album = 'idnotvalid';
			chai.request(server)
				.post('/api/song')
				.send(song)
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.song_save_error);
					done();
				});
		});


		it('it should not create a song with a not registered album', (done) => {
			var song = _createFakeSongOnly();
			song.album = invalidOId;
			chai.request(server)
				.post('/api/song')
				.send(song)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.song_album_not_exist);
					done();
				});
		});


		it('it should create a song', (done) => {
			testAlbum._createFakeAlbumAndStore().then(album => {
				var song = _createFakeSongOnly();
				song.album = album.id;
				chai.request(server)
					.post('/api/song')
					.send(song)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.a('object');
						res.body.should.have.property('song');
						res.body.song.should.have.property('_id');
						res.body.song.should.have.property('number').eql(song.number);
						res.body.song.should.have.property('name').eql(song.name);
						res.body.song.should.have.property('duration').eql(song.duration);
						res.body.song.should.have.property('file').eql(song.file);
						res.body.song.should.have.property('album').eql(song.album.toString());
						done();
					});
			});
		});

	});



	describe('/GET song', () => {
		it('it sould not get a song with invalid id', (done) => {
			chai.request(server)
				.get('/api/song/' + 'idnotvalid')
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.song_get_error);
					done();
				});
		});


		it('it should not get a song with id not registered', (done) => {
			chai.request(server)
				.get('/api/song/' + invalidOId)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.song_get_not_exist);
					done();
				});
		});


		it('it should get a song', (done) => {
			_createFakeSong().then(fakeSong => {
				var song = new Song(fakeSong);
				song.save((err, songStored) => {
					chai.request(server)
						.get('/api/song/' + songStored.id)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('song');
							res.body.song.should.have.property('_id').eql(songStored.id);
							res.body.song.should.have.property('number').eql(songStored.number);
							res.body.song.should.have.property('name').eql(songStored.name);
							res.body.song.should.have.property('duration').eql(songStored.duration);
							res.body.song.should.have.property('file').eql(songStored.file);
							res.body.song.should.have.property('album');
							res.body.song.album.should.have.a('object');
							res.body.song.album.should.have.property('_id').eql(songStored.album.toString());
							done();
						});
				});
			});
		});

	});

	describe('/GET songsbyalbum', () => {
		it('it should not get songs with an invalid album id', (done) => {
			chai.request(server)
				.get('/api/songsbyalbum/' + 'idnotvalid')
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.songsbyalbum_error);
					done();
				});
		});


		it('it should not get songs with an no registered album id', (done) => {
			chai.request(server)
				.get('/api/songsbyalbum/' + invalidOId)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.songsbyalbum_album_not_exist);
					done();
				});
		});


		it('it should get the songs of an album', (done) => {
			_createFakeSong().then(fakeSong => {
				var promises = [];
				for(var i = 0; i < 10; i++){
					var promise = new Promise((resolve, reject) => {
						var song = _createFakeSongOnly(1,fakeSong.album);
						var newSong = new Song(song);
						newSong.save((err, songStored) => {
							if(err) return reject(err);
							resolve(songStored);
						});
					});
					promises.push(promise);
				}
				Promise.all(promises).then(songs => {
					chai.request(server)
						.get('/api/songsbyalbum/' + fakeSong.album)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('songs');
							res.body.songs.should.have.length(10);
							res.body.songs[0].should.have.property('album');
							res.body.songs[0].album.should.have.a('object');
							res.body.songs[0].album.should.have.property('artist');
							res.body.songs[0].album.artist.should.have.a('object');
							done();
						});
				}).catch(err => {
					console.log(err);
				});

			});
		});


	});


	describe('/GET songs', () => {
		it('it should get a a list of songs', (done) => {
			_createFakeSong().then(fakeSong => {
				var promises = [];
				for(var i = 0; i < 50; i++){
					var promise = new Promise((resolve, reject) => {
						var songData = _createFakeSongOnly(1,fakeSong.album);
						var song = new Song(songData);
						song.save((err, songStored) => {
							if(err) return reject(err);
							resolve(songStored);
						});
					});
					promises.push(promise);
				}
				Promise.all(promises).then(songs => {
					chai.request(server)
						.get('/api/songs')
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('total').eql(promises.length);
							res.body.should.have.property('limit').eql(config.get('song.items_per_page'));
							res.body.should.have.property('page').eql(1);
							res.body.should.have.property('songs');
							res.body.songs.should.have.a('array');
							res.body.songs.should.have.lengthOf(config.get('song.items_per_page'));
							res.body.songs[0].should.have.property('album');
							res.body.songs[0].album.should.have.a('object');
							res.body.songs[0].album.should.have.property('artist');
							res.body.songs[0].album.artist.should.have.a('object');
							done();
						});
				});
			});
		});


		it('it should get a specific page of songs', (done) => {
			_createFakeSong().then(fakeSong => {
				var promises = [];
				for(var i = 0; i < 50; i++){
					var promise = new Promise((resolve, reject) => {
						var songData = _createFakeSongOnly(1, fakeSong.album);
						var song = new Song(songData);
						song.save((err, songStored) => {
							if(err) return reject(err);
							resolve(songStored);
						});
					});
					promises.push(promise);
				}
				Promise.all(promises).then(songs => {
					chai.request(server)
						.get('/api/songs/' + '3')
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('total').eql(promises.length);
							res.body.should.have.property('limit').eql(config.get('song.items_per_page'));
							res.body.should.have.property('page').eql('3');
							res.body.should.have.property('songs');
							res.body.songs.should.have.a('array');
							done();
						});
				});
			});
		});


		it('it should get an empty array of songs if the page requested does not exist', (done) => {
			_createFakeSong().then(fakeSong => {
				var promises = [];
				for(var i = 0; i < 20; i++){
					var promise = new Promise((resolve, reject) => {
						var songData = _createFakeSongOnly(1, fakeSong.album);
						var song = new Song(songData);
						song.save((err, songStored) => {
							if(err) return reject(err);
							resolve(songStored);
						});
					});
					promises.push(promise);
				}
				Promise.all(promises).then(songs => {
					chai.request(server)
						.get('/api/songs/' + '10000')
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('page');
							res.body.songs.should.have.lengthOf(0);
							done();
						});
				});
			});
		});
		
	});


	describe('/PUT song', () => {
		//it should not edit a song with invalid id
		it('it should not edit a song with invalid id', (done) => {
			chai.request(server)
				.put('/api/song/' + 'idnotvalid')
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.song_update_error);
					done();
				});
		});


		//it should not edit a song with no registered id
		it('it should not edit a song with no registered id', (done) => {
			chai.request(server)
				.put('/api/song/' + invalidOId)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.song_update_not_exist);
					done();
				});
		});


		//it should not edit the song id
		it('it should not edit the song id', (done) => {
			_createFakeSong().then(fakeSong => {
				var song = new Song(fakeSong);
				song.save((err, songStored) => {
					chai.request(server)
						.put('/api/song/' + songStored.id)
						.send({_id: invalidOId})
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('song');
							Song.findById(songStored.id, (err, songFound) => {
								songFound.id.should.be.eql(songStored.id);
								done();
							});
						});
				});
			});
		});



		it('it should not edit an album song', (done) => {
			_createFakeSong().then(fakeSong => {
				var song = new Song(fakeSong);
				song.save((err, songStored) => {
					chai.request(server)
						.put('/api/song/' + songStored.id)
						.send({album: invalidOId})
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('song');
							Song.findById(songStored.id, (err, songFound) => {
								songFound.album.should.be.eql(songStored.album);
								done();
							});
						});
				});
			});
		});


		//it should not edit the file song
		it('it should not edit the file song', (done) => {
			_createFakeSong().then(fakeSong => {
				var song = new Song(fakeSong);
				song.save((err, songStored) => {
					chai.request(server)
						.put('/api/song/' + songStored.id)
						.send({file: 'somefile.png'})
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('song');
							Song.findById(songStored.id, (err, songFound) => {
								songFound.file.should.be.eql(songStored.file);
								done();
							});
						});
				});
			});
		});


		//it should edit a song
		it('it should edit a song', (done) => {
			_createFakeSong().then(fakeSong => {
				var song = new Song(fakeSong);
				song.save((err, songStored) => {
					var params = {
						number: 13,
						name: 'new song name',
						duration: '15:55',
						file: 'new_file.mp3',
						artist: 'new_artist_id'
					};
					chai.request(server)
						.put('/api/song/' + songStored.id)
						.send(params)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('song');
							Song.findById(songStored.id, (err, songFound) => {
								songFound.id.should.be.eql(songStored.id.toString());
								songFound.number.should.be.eql(params.number);
								songFound.name.should.be.eql(params.name);
								songFound.duration.should.be.eql(params.duration);
								songFound.file.should.be.eql(songStored.file);
								songFound.album.should.be.eql(songStored.album);
								done();
							});
						});
				});
			});
		});

	});


	describe('/DELETE song', () => {
		//it should not delete a song with invalid id
		it('it should not delete a song with invalid id', (done) => {
			chai.request(server)
				.delete('/api/song/' + 'idnotvalid')
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.song_delete_error);
					done();
				});
		});


		//it should not delete a song with no registered id
		it('it should not delete a song with no registered id', (done) => {
			chai.request(server)
				.delete('/api/song/' + invalidOId)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.song_delete_not_exist);
					done();
				});
		});


		//it should delete a song
		it('it should delete a song', (done) => {
			_createFakeSong().then(fakeSong => {
				var song = new Song(fakeSong);
				song.save((err, songStored) => {
					chai.request(server)
						.delete('/api/song/' + songStored.id)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('song');
							Song.findById(songStored.id, (err, songDeleted) => {
								(songDeleted === null).should.be.true;
								done();
							});
						});
				});
			});
		});
	});



	describe('/POST upload-file-song', () => {
		//it should not upload a file song if is not sended
		it('it should not upload a file song if is not sended', (done) => {
			_createFakeSong().then(fakeSong => {
				var song = new Song(fakeSong);
				song.save((err, songStored) => {
					chai.request(server)
						.post('/api/upload-file-song/' + songStored.id)
						.end((err, res) => {
							res.should.have.status(206);
							res.body.should.have.a('object');
							res.body.should.have.property('message').eql(st.song_upload_file_missing);
							done();
						});
				});
			});
		});


		//it should not upload a file song with invalid ext
		it('it should not upload a file song with invalid ext', (done) => {
			_createFakeSong().then(fakeSong => {
				var song = new Song(fakeSong);
				song.save((err, songStored) => {
					chai.request(server)
						.post('/api/upload-file-song/' + songStored.id)
						.attach('song', fs.readFileSync(config.get('test.dir.song_file_bad')), config.get('test.dir.song_file_bad_name'))
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('message').eql(st.song_upload_file_ext_err);
							done();
						});
				});
			});
		});


		//it should not upload a file song if the song id is not valid
		it('it should not upload a file song if the song id is not valid', (done) => {
			_createFakeSong().then(fakeSong => {
				var song = new Song(fakeSong);
				song.save((err, songStored) => {
					chai.request(server)
						.post('/api/upload-file-song/' + 'idnotvalid')
						.attach('song', fs.readFileSync(config.get('test.dir.song_file')), config.get('test.dir.song_file_name'))
						.end((err, res) => {
							res.should.have.status(500);
							res.body.should.have.a('object');
							res.body.should.have.property('message').eql(st.song_upload_file_err);
							done();
						});
				});
			});
		});


		//it should not upload a file song if the song id is not registered
		it('it should not upload a file song if the song id is not registered', (done) => {
			_createFakeSong().then(songData => {
				var song = new Song(songData);
				song.save((err, songStored) => {
					chai.request(server)
						.post('/api/upload-file-song/' + invalidOId)
						.attach('song', fs.readFileSync(config.get('test.dir.song_file')), config.get('test.dir.song_file_name'))
						.end((err, res) => {
							res.should.have.status(404);
							res.body.should.have.a('object');
							res.body.should.have.property('message').eql(st.song_upload_file_not_exist);
							done();
						});
				});
			});
		});


		//it should upload a file song
		it('it should upload a file song', (done) => {
			_createFakeSong().then(songData => {
				var song = new Song(songData);
				song.save((err, songStored) => {
					chai.request(server)
						.post('/api/upload-file-song/' + songStored.id)
						.attach('song', fs.readFileSync(config.get('test.dir.song_file')), config.get('test.dir.song_file_name'))
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.have.a('object');
							res.body.should.have.property('song');
							res.body.song.should.have.property('_id');
							Song.findById(songStored.id, (err, songFound) => {
								(fs.existsSync(config.get('dir.song_file') + songFound.file)).should.be.true;
								done();
							});
						});
				});
			});
		});
	});



	describe('/GET get-file-song', () => {
		//it should not get a file song if the song not exist
		//it should get a file song
	});

});


/**
 * Create an artist, album in the database and returns a promise with Song data and album id set
 * 
 * @returns {promise}
 */
function _createFakeSong(){
	var promise = new Promise(function (resolve, reject) {
		testAlbum._createFakeAlbumAndStore().then(album => {
			var song = _createFakeSongOnly(1, album.id);
			resolve(song);
		}).catch((err) => {
			reject(err);
		});
	});
	return promise;
}

/**
 * Create a Song object with fake values. Return the fake song object
 * 
 * @param {number} [qty=1] Qty of songs to create, by default 1
 * @param {string} [album='null']  Album id that should have the fake song object
 * @returns {object} Song object
 */
function _createFakeSongOnly(qty = 1, album = 'null'){
	var songs = [];
	for(var i = 0; i < qty; i++){
		var song = {
			number: i + 1,
			name: faker.lorem.words(),
			duration: '2:57',
			file: 'null',
			album: album
		};
		songs.push(song);
	}
	if(qty == 1) return songs[0];
	return songs
}