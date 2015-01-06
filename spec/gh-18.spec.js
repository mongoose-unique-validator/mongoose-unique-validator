var mongoose = require('mongoose');
var uniqueValidator = require('../index.js');

describe('With `_id` field', function () {
    var User;

    // jamsmine 1.3 does not have `beforeAll`
    it('starts the database connection', function (done) {
        mongoose.connect('mongodb://localhost/mongoose-unique-validator', done);
    });

    describe('having unique option', function () {

        beforeEach(function(done) {
            if (mongoose.connection.models['Test']) {
                delete mongoose.connection.models['Test'];
            }

            Test = mongoose.model('Test', mongoose.Schema({
                _id : {
                    type      : String,
                    unique    : true,
                    required  : true,
                    lowercase : true
                }
            }).plugin(uniqueValidator));

            Test.remove({}).exec().then(function () {
                done();
            });
        });

        describe('when two models have their `_id` being the same', function () {

            it('should throw error', function (done) {

                Test.create({_id: 'a_unique_id'})
                    .then(function () {
                        new Test({_id: 'a_unique_id'}).validate(function (err) {
                            expect(err).not.toBeUndefined();
                            expect(err.errors._id.message).toBe('Error, expected `_id` to be unique. Value: `a_unique_id`');
                            expect(err.errors._id.type).toBe('user defined');
                            expect(err.errors._id.path).toBe('_id');
                            expect(err.errors._id.value).toBe('a_unique_id');
                            done();
                        });
                    })
                    .end()

            });

        });

        describe('when two models have their `_id` being different', function () {

            it('should not throw errors', function (done) {

                Test.create({_id: 'a_unique_id'})
                    .then(function () {
                        new Test({_id: 'another_id'}).validate(function (err) {
                            expect(err).toBeUndefined();
                            done();
                        });
                    })
                    .end()

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
