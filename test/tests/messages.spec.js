'use strict';

var helpers = require('../helpers');
var expect = require('chai').expect;
var uniqueValidator = require('../../index.js');

module.exports = function(mongoose) {
    describe('Messages', function() {
        afterEach(helpers.afterEach);

        it('uses default validation message', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            // Save the first user
            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                // Try saving a duplicate
                new User(helpers.USERS[0]).save().catch(function(err) {
                    expect(err.errors.username.message).to.equal('Error, expected `username` to be unique. Value: `JohnSmith`');
                    done();
                });
            });
            promise.catch(done);
        });

        it('uses custom message via options', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator, {
                message: 'Path: {PATH}, value: {VALUE}, type: {TYPE}'
            }));

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

        it('uses custom message from schema configuration', function(done) {
            var User = mongoose.model('User', helpers.createCustomUserSchema().plugin(uniqueValidator));

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
};
