'use strict';

/**
 * Builds query to find any duplicate records.
 *
 * @param {string} path Path name.
 * @param {string} value Value to search for.
 * @param {object} id ObjectID of self
 * @return {object} MongoDB query object
 */
var buildQuery = function buildQuery(path, value, id) {
    // Build a base query, ensure duplicates aren't ourself
    var query = { $and: [{
        _id: {
            $ne: id
        }
    }] };

    // Match target path
    var target = {};
    target[path] = value;
    query.$and.push(target);

    return query;
};

/**
 * Mongoose validator to be executed per-path.
 *
 * @param {string} path Path name.
 * @return {function} Mongoose validation function
 */
var buildValidator = function buildValidator(path) {
    return function(value, respond) {
        // Awaiting more official way to obtain reference to model.
        // https://github.com/Automattic/mongoose/issues/3430
        var model = this.model(this.constructor.modelName);
        var query = buildQuery(path, value, this._id);
        model.findOne(query, function(err, document) {
            respond(!document);
        });
    };
};

// Export the mongoose plugin
module.exports = function(schema, options) {
    var message = 'Error, expected `{PATH}` to be unique. Value: `{VALUE}`';
    if (options && options.message) {
        message = options.message;
    }

    schema.eachPath(function(path, schemaType) {
        if (schemaType._index && schemaType._index.unique) {
            if (typeof schemaType.options.unique === 'string') {
                message = schemaType.options.unique;
            }

            schemaType.validate(buildValidator(path), message);
        }
    });
};
