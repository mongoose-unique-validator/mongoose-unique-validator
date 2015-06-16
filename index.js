module.exports = function (schema, options) {
    options = options || {};
    var message = options.message || 'Error, expected `{PATH}` to be unique. Value: `{VALUE}`';
    var type = options.type || options.kind || 'unique';
    schema.eachPath(function (path, schemaType) {
        if (schemaTypeHasUniqueIndex(schemaType)) {
            var validator = buildUniqueValidator(path);
            message = buildMessage(schemaType.options.unique, message);
            schemaType.validate(validator, { message: message, type: type });
        }
    });
};

function buildMessage(uniqueOption, message){
    return typeof uniqueOption === 'string' ? uniqueOption : message;
}

function schemaTypeHasUniqueIndex(schemaType) {
    return schemaType._index && schemaType._index.unique;
}

function buildUniqueValidator(path) {
    return function (value, respond) {
        var model = this.model(this.constructor.modelName);
        var query = buildQuery(path, value, this._id);
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
