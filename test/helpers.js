'use strict';

var mongoose = require('mongoose');

// Helper methods/objects for tests
module.exports = {
    afterEach: function(done) {
        var collections = Object.keys(mongoose.connection.collections);
        var l = collections.length;
        collections.forEach(function(coll) {
            mongoose.connection.collections[coll].remove();
            l--;

            if (!l) {
                mongoose.models = {};
                mongoose.modelSchemas = {};
                mongoose.connection.models = {};
                done();
            }
        });
    },

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

    createUserCaseInsensitiveSchema: function() {
        return new mongoose.Schema({
            username: {
                type: String,
                unique: true
            },
            email: {
                type: String,
                index: true,
                unique: true,
                uniqueCaseInsensitive: true
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

    createCustomIdSchema: function() {
        return new mongoose.Schema({
            _id: {
                type: String,
                unique: true
            },
            position: Number
        });
    },

    createSparseUserSchema: function() {
        return new mongoose.Schema({
            username: {
                type: String,
                unique: true,
                sparse: true
            },
            email: {
                type: String,
                index: true,
                unique: true
            }
        });
    },

    createNestedFieldUserSchema: function() {
        return new mongoose.Schema({
            username: {
                type: String,
                unique: true
            },
            contact: {
                email: {
                    type: String,
                    index: true,
                    unique: true
                }
            },
            password: {
                type: String
            }
        });
    },

    createArrayOfNestedUserSchema: function() {
        return new mongoose.Schema({
            username: {
                type: String,
                unique: true
            },
            contacts: [{
                email: {
                    type: String,
                    index: true,
                    unique: true
                }
            }],
            password: {
                type: String
            }
        });
    },

    createNestedUserSchema: function(uniqueValidator) {
        var ContactSchema = new mongoose.Schema({
            email: {
                type: String,
                index: true,
                unique: true,
                required: true
            }
        });

        var Schema = new mongoose.Schema({
            username: {
                type: String,
                unique: true
            },
            contact: ContactSchema,
            password: {
                type: String
            }
        });
        Schema.plugin(uniqueValidator);

        return Schema;
    },

    USERS: [{
        username: 'JohnSmith',
        email: 'john.smith@gmail.com',
        password: 'j0hnNYb0i'
    }, {
        username: 'Robert Miller',
        email: 'bob@robertmiller.com',
        password: '@b0B#b0B$b0B%'
    }, {
        email: 'john.smith@gmail.com'
    }, {
        email: 'bob@robertmiller.com'
    }, {
        email: 'john.smith@gmail.com',
        username: 'JohnSmith'
    }, {
        email: 'john.smith2000@gmail.com',
        username: 'JohnSmith'
    }]
};
