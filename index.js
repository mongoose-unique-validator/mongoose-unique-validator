'use strict';

const each = require('lodash.foreach');
const get = require('lodash.get');
const merge = require('lodash.merge');

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

const plugin = function(schema, options) {
    options = options || {};
    const type = options.type || plugin.defaults.type || 'unique';
    const message = options.message || plugin.defaults.message || 'Error, expected `{PATH}` to be unique. Value: `{VALUE}`';

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
                        return new Promise((resolve, reject) => {
                            const isQuery = this.constructor.name === 'Query';
                            const conditions = {};
                            let model;

                            if (isQuery) {
                                // If the doc is a query, this is a findAndUpdate.
                                each(paths, (name) => {
                                    let pathValue = get(this, '_update.' + name) || get(this, '_update.$set.' + name);

                                    // Wrap with case-insensitivity
                                    if (get(path, 'options.uniqueCaseInsensitive') || indexOptions.uniqueCaseInsensitive) {
                                        // Escape RegExp chars
                                        pathValue = pathValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
                                        pathValue = new RegExp('^' + pathValue + '$', 'i');
                                    }

                                    conditions[name] = pathValue;
                                });

                                // Use conditions the user has with find*AndUpdate
                                each(this._conditions, (value, key) => {
                                    conditions[key] = { $ne: value };
                                });

                                model = this.model;
                            } else {
                                const parentDoc = this.parent();
                                const isNew = parentDoc.isNew;

                                if (!isNew && !parentDoc.isModified(pathName)) {
                                    return resolve(true);
                                }

                                // https://mongoosejs.com/docs/subdocs.html#subdocuments-versus-nested-paths
                                const isSubdocument = this._id !== parentDoc._id;
                                const isNestedPath = isSubdocument ? false : pathName.split('.').length > 1;

                                each(paths, (name) => {
                                    let pathValue;
                                    if (isSubdocument) {
                                        pathValue = get(this, name.split('.').pop());
                                    } else if (isNestedPath) {
                                        const keys = name.split('.');
                                        pathValue = get(this, keys[0]);
                                        for (let i = 1; i < keys.length; i++) {
                                            const key = keys[i];
                                            pathValue = get(pathValue, key);
                                        }
                                    } else {
                                        pathValue = get(this, name);
                                    }

                                    // Wrap with case-insensitivity
                                    if (get(path, 'options.uniqueCaseInsensitive') || indexOptions.uniqueCaseInsensitive) {
                                        // Escape RegExp chars
                                        pathValue = pathValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
                                        pathValue = new RegExp('^' + pathValue + '$', 'i');
                                    }

                                    conditions[name] = pathValue;
                                });

                                if (!isNew && this._id) {
                                    conditions._id = { $ne: this._id };
                                }

                                // Obtain the model depending on context
                                // https://github.com/Automattic/mongoose/issues/3430
                                // https://github.com/Automattic/mongoose/issues/3589
                                if (isSubdocument) {
                                    model = this.ownerDocument().model(this.ownerDocument().constructor.modelName);
                                } else if (isFunc(this.model)) {
                                    model = this.model(this.constructor.modelName);
                                } else {
                                    model = this.constructor.model(this.constructor.modelName);
                                }
                            }

                            if (indexOptions.partialFilterExpression) {
                                merge(conditions, indexOptions.partialFilterExpression);
                            }

                            // Is this model a discriminator and the unique index is on the whole collection,
                            // not just the instances of the discriminator? If so, use the base model to query.
                            // https://github.com/Automattic/mongoose/issues/4965
                            // eslint-disable-next-line
                            if (model.baseModelName && (indexOptions.partialFilterExpression === null || indexOptions.partialFilterExpression === undefined)) {
                                model = model.db.model(model.baseModelName);
                            }

                            model.find(conditions).countDocuments()
                                .then((count) => {
                                    resolve(count === 0);
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                        });
                    }, pathMessage, type);
                }
            });
        }
    });
};

plugin.defaults = {};

// Export the mongoose plugin
module.exports = plugin;
