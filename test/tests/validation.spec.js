'use strict';

var helpers = require('../helpers');
var expect = require('chai').expect;
var uniqueValidator = require('../../index.js');

module.exports = function(mongoose) {
    describe('Validation', function() {
        afterEach(helpers.afterEach);

        it('allows unique records', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

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

        it('throws error for single index violation', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

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

        it('throws error for compound index violation', function(done) {
            var User = mongoose.model('User', helpers.createCompoundIndexSchema().plugin(uniqueValidator));

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
    });
};
