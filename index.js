var _ = require('underscore');

module.exports = function (schema, options) {
    var mongoose = options.mongoose;
    _.each(schema.paths, function (schemaType, path) {
        if (schemaTypeHasUniqueIndex(schemaType)) {
            var validator = buildUniqueValidator(path, mongoose);
            schemaType.validate(validator, 'unique');
        }
    });
};

function schemaTypeHasUniqueIndex(schemaType) {
    return schemaType._index && schemaType._index.unique;
}

function buildUniqueValidator(path, mongoose) {
    return function (value, respond) {
        var model = mongoose.connection.model(this.constructor.modelName);
        var id = this._id;
        var query = buildQuery(path, value, id);
        var callback = buildValidationCallback(respond);
        model.findOne(query, callback);
    };
}

function buildQuery(field, value, id) {
    var query = { $and: [] };
    var target = {};
    target[field] = value;
    query.$and.push({ _id: { $ne: id } });
    query.$and.push(target);
    return query;
}

function buildValidationCallback(respond) {
    return function (err, document) {
        respond(!document);
    };
}
