'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

// Connect
mongoose.connect('mongodb://localhost/mongoose-unique-validator');
mongoose.connection.on('error', function() {
    throw new Error('Unable to connect to database.');
});

describe('Mongoose Unique Validator', function() {
    require('./tests/validation.spec')(mongoose);
    require('./tests/messages.spec')(mongoose);

    after(function() {
        mongoose.connection.db.dropDatabase();
    });
});
