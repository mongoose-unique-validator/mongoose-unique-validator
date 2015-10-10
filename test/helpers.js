'use strict';

var mongoose = require('mongoose');

// Helper methods/objects for tests
module.exports = {
    createUserSchema: function() {
        return new mongoose.Schema({
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
        return new mongoose.Schema({
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

    createCompoundIndexSchema: function() {
        var schema = new mongoose.Schema({
            username: {
                type: String
            },
            email: {
                type: String,
                index: true
            },
            password: {
                type: String
            }
        });

        schema.index({ username: 1, email: 1 }, { unique: true });

        return schema;
    },

    createCustomCompoundIndexSchema: function() {
        var schema = new mongoose.Schema({
            username: {
                type: String
            },
            email: {
                type: String,
                index: true
            },
            password: {
                type: String
            }
        });

        schema.index({ username: 1, email: 1 }, { unique: 'Combo in use.' });

        return schema;
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
