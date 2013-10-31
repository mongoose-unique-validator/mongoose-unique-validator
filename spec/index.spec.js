// TODO Fix callback hell with Q promise library.

var mongoose = require('mongoose');
var uniqueValidator = require('../index.js');

mongoose.connect('mongodb://localhost/mongoose-unique-validator');

var userSchema = mongoose.Schema({
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
userSchema.plugin(uniqueValidator);
var User = mongoose.model('User', userSchema);

describe('Mongoose Unique Validator Plugin', function () {

    describe('when a duplicate record exists in the DB', function () {

        it('a validation error is thrown for fields with a unique index', function (done) {
            var user = getDuplicateUser();
            var duplicateUser = getDuplicateUser();

            user.save(function () {
                duplicateUser.save(function (err) {

                    user.remove(function () {
                        duplicateUser.remove(function () {
                            expect(err.errors.username.type).toBe('unique');
                            expect(err.errors.username.path).toBe('username');
                            expect(err.errors.username.value).toBe('JohnSmith');

                            expect(err.errors.email.type).toBe('unique');
                            expect(err.errors.email.path).toBe('email');
                            expect(err.errors.email.value).toBe('john.smith@gmail.com');

                            done();
                        });
                    });
                });
            });
        });

        it('no validation error is thrown for fields without a unique index', function (done) {
            var user = getDuplicateUser();
            var duplicateUser = getDuplicateUser();

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
            var user = getDuplicateUser();
            var uniqueUser = getUniqueUser();

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
            var user = getUniqueUser();

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

function getDuplicateUser() {
    return new User({
        username: 'JohnSmith',
        email: 'john.smith@gmail.com',
        password: 'j0hnNYb0i'
    });
}

function getUniqueUser() {
    return new User({
        username: 'Robert Miller',
        email: 'bob@robertmiller.com',
        password: '@b0B#b0B$b0B%'
    });
}