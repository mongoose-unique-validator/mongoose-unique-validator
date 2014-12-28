var mongoose = require('mongoose');
var uniqueValidator = require('../index.js');

describe('With sparse indices', function () {
    var User;

    // jamsmine 1.3 does not have `beforeAll`
    it('starts the database connection', function (done) {
        mongoose.connect('mongodb://localhost/mongoose-unique-validator', done);
    });

    describe('when two models have their sparse values being empty', function () {

        beforeEach(function(done) {
            if (mongoose.connection.models['User']) {
                delete mongoose.connection.models['User'];
            }

            User = mongoose.model('User', mongoose.Schema({
                // username is unique but not required
                username: {
                    type: String,
                    unique: true,
                    sparse: true
                },
                email: {
                    type: String,
                    index: true,
                    unique: true,
                    require: true
                },
                password: {
                    type: String,
                    required: true
                }
            }).plugin(uniqueValidator));

            User.remove({}).exec().then(function () {
                done();
            });
        });

        it('should not throw errors', function (done) {

            User.create({
                email    : 'john.doe@gmail.com',
                password : 'j0hnNYb0i',
            }).then(function () {
                return User.create({
                    email    : 'jane.doe@gmail.com',
                    password : 'j4nNIG1RL',
                })
            }).onReject(function (err) {
                expect(err).toBeNull();
                done();
            }).then(function () {
                return User.count({}).exec();
            }).onFulfill(function (count) {
                expect(count).toEqual(2);
                done();
            }).end();

        });

    });

    describe('when no custom error message is passed', function () {

        beforeEach(function(done) {
            User.remove({}).exec().then(function () {
                done();
            });
        });

        describe('and two models have their sparse values duplicated', function () {
            it('should throw error', function (done) {
                User.create({
                    username : 'doe',
                    email    : 'john.doe@gmail.com',
                    password : 'j0hnNYb0i',
                }).then(function () {
                    return User.create({
                        username : 'doe',
                        email    : 'jane.doe@gmail.com',
                        password : 'j4nNIG1RL',
                    })
                }).onReject(function (err) {
                    expect(err.errors.username.message).toBe('Error, expected `username` to be unique. Value: `doe`');
                    expect(err.errors.username.type).toBe('user defined');
                    expect(err.errors.username.path).toBe('username');
                    expect(err.errors.username.value).toBe('doe');
                    done();
                }).onFulfill(function (user) {
                    expect(user).toBeNull();
                    done();
                }).end();
            });
        });
    });

    describe('when a custom error message is passed', function () {

        beforeEach(function(done) {
            if (mongoose.connection.models['User']) {
                delete mongoose.connection.models['User'];
            }

            User = mongoose.model('User', mongoose.Schema({
                // username is unique but not required
                username: {
                    type: String,
                    unique: 'Username is taken.',
                    sparse: true
                },
                email: {
                    type: String,
                    index: true,
                    unique: 'Email is taken.',
                    require: true
                },
                password: {
                    type: String,
                    required: true
                }
            }).plugin(uniqueValidator));

            User.remove({}).exec().then(function () {
                done();
            });
        });

        describe('and two models have their sparse values duplicated', function () {
            it('should throw error with custom message', function (done) {
                User.create({
                    username : 'doe',
                    email    : 'john.doe@gmail.com',
                    password : 'j0hnNYb0i',
                }).then(function () {
                    return User.create({
                        username : 'doe',
                        email    : 'john.doe@gmail.com',
                        password : 'j4nNIG1RL',
                    })
                }).onReject(function (err) {
                    expect(err.errors.username.message).toBe('Username is taken.');
                    expect(err.errors.username.type).toBe('user defined');
                    expect(err.errors.username.path).toBe('username');
                    expect(err.errors.username.value).toBe('doe');
                    expect(err.errors.email.message).toBe('Email is taken.');
                    expect(err.errors.email.type).toBe('user defined');
                    expect(err.errors.email.path).toBe('email');
                    expect(err.errors.email.value).toBe('john.doe@gmail.com');
                    done();
                }).onFulfill(function (user) {
                    expect(user).toBeNull();
                    done();
                }).end();
            });
        });
    });

    // jamsmine 1.3 does not have `afterAll`
    it('tears down the database', function (done) {
        mongoose.connection.db.dropDatabase();

        // Remove models definition
        for (key in mongoose.connection.models) {
            delete mongoose.connection.models[key];
        }

        mongoose.disconnect(done);
    });
});
