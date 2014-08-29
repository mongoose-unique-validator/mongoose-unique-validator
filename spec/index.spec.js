// TODO Fix callback hell with Q promise library.

var mongoose = require('mongoose');
var uniqueValidator = require('../index.js');

mongoose.connect('mongodb://localhost/mongoose-unique-validator');

describe('Mongoose Unique Validator Plugin', function () {

    describe('when no custom error message is passed', function () {

        var User = mongoose.model('User', getUserSchema().plugin(uniqueValidator));

        describe('when a duplicate record exists in the DB', function () {

            it('a validation error is thrown for fields with a unique index', function (done) {
                var user = getDuplicateUser(User);
                var duplicateUser = getDuplicateUser(User);

                user.save(function () {
                    duplicateUser.save(function (err) {

                        user.remove(function () {
                            duplicateUser.remove(function () {
                                expect(err.errors.username.message).toBe('Error, expected `username` to be unique. Value: `JohnSmith`');
                                expect(err.errors.username.type).toBe('user defined');
                                expect(err.errors.username.path).toBe('username');
                                expect(err.errors.username.value).toBe('JohnSmith');

                                expect(err.errors.email.message).toBe('Error, expected `email` to be unique. Value: `john.smith@gmail.com`');
                                expect(err.errors.email.type).toBe('user defined');
                                expect(err.errors.email.path).toBe('email');
                                expect(err.errors.email.value).toBe('john.smith@gmail.com');

                                done();
                            });
                        });
                    });
                });
            });

            it('no validation error is thrown for fields without a unique index', function (done) {
                var user = getDuplicateUser(User);
                var duplicateUser = getDuplicateUser(User);

                user.save(function () {
                    duplicateUser.save(function (err) {

                        user.remove(function () {
                            duplicateUser.remove(function () {
                                expect(err.errors.password).toBeUndefined();
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('when no duplicate record exists in the DB', function () {

            it('no validation errors are thrown for fields with a unique index', function (done) {
                var user = getDuplicateUser(User);
                var uniqueUser = getUniqueUser(User);

                user.save(function () {
                    uniqueUser.save(function (err) {
                        user.remove(function () {
                            uniqueUser.remove(function () {
                                expect(err).toBeNull();
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('when a unique record exists in the DB', function () {

            it('can be saved even if validation is triggered on a field with a unique index', function (done) {
                var user = getUniqueUser(User);

                user.save(function () {

                    // Changing a field and then changing it back to what it was seems to change an internal Mongoose flag
                    // and causes validation to occur even though the value of the field hasn’t changed.
                    user.email = 'robert.miller@gmail.com';
                    user.email = 'bob@robertmiller.com';

                    user.save(function (err) {
                        user.remove(function () {
                            expect(err).toBeNull();
                            done();
                        });
                    });
                });
            });

        });

    });

    describe('when a custom error message is passed', function () {

        var User = mongoose.model('UserErrorMessage', getUserSchema().plugin(uniqueValidator, { message: 'Path: {PATH}, value: {VALUE}, type: {TYPE}' }));

        it('a custom message error is thrown for fields with a unique index when present', function (done) {
            var user = getDuplicateUser(User);
            var duplicateUser = getDuplicateUser(User);

            user.save(function () {
                duplicateUser.save(function (err) {

                    user.remove(function () {
                        duplicateUser.remove(function () {
                            expect(err.errors.username.message).toBe('Path: username, value: JohnSmith, type: user defined');
                            expect(err.errors.username.type).toBe('user defined');
                            expect(err.errors.username.path).toBe('username');
                            expect(err.errors.username.value).toBe('JohnSmith');

                            expect(err.errors.email.message).toBe('Path: email, value: john.smith@gmail.com, type: user defined');
                            expect(err.errors.email.type).toBe('user defined');
                            expect(err.errors.email.path).toBe('email');
                            expect(err.errors.email.value).toBe('john.smith@gmail.com');

                            done();
                        });
                    });
                });
            });
        });

    });

    describe('when a custom error message is passed to the schema options', function(){

        var User = mongoose.model('UserErrorCustomMessage', getUserSchemaWithCustomMessage().plugin(uniqueValidator));

        it('a custom message error is thrown for fields with a unique index when present', function (done) {
            var user = getDuplicateUser(User);
            var duplicateUser = getDuplicateUser(User);

            user.save(function () {
                duplicateUser.save(function (err) {

                    user.remove(function () {
                        duplicateUser.remove(function () {
                            expect(err.errors.username.message).toBe('Username is already used.');
                            expect(err.errors.username.type).toBe('user defined');
                            expect(err.errors.username.path).toBe('username');
                            expect(err.errors.username.value).toBe('JohnSmith');

                            expect(err.errors.email.message).toBe('It already exists.');
                            expect(err.errors.email.type).toBe('user defined');
                            expect(err.errors.email.path).toBe('email');
                            expect(err.errors.email.value).toBe('john.smith@gmail.com');

                            done();
                        });
                    });
                });
            });
        });

    });

});

function getUserSchema() {
    return mongoose.Schema({
        username: {
            type: String,
            unique: true
        },
        email: {
            type: String,
            index: true,
            unique: true
        },
        password: {
            type: String
        }
    });
}

function getUserSchemaWithCustomMessage() {
    return mongoose.Schema({
        username: {
            type: String,
            unique: 'Username is already used.'
        },
        email: {
            type: String,
            index: true,
            unique: 'It already exists.'
        },
        password: {
            type: String
        }
    });
}

function getDuplicateUser(User) {
    return new User({
        username: 'JohnSmith',
        email: 'john.smith@gmail.com',
        password: 'j0hnNYb0i'
    });
}

function getUniqueUser(User) {
    return new User({
        username: 'Robert Miller',
        email: 'bob@robertmiller.com',
        password: '@b0B#b0B$b0B%'
    });
}
