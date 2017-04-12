process.env.NODE_ENV = 'test';

let mongoose = require('mongoose');
let User = require('../models/User');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);

describe('Users', () => {

	beforeEach((done) => {
		User.remove({}, (err) => {
			done();
		})
	});

	describe('/POST user', () => {
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

});