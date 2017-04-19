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

});


function _createFakeSong(qty = 1){
	var promises = [];
	var songs = _createFakeSongOnly(qty);
	testAlbum._createFakeAlbum().then(album => {
		for(i = 0; i < songs.length; i++){
			songs[i].album = album.id;
			promises.push(new Song(songs[i]).save());
		}
		return promises;
	});	
}

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