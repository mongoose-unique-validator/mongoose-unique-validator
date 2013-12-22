mongoose-unique-validator
=========================

mongoose-unique-validator is a plugin which adds pre-save validation for unique fields within a Mongoose schema.

This makes error handling much easier, since you will get a Mongoose validation error when you attempt to violate a
[unique constraint](http://mongoosejs.com/docs/api.html#schematype_SchemaType-unique), rather than an E11000 error
from MongoDB.

Usage
-----

```
npm install mongoose-unique-validator
```

Then, simply apply the plugin to your schema:

```js
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var mySchema = mongoose.Schema(/* put your schema definition here */);
mySchema.plugin(uniqueValidator);
```

Example
-------

Let’s say you have a user schema. You can easily add validation for the unique constraints in this schema by applying
the `uniqueValidator` plugin to your user schema:

```js
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

// Define your schema as normal.
var userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, index: true, unique: true, required: true },
    password: { type: String, required: true }
});

// Apply the uniqueValidator plugin to userSchema.
userSchema.plugin(uniqueValidator);
```

Now when you try to save a user, the unique validator will check for duplicate database entries and report them just
like any other validation error:

```js
var user = new User({ username: 'JohnSmith', email: 'john.smith@gmail.com', password: 'j0hnNYb0i' });
user.save(function (err) {
    console.log(err);
});
```

```js
{
    message: 'Validation failed',
    name: 'ValidationError',
    errors: {
        username: {
            message: 'Validator failed for path `username` with value `JohnSmith`',
            name: 'ValidatorError',
            path: 'username',
            type: 'user defined',
            value: 'JohnSmith'
        }
    }
}
```

Custom Error Messages
---------------------

You can pass through a custom error message as part of the optional `options` argument:

```js
userSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });
```

You have access to all of the standard Mongoose error message templating:

*   `{PATH}`
*   `{VALUE}`
*   `{TYPE}`