'use strict';

import mongoose from 'mongoose';
import validation from "./tests/validation.spec.js"
import types from "./tests/types.spec.js"
import messages from "./tests/messages.spec.js"

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
    validation(mongoose);
    types(mongoose);
    messages(mongoose);

    after(function() {
        mongoose.connection.dropDatabase();
    });
});
