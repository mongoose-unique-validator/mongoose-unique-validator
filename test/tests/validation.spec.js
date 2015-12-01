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

        it('does not throw error when saving self', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            var user = new User(helpers.USERS[0]);

            // Save a user
            var promise = user.save();
            promise.then(function() {
                user.password = 'somethingNew';
                user.save().catch(done).then(function() {
                    done();
                });
            });
            promise.catch(done);
        });

        it('does not throw error when saving self with new unique value', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            var user = new User(helpers.USERS[0]);

            // Save a user
            var promise = user.save();
            promise.then(function() {
                user.email = 'somethingNew@example.com';
                user.save().catch(done).then(function() {
                    done();
                });
            });
            promise.catch(done);
        });

        it('does not throw error when saving self with new unique value via findOneAndUpdate', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            var user = new User(helpers.USERS[0]);

            // Save a user
            var promise = user.save();
            promise.then(function() {
                User.findOneAndUpdate(
                    { email: helpers.USERS[0].email },
                    { email: 'somethingNew@example.com' },
                    { runValidators: true, context: 'query' }
                ).exec().then(function() {
                    done();
                });
            });
            promise.catch(done);
        });

        it('throws error when saving self with new duplicate value', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                var user = new User(helpers.USERS[1]);
                user.save().catch(done).then(function() {
                    user.email = helpers.USERS[0].email;
                    user.save().catch(function(err) {
                        expect(err).is.not.null;

                        done();
                    });
                });
            });
            promise.catch(done);
        });

        it('throws error when saving self with new duplicate value via findOneAndUpdate', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                var user = new User(helpers.USERS[1]);
                user.save().catch(done).then(function() {
                    User.findOneAndUpdate(
                        { email: helpers.USERS[0].email },
                        { email: helpers.USERS[1].email },
                        { runValidators: true, context: 'query' }
                    ).exec().catch(function(err) {
                        expect(err).is.not.null;

                        done();
                    });
                });
            });
            promise.catch(done);
        });

        it('throws error on unique violation for custom _id field', function(done) {
            var Planet = mongoose.model('Planet', helpers.createCustomIdSchema().plugin(uniqueValidator));

            // Save the first user
            var promise = new Planet({ _id: 'mercury' }).save();
            promise.then(function() {
                // Try saving a duplicate
                new Planet({ _id: 'mercury' }).save().catch(function(err) {
                    expect(err).is.not.null;

                    done();
                });
            });
            promise.catch(done);
        });

        it('does not throw error when saving self (with custom _id field)', function(done) {
            var Planet = mongoose.model('Planet', helpers.createCustomIdSchema().plugin(uniqueValidator));

            var planet = new Planet({ _id: 'mercury' });

            // Save a user
            var promise = planet.save();
            promise.then(function() {
                planet.position = 1;
                planet.save().catch(done).then(function() {
                    done();
                });
            });
            promise.catch(done);
        });

        it('does not throw error for sparse fields', function(done) {
            var Student = mongoose.model('Student', helpers.createSparseUserSchema().plugin(uniqueValidator));

            // Save the first student without a username
            var promise = new Student(helpers.USERS[2]).save();
            promise.then(function() {
                // Try saving a unique student without a username
                new Student(helpers.USERS[3]).save().catch(done).then(function() {
                    done();
                });
            });
            promise.catch(done);
        });

        it('throws error for duplicates in sparse fields', function(done) {
            var Student = mongoose.model('Student', helpers.createSparseUserSchema().plugin(uniqueValidator));

            // Save the first student without a username
            var promise = new Student(helpers.USERS[4]).save();
            promise.then(function() {
                // Try saving a unique student without a username
                new Student(helpers.USERS[5]).save().catch(function(err) {
                    expect(err).is.not.null;
                    done();
                });
            });
            promise.catch(done);
        });

        it('throws error for single index violation (case insensitive)', function(done) {
            var User = mongoose.model('User', helpers.createUserCaseInsensitiveSchema().plugin(uniqueValidator));

            // Save the first user
            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                var user = new User(helpers.USERS[0]);
                user.email = user.email.toUpperCase();

                // Try saving a duplicate
                user.save().catch(function(err) {
                    expect(err.errors.email.message).to.equal('Error, expected `email` to be unique. Value: `JOHN.SMITH@GMAIL.COM`');
                    expect(err.errors.email.properties.type).to.equal('user defined');
                    expect(err.errors.email.properties.path).to.equal('email');

                    done();
                });
            });
            promise.catch(done);
        });

        it('throws error for single nested index violation', function(done) {
            var User = mongoose.model('User', helpers.createNestedFieldUserSchema().plugin(uniqueValidator));

            var nestedUser = {
                username: 'JohnSmith',
                contact: { email: 'john.smith@gmail.com' },
                password: 'j0hnNYb0i'
            };

            var otherNestedUser = {
                username: 'BobSmith',
                contact: { email: 'john.smith@gmail.com' },
                password: 'j0hnNYb0i'
            };

            // Save the first user
            var promise = new User(nestedUser).save();
            promise.then(function() {
                // Try saving a duplicate
                new User(otherNestedUser).save().catch(function(err) {
                    expect(err.errors['contact.email'].message).to.equal('Error, expected `contact.email` to be unique. Value: `john.smith@gmail.com`');
                    done();
                });
            });
            promise.catch(done);
        });

        it('throws error for index violation in an array of nested objects', function(done) {
            var User = mongoose.model('User', helpers.createNestedFieldUserSchema().plugin(uniqueValidator));

            var nestedUser = {
                username: 'JohnSmith',
                contact: { email: 'john.smith@gmail.com' },
                password: 'j0hnNYb0i'
            };

            var otherNestedUser = {
                username: 'BobSmith',
                contact: { email: 'john.smith@gmail.com' },
                password: 'j0hnNYb0i'
            };

            // Save the first user
            var promise = new User(nestedUser).save();
            promise.then(function() {
                // Try saving a duplicate
                new User(otherNestedUser).save().catch(function(err) {
                    expect(err.errors['contact.email'].message).to.equal('Error, expected `contact.email` to be unique. Value: `john.smith@gmail.com`');
                    done();
                });
            });
            promise.catch(done);
        });

        it('throws error for nested schema index violation', function(done) {
            var User = mongoose.model('User', helpers.createNestedUserSchema(uniqueValidator));

            var nestedUser = {
                username: 'JohnSmith',
                contact: { email: 'john.smith@gmail.com' },
                password: 'j0hnNYb0i'
            };

            var otherNestedUser = {
                username: 'BobSmith',
                contact: { email: 'john.smith@gmail.com' },
                password: 'j0hnNYb0i'
            };

            // Save the first user
            var promise = new User(nestedUser).save();
            promise.then(function() {
                // Try saving a duplicate
                new User(otherNestedUser).save().catch(function(err) {
                    expect(err.errors['contact.email'].message).to.equal('Error, expected `email` to be unique. Value: `john.smith@gmail.com`');
                    done();
                });
            });
            promise.catch(done);
        });
    });
};
