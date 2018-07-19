'use strict';

const each = require('lodash.foreach');
const get = require('lodash.get');

// Function typecheck helper
const isFunc = (val) => typeof val === 'function';

const deepPath = function(schema, pathName) {
    let path;
    const paths = pathName.split('.');

    if (paths.length > 1) {
        pathName = paths.shift();
    }

    if (isFunc(schema.path)) {
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
    const type = options.type || 'unique';
    const message = options.message || 'Error, expected `{PATH}` to be unique. Value: `{VALUE}`';

    // Mongoose Schema objects don't describe default _id indexes
    // https://github.com/Automattic/mongoose/issues/5998
    const indexes = [[{ _id: 1 }, { unique: true }]].concat(schema.indexes());

    // Dynamically iterate all indexes
    each(indexes, (index) => {
        const indexOptions = index[1];

        if (indexOptions.unique) {
            const paths = Object.keys(index[0]);
            each(paths, (pathName) => {
                // Choose error message
                const pathMessage = typeof indexOptions.unique === 'string' ? indexOptions.unique : message;

                // Obtain the correct path object
                const path = deepPath(schema, pathName) || schema.path(pathName);

                if (path) {
                    // Add an async validator
                    path.validate(function() {
                        return new Promise((resolve) => {
                            const isSubdocument = isFunc(this.ownerDocument);
                            const isQuery = this.constructor.name === 'Query';
                            const parentDoc = isSubdocument ? this.ownerDocument() : this;
                            const isNew = typeof parentDoc.isNew === 'boolean' ? parentDoc.isNew : !isQuery;

                            let conditions = [];
                            each(paths, (name) => {
                                let pathValue;

                                // If the doc is a query, this is a findAndUpdate
                                if (isQuery) {
                                    pathValue = get(this, '_update.' + name) || get(this, '_update.$set.' + name);
                                } else {
                                    pathValue = get(this, isSubdocument ? name.split('.').pop() : name);
                                }

                                // Wrap with case-insensitivity
                                if (get(path, 'options.uniqueCaseInsensitive') || indexOptions.uniqueCaseInsensitive) {
                                    pathValue = new RegExp('^' + pathValue + '$', 'i');
                                }

                                conditions.push({ [name]: pathValue });
                            });

                            if (!isNew) {
                                // Use conditions the user has with find*AndUpdate
                                if (isQuery) {
                                    each(this._conditions, (value, key) => {
                                        conditions.push({ [key]: { $ne: value } });
                                    });
                                } else if (this._id) {
                                    conditions.push({ _id: { $ne: this._id } });
                                }
                            }

                            // Obtain the model depending on context
                            // https://github.com/Automattic/mongoose/issues/3430
                            // https://github.com/Automattic/mongoose/issues/3589
                            let model;
                            if (isQuery) {
                                model = this.model;
                            } else if (isSubdocument) {
                                model = this.ownerDocument().model(this.ownerDocument().constructor.modelName);
                            } else if (isFunc(this.model)) {
                                model = this.model(this.constructor.modelName);
                            }

                            model.where({ $and: conditions }).countDocuments((err, count) => {
                                resolve(count === 0);
                            });
                        });
                    }, pathMessage, type);
                }
            });
        }
    });
};
