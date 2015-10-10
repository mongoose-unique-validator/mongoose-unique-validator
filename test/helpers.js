var mongoose = require('mongoose');

// Helper methods/objects for tests
module.exports = {
    createUserSchema: function() {
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
    },

    createCustomUserSchema: function() {
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
    },

    USERS: [{
            username: 'JohnSmith',
            email: 'john.smith@gmail.com',
            password: 'j0hnNYb0i'
    }, {
        username: 'Robert Miller',
        email: 'bob@robertmiller.com',
        password: '@b0B#b0B$b0B%'
    }]
};
