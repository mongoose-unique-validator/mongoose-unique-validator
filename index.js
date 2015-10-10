'use strict';

/**
 * Builds query to find any duplicate records.
 *
 * @param {string} conditions Path/value conditions.
 * @param {object} id ObjectID of self
 * @return {object} MongoDB query object
 */
var buildQuery = function buildQuery(conditions, id) {
    // Build a base query, ensure duplicates aren't ourself
    var query = { $and: [{
        _id: {
            $ne: id
        }
    }] };

    // Match target path
    query.$and = query.$and.concat(conditions);

    return query;
};

// Export the mongoose plugin
module.exports = function(schema, options) {
    options = options || {};
    var message = options.message || 'Error, expected `{PATH}` to be unique. Value: `{VALUE}`';

    schema.indexes().forEach(function(index) {
        var paths = Object.keys(index[0]);
        var indexOptions = index[1];

        if (indexOptions.unique) {
            paths.forEach(function(path) {
                var pathMessage = message;
                if (typeof indexOptions.unique === 'string') {
                    pathMessage = indexOptions.unique;
                }

                schema.path(path).validate(function(value, respond) {
                    var doc = this;

                    var conditions = [];
                    paths.forEach(function(path) {
                        var condition = {};
                        condition[path] = doc[path];
                        conditions.push(condition);
                    });

                    // Awaiting more official way to obtain reference to model.
                    // https://github.com/Automattic/mongoose/issues/3430
                    var model = doc.model(doc.constructor.modelName);
                    var query = buildQuery(conditions, doc._id);
                    model.findOne(query, function(err, document) {
                        respond(!document);
                    });
                }, pathMessage);
            });
        }
    });
};
