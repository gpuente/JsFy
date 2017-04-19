process.env.NODE_ENV = 'test';

let mongoose = require('mongoose');
let User = require('../models/User');
let bcrypt = require('bcrypt-nodejs');
let fs = require('fs');
let faker = require('faker');
let config = require('config');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();
let findRemoveSync = require('find-remove');

let st = require('../lang/strings_en.json');

chai.use(chaiHttp);

describe('Users:', () => {

	beforeEach((done) => {
		User.remove({}, (err) => {
			done();
		})
	});
	/*
	afterEach((done) => {
		var albums = findRemoveSync(config.get('dir.user_images'), {extensions: ['.jpg','.bad']});
		done();
	});
	*/

	describe('/POST register', () => {
		it('it should not register a new user without required data', (done) => {
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

		it('it should not register a duplicated user', (done) => {
			let user = new User({
				name: 'Fran Chain',
				surname: 'fchain',
				email: 'fchain@gmail.com',
				password: '123456',
				role: 'ROLE_ADMIN',
				image: 'image.png'
			});
			user.save();
			chai.request(server)
				.post('/api/register')
				.send(user)
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.user_no_registered);
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
					(bcrypt.compareSync(user.password, res.body.user.password)).should.to.be.true;
					done();
				});
		});
	});



	describe('/POST login', () => {
		it('it should not login a user with missing data',(done) => {
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


		it('it should not login a user with incorrect credentialas', (done) => {
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
					res.body.user.password.should.be.eql(user.password);
					done();
				});
			});
		});


		it('it should login a user with right credentials and return token requested', (done) => {
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
				.send({email: 'fchain@gmail.com', password: '123456', gethash: 'true'})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('token');
					done();
				});
			});
		});

	});


	describe('/PUT user', () => {
		it('it should not update an user with invalid user id', (done) => {
			let user = new User({
				name: 'Fran Chain',
				surname: 'fchain',
				email: 'fchain@gmail.com',
				password: '123456',
				role: 'ROLE_ADMIN',
				image: 'image.png'
			});
			user.save();
			chai.request(server)
				.put('/api/user/' + 'notvalidid')
				.send({name: 'Fran Kum', surname: 'fkun'})
				.end((err, res) => {
					res.should.have.status(500);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.error_update_user);;
					done();
				});

		});


		it('it should not update an user with id user not registered', (done) => {
			let user = new User({
				name: 'Fran Chain',
				surname: 'fchain',
				email: 'fchain@gmail.com',
				password: '123456',
				role: 'ROLE_ADMIN',
				image: 'image.png'
			});
			user.save();
			chai.request(server)
				.put('/api/user/' + '58eeeda1c345071010095a09')
				.send({name: 'Fran Kum', surname: 'fkun'})
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.user_not_updated);
					done();
				});

		});


		it('it should not update an email user', (done) => {
			let user = new User({
				name: 'Fran Chain',
				surname: 'fchain',
				email: 'fchain@gmail.com',
				password: '123456',
				role: 'ROLE_ADMIN',
				image: 'image.png'
			});
			user.save();
			chai.request(server)
				.put('/api/user/' + user.id)
				.send({name: 'Fran Kum', surname: 'fkun', email: 'newemail@gmail.com'})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('user');
					res.body.user.should.have.property('_id').eql(user.id);
					User.findById(user.id, (err, savedUser) => {
						savedUser.name.should.be.eql('Fran Kum');
						(savedUser.email == user.email).should.be.true;
						done();
					});
				});

		});


		it('it should not update a role user', (done) => {
			let user = new User({
				name: 'Fran Chain',
				surname: 'fchain',
				email: 'fchain@gmail.com',
				password: '123456',
				role: 'ROLE_USER',
				image: 'image.png'
			});
			user.save();
			chai.request(server)
				.put('/api/user/' + user.id)
				.send({name: 'Fran Kum', surname: 'fkun', role: 'ROLE_ADMIN'})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('user');
					res.body.user.should.have.property('_id').eql(user.id);
					User.findById(user.id, (err, savedUser) => {
						savedUser.name.should.be.eql('Fran Kum');
						savedUser.role.should.be.eql(user.role);
						done();
					});
				});

		});

		
		it('it should not update an image user', (done) => {
			let user = new User({
				name: 'Fran Chain',
				surname: 'fchain',
				email: 'fchain@gmail.com',
				password: '123456',
				role: 'ROLE_USER',
				image: 'image.png'
			});
			user.save();
			chai.request(server)
				.put('/api/user/' + user.id)
				.send({name: 'Fran Kum', surname: 'fkun', image: 'noimage.png'})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('user');
					res.body.user.should.have.property('_id').eql(user.id);
					User.findById(user.id, (err, savedUser) => {
						savedUser.name.should.be.eql('Fran Kum');
						savedUser.image.should.be.eql(user.image);
						done();
					});
				});

		});


		it('it should update an user', (done) => {
			let user = new User({
				name: 'Fran Chain',
				surname: 'fchain',
				email: 'fchain@gmail.com',
				password: '123456',
				role: 'ROLE_ADMIN',
				image: 'image.png'
			});
			user.save();
			chai.request(server)
				.put('/api/user/' + user.id)
				.send({name: 'Fran Kum', surname: 'fkun'})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('user');
					res.body.user.should.have.property('_id').eql(user.id);
					User.findById(user.id, (err, savedUser) => {
						savedUser.name.should.be.eql('Fran Kum');
						savedUser.surname.should.be.eql('fkun');
						done();
					});
				});

		});


	});


	describe('/POST upload-image-user', () => {
		it('it should not upload an image user if the image is not sended', (done) => {
			let user = new User(_createFakeUserSync());
			user.save((err, userSaved) => {
				chai.request(server)
					.post('/api/upload-image-user/' + userSaved.id)
					.end((err, res) => {
						res.should.have.status(206);
						res.body.should.have.a('object');
						res.body.should.have.property('message').eql(st.upload_user_image_not_sended);
						done();
					});
			});
		});


		it('it should not upload an image user if the file have an invalid ext', (done) => {
			let user = new User(_createFakeUserSync());
			user.save((err, userSaved) => {
				chai.request(server)
					.post('/api/upload-image-user/' + userSaved.id)
					.attach('image', fs.readFileSync(config.get('test.dir.user_image_bad')), config.get('test.dir.user_image_bad_name'))
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.a('object');
						res.body.should.have.property('message').eql(st.upload_user_image_error_ext);
						done();
					});
			});
		});
		

		it('it should not upload an image user if the user id is invalid', (done) => {
			let user = new User(_createFakeUserSync());
			user.save((err, userSaved) => {
				chai.request(server)
					.post('/api/upload-image-user/' + 'idnotvalid')
					.attach('image', fs.readFileSync(config.get('test.dir.user_image')), config.get('test.dir.user_image_name'))
					.end((err, res) => {
						res.should.have.status(500);
						res.body.should.have.a('object');
						res.body.should.have.property('message').eql(st.upload_user_image_error);
						done();
					});
			});
		});
		

		it('it should not upload an image user if the user id is not registered', (done) => {
			let user = new User(_createFakeUserSync());
			user.save((err, userSaved) => {
				chai.request(server)
					.post('/api/upload-image-user/' + '58eeeda1c345071010095a09')
					.attach('image', fs.readFileSync(config.get('test.dir.user_image')), config.get('test.dir.user_image_name'))
					.end((err, res) => {
						res.should.have.status(404)
						res.body.should.have.a('object');
						res.body.should.have.property('message').eql(st.user_image_not_updated);
						done();
					});
			});
		});


		it('it should upload an image user', (done) => {
			let user = new User(_createFakeUserSync());
			user.save((err, userSaved) => {
				chai.request(server)
					.post('/api/upload-image-user/' + userSaved.id)
					.attach('image', fs.readFileSync(config.get('test.dir.user_image')), config.get('test.dir.user_image_name'))
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.a('object');
						res.body.should.have.property('user');
						res.body.user.should.have.property('_id').eql(userSaved.id);
						User.findById(userSaved.id, (err, userUpdated) => {
							(fs.existsSync(config.get('dir.user_images') + userUpdated.image)).should.be.true;
							done();
						});
					});
			});
		});

	});


	describe('/GET get-image-user', () => {
		it('it should not get an image user if the image requested is not valid', (done) => {
			chai.request(server)
				.get('/api/get-image-user/' + 'imagenotvalid')
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.a('object');
					res.body.should.have.property('message').eql(st.get_user_image_not_exists);
					done();
				});
		});
		

		it('it should get an image user', (done) => {
			let user = new User(_createFakeUserSync());
			user.save((err, userSaved) => {
				chai.request(server)
					.post('/api/upload-image-user/' + userSaved.id)
					.attach('image', fs.readFileSync(config.get('test.dir.user_image')), config.get('test.dir.user_image_name'))
					.end((err, respost) => {
						respost.should.have.status(200);
						respost.body.should.have.a('object');
						respost.body.should.have.property('user');
						User.findById(userSaved.id, (err, userUpdated) => {
							chai.request(server)
								.get('/api/get-image-user/' + userUpdated.image)
								.end((err, resget) => {
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

function _createFakeUserSync(){
	var user = {
		name: faker.name.findName(),
		surname: faker.internet.userName(),
		email: faker.internet.email(),
		password: faker.internet.password(),
		role: 'ROLE_USER',
		image: 'null'
	};
	return user;
}