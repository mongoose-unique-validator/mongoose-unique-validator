var helpers = require('./helpers');
var expect = require('chai').expect;
var mongoose = require('mongoose');
var uniqueValidator = require('../index.js');

mongoose.Promise = require('bluebird');

// Connect
mongoose.connect('mongodb://localhost/mongoose-unique-validator');
mongoose.connection.on('error', function() {
    throw new Error('Unable to connect to database.');
});

var models = [];

describe('Mongoose Unique Validator', function() {
    afterEach(function(done) {
        var l = models.length;

        models.forEach(function(model) {
            model.remove().then(function() {
                l--;

                if (!l) {
                    done();
                }
            });
        });
    });

    describe('Default Configuration', function () {
        var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));
        models.push(User);

        it('throws validation error for unique index violation', function(done) {
            // Save the first user
            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                // Try saving a duplicate
                new User(helpers.USERS[0]).save().catch(function(err) {
                    expect(err.errors.username.message).to.equal('Error, expected `username` to be unique. Value: `JohnSmith`');
                    expect(err.errors.username.properties.type).to.equal('user defined');
                    expect(err.errors.username.properties.path).to.equal('username');

                    expect(err.errors.email.message).to.equal('Error, expected `email` to be unique. Value: `john.smith@gmail.com`');
                    expect(err.errors.email.properties.type).to.equal('user defined');
                    expect(err.errors.email.properties.path).to.equal('email');

                    done();
                });
            });
            promise.catch(done);
        });

        it('allows unique records', function(done) {
            // Save the first user
            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                // Try saving a unique user
                new User(helpers.USERS[1]).save().catch(done).then(function() {
                    done();
                });
            });
            promise.catch(done);
        });
    });

    describe('Custom Configuration', function () {
        var User = mongoose.model('UserErrorMessage', helpers.createUserSchema().plugin(uniqueValidator, {
            message: 'Path: {PATH}, value: {VALUE}, type: {TYPE}'
        }));
        models.push(User);

        it('throws validation error for unique index violation', function(done) {
            // Save the first user
            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                // Try saving a duplicate
                new User(helpers.USERS[0]).save().catch(function(err) {
                    expect(err.errors.username.message).to.equal('Path: username, value: JohnSmith, type: user defined');
                    expect(err.errors.email.message).to.equal('Path: email, value: john.smith@gmail.com, type: user defined');

                    done();
                });
            });
            promise.catch(done);
        });
    });

    describe('Configuration via Schema', function () {
        var User = mongoose.model('UserErrorCustomMessage', helpers.createCustomUserSchema().plugin(uniqueValidator));
        models.push(User);

        it('throws validation error for unique index violation', function(done) {
            // Save the first user
            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                // Try saving a duplicate
                new User(helpers.USERS[0]).save().catch(function(err) {
                    expect(err.errors.username.message).to.equal('Username is already used.');
                    expect(err.errors.email.message).to.equal('It already exists.');

                    done();
                });
            });
            promise.catch(done);
        });
    });
});
