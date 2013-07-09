var _ = require('underscore');

module.exports = function (schema, options) {
    var connection = options.connection;
    _.each(schema.paths, function (schemaType, path) {
        if (schemaTypeHasUniqueIndex(schemaType)) {
            var validator = buildUniqueValidator(path, connection);
            schemaType.validate(validator, 'duplicate');
        }
    });
};

function schemaTypeHasUniqueIndex(schemaType) {
    return schemaType._index && schemaType._index.unique;
}

function buildUniqueValidator(path, connection) {
    return function (value, respond) {
        var model = connection.model(this.constructor.modelName);
        var query = buildQuery(path, value);
        var callback = buildValidationCallback(respond);
        model.findOne(query, callback);
    };
}

function buildQuery(field, value) {
    var query = {};
    query[field] = value;
    return query;
}

function buildValidationCallback(respond) {
    return function (err, document) {
        respond(!document);
    };
}