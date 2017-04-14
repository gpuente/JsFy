process.env.NODE_ENV = 'test';

let mongoose = require('mongoose');
let Artist = require('../models/Artist');
let bcrypt = require('bcrypt-nodejs');
let config = require('config');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

let st = require('../lang/strings_en.json');

let qtyArtists = 30;

chai.use(chaiHttp);

describe('Artists:', () => {

	beforeEach((done) => {
		Artist.remove({}, (err) => {
			done();
		})
	});


	describe('/POST artist', () => {
		it('it should not create an artist with missing data', (done) => {
			let artist = {name: 'La ley'};
			chai.request(server)
				.post('/api/artist')
				.send(artist)
				.end((err, res) => {
					res.should.have.status(206);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.artist_incomplete);
					done();
				});
		});


		it('it should not create an artist duplicated', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artist) => {
				chai.request(server)
				.post('/api/artist')
				.send(artist)
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.error_new_artist);
					done();
				});
			});
		});


		it('it should create an artist', (done) => {
			let artist = {
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			};
			chai.request(server)
			.post('/api/artist')
			.send(artist)
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.have.a('object');
				res.body.should.have.property('artist');
				res.body.artist.should.have.property('name').eql(artist.name);
				res.body.artist.should.have.property('description').eql(artist.description);
				res.body.artist.should.have.property('_id');
				done();
			});
		});


	});



	describe('/GET artist', () => {
		it('it should not get an artist with invalid id', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artist) => {
				chai.request(server)
				.get('/api/artist/' + 'idnotvalid')
				.send()
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.error_get_artist);
					done();
				});
			});
		});


		it('it should not get an artist with not registered id', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artist) => {
				chai.request(server)
				.get('/api/artist/' + '58eeeda1c345071010095a09')
				.send()
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.artist_does_not_exist);
					done();
				});
			});
		});


		it('it should get an artist', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artist) => {
				chai.request(server)
				.get('/api/artist/' + artist.id)
				.send()
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.artist.should.have.property('name').eql(artist.name);
					res.body.artist.should.have.property('description').eql(artist.description);
					res.body.artist.should.have.property('_id');
					done();
				});
			});
		});

		
	});



	describe('/GET artists', () => {
		it('it should get a list of artists', (done) => {
			var promise = _createArtists(qtyArtists);
			promise.then(function (artists) {
				chai.request(server)
				.get('/api/artists')
				.send()
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('total').eql(qtyArtists);
					res.body.should.have.property('limit').eql(config.get('artist.items_per_page'));
					res.body.should.have.property('page').eql(1);
					res.body.should.have.property('artists').lengthOf(config.get('artist.items_per_page'));
					done();
				});
			}).catch(function(err){
				console.log(err);
			});
		});		


		it('it should get a specific page of artists result', (done) => {
			var promise = _createArtists(qtyArtists);
			promise.then(function (artists) {
				chai.request(server)
				.get('/api/artists/2')
				.send()
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('total').eql(qtyArtists);
					res.body.should.have.property('limit').eql(config.get('artist.items_per_page'));
					res.body.should.have.property('page').eql('2');
					res.body.should.have.property('artists').lengthOf(config.get('artist.items_per_page'));
					done();
				});
			}).catch(function(err){
				console.log(err);
			});
		});		


		it('it should get an empty page when the page not exist', (done) => {
			var promise = _createArtists(qtyArtists);
			promise.then(function (artists) {
				chai.request(server)
				.get('/api/artists/10000')
				.send()
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('total').eql(qtyArtists);
					res.body.should.have.property('limit').eql(config.get('artist.items_per_page'));
					res.body.should.have.property('page').eql('10000');
					res.body.should.have.property('artists').lengthOf(0);
					done();
				});
			}).catch(function(err){
				console.log(err);
			});
		});		
	});


	describe('/PUT artist', () => {
		it('it should not change an artist with invalid id', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artist) => {
				chai.request(server)
				.put('/api/artist/' + 'idnotvalid')
				.send({description: 'Old chilean rock'})
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.error_update_artist);
					done();
				});
			});
		});


		it('it should not change an artist with not registered id', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artist) => {
				chai.request(server)
				.put('/api/artist/' + '58eeeda1c345071010095a09')
				.send({description: 'Old chilean rock'})
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.artist_not_updated);
					done();
				});
			});
		});


		it('it should not change name artist with a name of aother artist', (done) => {
			let artist = {
				name: 'Artist 0',
				description: 'Description 0',
				image: 'cover.png'
			};
			var promise = _createArtists(qtyArtists);
			promise.then(function (artists) {
				chai.request(server)
				.put('/api/artist/' + artists[2].id)
				.send(artist)
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.property('message').eql(st.error_update_artist);
					done();
				});
			});	
		});


		it('it should change an artist', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artistSaved) => {
				chai.request(server)
				.put('/api/artist/' + artistSaved.id)
				.send({description: 'Rock'})
				.end((err,res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('artist');
					Artist.findById(artistSaved.id, (err, artistFound) => {
						artistFound.description.should.be.eql('Rock');
						done();
					});
				});
			});
		});

	});




	describe('/DELETE artist', () => {
		it('it should not delete an artist with invalid id', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artistSaved) => {
				chai.request(server)
				.delete('/api/artist/' + 'idnotvalid')
				.send()
				.end((err,res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.error_delete_artist);
					done();
				});
			});
		});


		it('it should not delete an artist with not registered id', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artistSaved) => {
				chai.request(server)
				.delete('/api/artist/' + '58eeeda1c345071010095a09')
				.send()
				.end((err,res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.artist_delete_not_fount);
					done();
				});
			});
		});


		it('it should delete an artist', (done) => {
			let artist = new Artist({
				name: 'Lucybell',
				description: 'Rock Chileno',
				image: 'cover.png'
			});
			artist.save((err, artistSaved) => {
				chai.request(server)
				.delete('/api/artist/' + artist.id)
				.send()
				.end((err,res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('artist');
					Artist.findById(artistSaved.id, (err, artistFound) => {
						(artistFound === null).should.to.be.true;
						done();
					});	
				});
			});
		});


	});

});


async function _createArtists(numOfArtists){
	var artists = [];
	for (var i = 0; i < numOfArtists; i++) {
		let artist = new Artist({
			name: 'Artist ' + i,
			description: 'Description ' + i,
			image: 'cover' + i + '.png'
		});
		artists.push(await artist.save());	
	}
	return artists;
}