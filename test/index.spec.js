'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

// Connect
mongoose.connect('mongodb://127.0.0.1:27017/mongoose-unique-validator').catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    throw err;
}).then(() => {
    // eslint-disable-next-line no-console
    console.log('Connected to the database...');
});

describe('Mongoose Unique Validator', function() {
    require('./tests/validation.spec')(mongoose);
    require('./tests/types.spec.js')(mongoose);
    require('./tests/messages.spec')(mongoose);

    after(function() {
        mongoose.connection.dropDatabase();
    });
});
