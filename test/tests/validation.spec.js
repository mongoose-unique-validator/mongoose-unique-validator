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
                    expect(err.errors.username.name).to.equal('ValidatorError');
                    expect(err.errors.username.kind).to.equal('unique');
                    expect(err.errors.username.path).to.equal('username');
                    expect(err.errors.username.value).to.equal('JohnSmith');

                    expect(err.errors.email.name).to.equal('ValidatorError');
                    expect(err.errors.email.kind).to.equal('unique');
                    expect(err.errors.email.path).to.equal('email');
                    expect(err.errors.email.value).to.equal('john.smith@gmail.com');

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
                    expect(err.errors.username.name).to.equal('ValidatorError');
                    expect(err.errors.username.kind).to.equal('unique');
                    expect(err.errors.username.path).to.equal('username');
                    expect(err.errors.username.value).to.equal('JohnSmith');

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
                user.save().catch(done).then(function(result) {
                    expect(result).to.be.an('object');
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
                    { email: 'somethingNew@example.com', username: 'JohnSmith' },
                    { runValidators: true, context: 'query' }
                ).exec().catch(done).then(function(result) {
                    expect(result).to.be.an('object');
                    done();
                });
            });
            promise.catch(done);
        });

        it('does not throw error when saving self with new unique value via findById', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            var user = new User(helpers.USERS[0]);

            // Save a user
            var promise = user.save();
            promise.then(function() {
                User.findById(user._id).then(function(foundUser) {
                    foundUser.email = 'somethingNew@example.com';
                    foundUser.username = 'JohnSmith';
                    foundUser.save().then(function(result) {
                        expect(result).to.be.an('object');
                        done();
                    }).catch(done);
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
                        expect(err.errors.email.name).to.equal('ValidatorError');
                        expect(err.errors.email.kind).to.equal('unique');
                        expect(err.errors.email.path).to.equal('email');
                        expect(err.errors.email.value).to.equal('john.smith@gmail.com');

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
                        expect(err.errors.email.name).to.equal('ValidatorError');
                        expect(err.errors.email.kind).to.equal('unique');
                        expect(err.errors.email.path).to.equal('email');
                        expect(err.errors.email.value).to.equal('bob@robertmiller.com');

                        done();
                    });
                });
            });
            promise.catch(done);
        });

        it('throws error when saving self with new duplicate value via findOneAndUpdate using $set', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                var user = new User(helpers.USERS[1]);
                user.save().catch(done).then(function() {
                    User.findOneAndUpdate(
                        { email: helpers.USERS[0].email },
                        {
                            $set: {
                                email: helpers.USERS[1].email
                            }
                        },
                        { runValidators: true, context: 'query' }
                    ).exec().catch(function(err) {
                        expect(err.errors.email.name).to.equal('ValidatorError');
                        expect(err.errors.email.kind).to.equal('unique');
                        expect(err.errors.email.path).to.equal('email');
                        expect(err.errors.email.value).to.equal('bob@robertmiller.com');

                        done();
                    });
                });
            });
            promise.catch(done);
        });

        it('throws error when validating self with new duplicate value', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            // Save first record
            new User(helpers.USERS[0]).save().catch(done).then(function() {
                // Save second record
                var user = new User(helpers.USERS[1]);
                user.save().catch(done).then(function() {
                    // Try updating this record with an existing email
                    user.email = helpers.USERS[0].email;
                    user.validate().catch(function(err) {
                        expect(err.errors.email.name).to.equal('ValidatorError');
                        expect(err.errors.email.kind).to.equal('unique');
                        expect(err.errors.email.path).to.equal('email');
                        expect(err.errors.email.value).to.equal('john.smith@gmail.com');

                        done();
                    });
                });
            });
        });

        it('throws error on unique violation for custom _id field', function(done) {
            var Planet = mongoose.model('Planet', helpers.createCustomIdSchema().plugin(uniqueValidator));
            var id = new mongoose.Types.ObjectId('aporfghtyuqi');

            // Save the first user
            var promise = new Planet({ _id: id }).save();
            promise.then(function() {
                // Try saving a duplicate
                new Planet({ _id: id }).save().catch(function(err) {
                    expect(err.errors._id.name).to.equal('ValidatorError');
                    expect(err.errors._id.kind).to.equal('unique');
                    expect(err.errors._id.path).to.equal('_id');

                    done();
                });
            });
            promise.catch(done);
        });

        it('does not throw error when saving self (with custom _id field)', function(done) {
            var Planet = mongoose.model('Planet', helpers.createCustomIdSchema().plugin(uniqueValidator));

            var planet = new Planet({ _id: new mongoose.Types.ObjectId('aporfghtyuqi') });

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
                    expect(err.errors.username.name).to.equal('ValidatorError');
                    expect(err.errors.username.kind).to.equal('unique');
                    expect(err.errors.username.path).to.equal('username');
                    expect(err.errors.username.value).to.equal('JohnSmith');

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
                    expect(err.errors.email.name).to.equal('ValidatorError');
                    expect(err.errors.email.kind).to.equal('unique');
                    expect(err.errors.email.path).to.equal('email');
                    expect(err.errors.email.value).to.equal('JOHN.SMITH@GMAIL.COM');

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
                    expect(err.errors['contact.email'].name).to.equal('ValidatorError');
                    expect(err.errors['contact.email'].kind).to.equal('unique');
                    expect(err.errors['contact.email'].path).to.equal('contact.email');
                    expect(err.errors['contact.email'].value).to.equal('john.smith@gmail.com');

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
                    expect(err.errors['contact.email'].name).to.equal('ValidatorError');
                    expect(err.errors['contact.email'].kind).to.equal('unique');
                    expect(err.errors['contact.email'].path).to.equal('contact.email');
                    expect(err.errors['contact.email'].value).to.equal('john.smith@gmail.com');

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
                    expect(err.errors['contact.email'].name).to.equal('ValidatorError');
                    expect(err.errors['contact.email'].kind).to.equal('unique');
                    expect(err.errors['contact.email'].path).to.equal('email');
                    expect(err.errors['contact.email'].value).to.equal('john.smith@gmail.com');

                    done();
                });
            });
            promise.catch(done);
        });

        it('throws error for compound index violation (case insensitive)', function(done) {
            var User = mongoose.model('User', helpers.createCaseInsensitiveCompoundIndexSchema().plugin(uniqueValidator));

            // Save the first user
            var promise = new User(helpers.USERS[0]).save();
            promise.then(function() {
                var user = new User(helpers.USERS[0]);
                user.email = user.email.toUpperCase();

                // Try saving a duplicate
                user.save().catch(function(err) {
                    expect(err.errors.email.name).to.equal('ValidatorError');
                    expect(err.errors.email.kind).to.equal('unique');
                    expect(err.errors.email.path).to.equal('email');
                    expect(err.errors.email.value).to.equal('JOHN.SMITH@GMAIL.COM');

                    done();
                });
            });
            promise.catch(done);
        });
    });
};
