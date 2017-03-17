'use strict';

var each = require('lodash.foreach');
var get = require('lodash.get');

var deepPath = function(schema, pathName) {
    var path;
    var paths = pathName.split('.');

    if (paths.length > 1) {
        pathName = paths.shift();
    }

    if (typeof schema.path === 'function') {
        path = schema.path(pathName);
    }

    if (path && path.schema) {
        path = deepPath(path.schema, paths.join('.'));
    }

    return path;
};

// Export the mongoose plugin
module.exports = function(schema, options) {
    options = options || {};
    var type = options.type || 'unique';
    var message = options.message || 'Error, expected `{PATH}` to be unique. Value: `{VALUE}`';

    // Dynamically iterate all indexes
    schema.indexes().forEach(function(index) {
        var indexOptions = index[1];

        if (indexOptions.unique) {
            var paths = Object.keys(index[0]);
            paths.forEach(function(pathName) {
                // Choose error message
                var pathMessage = message;
                if (typeof indexOptions.unique === 'string') {
                    pathMessage = indexOptions.unique;
                }

                // Obtain the correct path object
                var path = deepPath(schema, pathName);

                // Nested objects without schemas may be accessible this way
                if (!path) {
                    path = schema.path(pathName);
                }

                if (path) {
                    // Add an async validator
                    path.validate(function() {
                        var doc = this;

                        return new Promise(function(resolve) {
                            var isSubdocument = typeof doc.ownerDocument === 'function';
                            var isQuery = doc.constructor.name === 'Query';
                            var parentDoc = isSubdocument ? doc.ownerDocument() : doc;
                            var isNew = typeof parentDoc.isNew === 'boolean' ? parentDoc.isNew : !isQuery;

                            var conditions = [];
                            paths.forEach(function(name) {
                                var pathValue;

                                // If the doc is a query, this is a findAndUpdate
                                if (isQuery) {
                                    pathValue = get(doc, '_update.' + name) || get(doc, '_update.$set.' + name);
                                } else {
                                    pathValue = get(doc, isSubdocument ? name.split('.').pop() : name);
                                }

                                // Wrap with case-insensitivity
                                if (path.options && path.options.uniqueCaseInsensitive) {
                                    pathValue = new RegExp('^' + pathValue + '$', 'i');
                                }

                                var condition = {};
                                condition[name] = pathValue;

                                conditions.push(condition);
                            });

                            if (!isNew) {
                                // Use conditions the user has with find*AndUpdate
                                if (isQuery) {
                                    each(doc._conditions, function(value, key) {
                                        var cond = {};
                                        cond[key] = { $ne: value };
                                        conditions.push(cond);
                                    });
                                } else if (doc._id) {
                                    conditions.push({ _id: { $ne: doc._id } });
                                }
                            }

                            // Obtain the model depending on context
                            // https://github.com/Automattic/mongoose/issues/3430
                            // https://github.com/Automattic/mongoose/issues/3589
                            var model;
                            if (doc.constructor.name === 'Query') {
                                model = doc.model;
                            } else if (isSubdocument) {
                                model = doc.ownerDocument().model(doc.ownerDocument().constructor.modelName);
                            } else if (typeof doc.model === 'function') {
                                model = doc.model(doc.constructor.modelName);
                            }

                            model.where({ $and: conditions }).count(function(err, count) {
                                resolve(count === 0);
                            });
                        });
                    }, pathMessage, type);
                }
            });
        }
    });
};
