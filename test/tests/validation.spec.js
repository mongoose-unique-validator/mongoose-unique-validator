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

        it('allows unique records with regex wildcards', function(done) {
            var User = mongoose.model('User', helpers.createUserCaseInsensitiveSchema().plugin(uniqueValidator));

            // Save the first user
            var promise = new User(helpers.USERS_REGEX[0]).save();
            promise.then(function() {
                // Try saving a unique user with email that has a regex wildcard
                new User(helpers.USERS_REGEX[1]).save().catch(done).then(function(res) {
                    expect(res.email).to.equal(helpers.USERS_REGEX[1].email);
                    done();
                });
            });
            promise.catch(done);
        });

        it('allows unique records with partial filter expression', function(done) {
            var User = mongoose.model('Employee', helpers.createUserPartialFilterExpressionSchema().plugin(uniqueValidator));

            // Save the first user
            var promise = new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save();
            promise.then(function() {
                // Try saving a unique user
                new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[1]).save().catch(done).then(function() {
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

        it('throws an error for partial filter expression index violation', function(done) {
            var User = mongoose.model('Employee', helpers.createUserPartialFilterExpressionSchema().plugin(uniqueValidator));

            // Save the first user
            var promise = new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save();
            promise.then(function() {
                // Try saving a duplicate
                new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save().catch(function(err) {
                    expect(err.errors.email.name).to.equal('ValidatorError');
                    expect(err.errors.email.kind).to.equal('unique');
                    expect(err.errors.email.path).to.equal('email');
                    expect(err.errors.email.value).to.equal('jane.smith@gmail.com');

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

        it('does not throw error when saving self with new unique value via findByIdAndUpdate', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            var user = new User(helpers.USERS[0]);

            // Save a user
            var promise = user.save();
            promise.then(function() {
                User.findByIdAndUpdate(
                    user._id,
                    { email: 'somethingNew@example.com', username: 'JohnSmith' },
                    { runValidators: true, context: 'query' }
                ).exec().catch(done).then(function(result) {
                    expect(result).to.be.an('object');
                    done();
                });
            });
            promise.catch(done);
        });

        // adresses https://github.com/blakehaswell/mongoose-unique-validator/issues/108
        it('does not throw error when saving self with new unique value via findByIdAndUpdate with multiple records', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            // Save a user
            var promise = User.insertMany([helpers.USERS[0], helpers.USERS[1]]);;
            promise.then(function(createdUsers) {
                User.findByIdAndUpdate(
                    createdUsers[0]._id,
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

        // adresses https://github.com/blakehaswell/mongoose-unique-validator/issues/108
        it('does not throw error when saving self with new unique value via findById with multiple records', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            // Save a user
            var promise = User.insertMany([helpers.USERS[0], helpers.USERS[1]]);
            promise.then(function(createdUsers) {
                User.findById(createdUsers[0]._id).then(function(foundUser) {
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

        it('throws error when saving self with new duplicate value via findByIdAndUpdate', function(done) {
            var User = mongoose.model('User', helpers.createUserSchema().plugin(uniqueValidator));

            var promise = new User(helpers.USERS[0]).save();
            promise.then(function(createdUser) {
                var user = new User(helpers.USERS[1]);
                user.save().catch(done).then(function() {
                    User.findByIdAndUpdate(
                        createdUser._id,
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
            var id = new mongoose.Types.ObjectId(321);

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

            var planet = new Planet({ _id: new mongoose.Types.ObjectId(321) });

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

        it('does not throw error when using a partial filter expression', function(done) {
            var User = mongoose.model('Employee', helpers.createUserPartialFilterExpressionSchema().plugin(uniqueValidator));

            // Save the first (deactivated) user
            var promise = new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[2]).save();
            promise.then(function() {
                // Try saving a the first user that has the same email, but is active
                new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save().catch(done).then(function() {
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

        it('does not throw error when create vs save data (with model field)', function(done) {
            var UID = mongoose.model('UID', helpers.createUniqueIDSchemaNonStrict().plugin(uniqueValidator));

            // Save the first user
            const payloadWithModelField = {
                uid: '12345',
                model: 'some-value'
            };

            // perform a create() vs save()
            var promise = UID.create(payloadWithModelField);
            promise.then(function(res) {
                expect(res.uid).to.equal(payloadWithModelField.uid);
                expect(res.model).to.equal(payloadWithModelField.model);
                done();
            });
            promise.catch(done);
        });
    });
};
