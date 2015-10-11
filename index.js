'use strict';

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
                    var query = { $and: conditions };
                    model.where(query).count(function(err, count) {
                        respond(((doc.isNew && count === 0) || (!doc.isNew && count === 1)));
                    });
                }, pathMessage);
            });
        }
    });
};
