process.env.NODE_ENV = 'test';

let mongoose = require('mongoose');
let User = require('../models/User');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

let st = require('../lang/strings_en.json');

chai.use(chaiHttp);

describe('Users', () => {

	beforeEach((done) => {
		User.remove({}, (err) => {
			done();
		})
	});

	describe('/POST register', () => {
		it('it no should register a new user without required data', (done) => {
			let user = {
				name: "Alfredo Ramirez",
				surname: "aramirez"
			};
			chai.request(server)
				.post('/api/register')
				.send(user)
				.end((err, res) => {
					res.should.have.status(206);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.user_incomplete);
					done();
				});
		});

		it('it should register a new user', (done) => {
			let user = {
				name: "Alfredo Ramirez",
				surname: "aramirez",
				email: "aramirez@gmail.com",
				password: "123456"
			};
			chai.request(server)
				.post('/api/register')
				.send(user)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('user');
					res.body.user.should.have.property('image').eql('null');
					res.body.user.should.have.property('name').eql('Alfredo Ramirez');
					res.body.user.should.have.property('surname').eql('aramirez');
					res.body.user.should.have.property('email').eql('aramirez@gmail.com');
					res.body.user.should.have.property('role').eql('ROLE_ADMIN');
					res.body.user.should.have.property('image').eql('null');
					res.body.user.should.have.property('password');
					done();
				});
		});
	});



	describe('/POST login', () => {
		it('it should not loggin a user with missing data',(done) => {
			let user = {
				email: "usernotexist@gmail.com"
			};
			chai.request(server)
				.post('/api/login')
				.send(user)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.user_password_incorrect);
					done();
				});
		});


		it('it should not loggin a user with incorrect credentialas', (done) => {
			let user = new User({
				name: 'Fran Chain',
				surname: 'fchain',
				email: 'fchain@gmail.com',
				password: '123456',
				role: 'ROLE_ADMIN',
				image: 'image.png'
			});
			user.save((err, user) => {
				chai.request(server)
				.post('/api/login')
				.send({email: 'fchain@gmail.com', password: '123'})
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.user_password_incorrect);
					done();
				});
			});
		});


		it('it should login a user with right credentials and return data user if token is not requested', (done) => {
			let user = new User({
				name: 'Fran Chain',
				surname: 'fchain',
				email: 'fchain@gmail.com',
				password: '123456',
				role: 'ROLE_ADMIN',
				image: 'image.png'
			});
			user.save((err, user) => {
				chai.request(server)
				.post('/api/login')
				.send({email: 'fchain@gmail.com', password: '123456'})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('user');
					res.body.user.should.have.property('_id');
					res.body.user.should.have.property('email').eql(user.email);
					res.body.user.should.have.property('name').eql(user.name);
					done();
				});
			});
		});



	});

});