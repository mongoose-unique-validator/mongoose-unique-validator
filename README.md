# mongoose-unique-validator

[![npm version](https://img.shields.io/npm/v/mongoose-unique-validator)](https://www.npmjs.com/package/mongoose-unique-validator)
[![CI](https://github.com/mongoose-unique-validator/mongoose-unique-validator/actions/workflows/ci.yml/badge.svg)](https://github.com/mongoose-unique-validator/mongoose-unique-validator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/mongoose-unique-validator)](LICENSE.txt)

mongoose-unique-validator is a plugin which adds pre-save validation for unique fields within a Mongoose schema.

This makes error handling much easier, since you will get a Mongoose validation error when you attempt to violate a
[unique constraint](http://mongoosejs.com/docs/api.html#schematype_SchemaType-unique), rather than an E11000 error
from MongoDB.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Find + Updates](#find--updates)
- [Custom Error Types](#custom-error-types)
- [Custom Error Messages](#custom-error-messages)
- [Custom Error Codes](#custom-error-codes)
- [Global Defaults](#global-defaults)
- [Case Insensitive](#case-insensitive)
- [Additional Conditions](#additional-conditions)
- [Caveats](#caveats)

## Installation

```sh
npm install mongoose-unique-validator
# or
yarn add mongoose-unique-validator
# or
pnpm add mongoose-unique-validator
```

## Quick Start

Apply the plugin to your schema:

```js
import mongoose from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, index: true, unique: true, required: true },
  password: { type: String, required: true }
})

userSchema.plugin(uniqueValidator)
```

Now when you try to save a duplicate, the error is reported as a standard Mongoose `ValidationError`:

```js
try {
  const user = new User({
    username: 'JohnSmith',
    email: 'john.smith@gmail.com',
    password: 'j0hnNYb0i'
  })

  await user.save()
} catch (err) {
  // err.name === 'ValidationError'
}
```

```js
{
    message: 'Validation failed',
    name: 'ValidationError',
    errors: {
        username: {
            message: 'Error, expected `username` to be unique. Value: `JohnSmith`',
            name: 'ValidatorError',
            kind: 'unique',
            path: 'username',
            value: 'JohnSmith'
        }
    }
}
```

## Find + Updates

`findOneAndUpdate` and related methods don't run validation by default. Pass `{ runValidators: true, context: 'query' }` to enable it:

```js
User.findOneAndUpdate(
  { email: 'old-email@example.com' },
  { email: 'new-email@example.com' },
  { runValidators: true, context: 'query' },
  function (err) {
    // ...
  }
)
```

> `context: 'query'` is required — without it this plugin cannot access the update values.

## Custom Error Types

Pass a `type` option to control the `kind` field on the `ValidatorError`:

```js
userSchema.plugin(uniqueValidator, { type: 'mongoose-unique-validator' })
```

```js
{
    errors: {
        username: {
            kind: 'mongoose-unique-validator',  // <--
            ...
        }
    }
}
```

You can also set this globally — see [Global Defaults](#global-defaults).

## Custom Error Messages

Pass a `message` option to customize the error message. The following template variables are available:

- `{PATH}` — the field name
- `{VALUE}` — the duplicate value
- `{TYPE}` — the error kind

```js
userSchema.plugin(uniqueValidator, {
  message: 'Error, expected {PATH} to be unique.'
})
```

You can also set this globally — see [Global Defaults](#global-defaults).

## Custom Error Codes

Pass a `code` option to attach a numeric or string code to each `ValidatorError`:

```js
userSchema.plugin(uniqueValidator, { code: 11000 })
```

The code is available under `properties.code`:

```js
{
    errors: {
        username: {
            properties: {
                code: 11000  // <--
            },
            ...
        }
    }
}
```

You can also set this globally — see [Global Defaults](#global-defaults).

## Global Defaults

Instead of passing options to every `schema.plugin(uniqueValidator, ...)` call, set defaults once at startup. Per-schema options always take precedence.

```js
import uniqueValidator from 'mongoose-unique-validator'

uniqueValidator.defaults.type = 'mongoose-unique-validator'
uniqueValidator.defaults.message = 'Error, expected {PATH} to be unique.'
uniqueValidator.defaults.code = 11000
```

## Case Insensitive

Add `uniqueCaseInsensitive: true` to a field to treat values as case-insensitively equal. For example, `john.smith@gmail.com` and `John.Smith@gmail.com` will be considered duplicates.

```js
const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: {
    type: String,
    index: true,
    unique: true,
    required: true,
    uniqueCaseInsensitive: true
  },
  password: { type: String, required: true }
})
```

## Additional Conditions

Use MongoDB's `partialFilterExpression` to scope the uniqueness constraint. For example, to only enforce uniqueness among non-deleted records:

```js
const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: {
    type: String,
    required: true,
    index: {
      unique: true,
      partialFilterExpression: { deleted: false }
    }
  },
  password: { type: String, required: true }
})
```

> **Note:** `index` must be an object containing `unique: true` — shorthand like `index: true, unique: true` will cause `partialFilterExpression` to be ignored.

## Caveats

This plugin validates uniqueness by querying the database before save. Because two saves can run concurrently, both can read a count of zero and then both proceed to insert — resulting in a duplicate that MongoDB's unique index will reject with a raw E11000 error rather than a Mongoose `ValidationError`.

This plugin is therefore a **UX layer**, not a correctness guarantee. The unique index on the MongoDB collection remains the true enforcement mechanism and should always be kept in place. For most applications the race window is negligible, but in high-concurrency write scenarios be aware that the E11000 path is still reachable.
