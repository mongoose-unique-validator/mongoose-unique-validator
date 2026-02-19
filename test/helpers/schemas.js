import mongoose from 'mongoose'

export function createUserSchema() {
  return new mongoose.Schema({
    username: {
      type: String,
      unique: true
    },
    email: {
      type: String,
      index: true,
      unique: true
    },
    password: {
      type: String
    }
  })
}

export function createUserCaseInsensitiveSchema() {
  return new mongoose.Schema({
    username: {
      type: String,
      unique: true
    },
    email: {
      type: String,
      index: true,
      unique: true,
      uniqueCaseInsensitive: true
    },
    password: {
      type: String
    }
  })
}

export function createUserPartialFilterExpressionSchema() {
  return new mongoose.Schema({
    username: {
      type: String
    },
    email: {
      type: String,
      index: {
        unique: true,
        partialFilterExpression: {
          active: true
        }
      }
    },
    password: {
      type: String
    },
    active: {
      type: Boolean
    }
  })
}

export function createCompoundIndexSchema() {
  const schema = new mongoose.Schema({
    username: {
      type: String
    },
    email: {
      type: String,
      index: true
    },
    password: {
      type: String
    }
  })

  schema.index({ username: 1, email: 1 }, { unique: true })

  return schema
}

export function createCaseInsensitiveCompoundIndexSchema() {
  const schema = new mongoose.Schema({
    username: {
      type: String
    },
    email: {
      type: String,
      index: true
    },
    password: {
      type: String
    }
  })

  schema.index(
    { username: 1, email: 1 },
    { unique: true, uniqueCaseInsensitive: true }
  )

  return schema
}

export function createCustomIdSchema() {
  return new mongoose.Schema({
    position: Number
  })
}

export function createSparseUserSchema() {
  return new mongoose.Schema({
    username: {
      type: String,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      index: true,
      unique: true
    }
  })
}

export function createNestedFieldUserSchema() {
  return new mongoose.Schema({
    username: {
      type: String,
      unique: true
    },
    contact: {
      email: {
        type: String,
        index: true,
        unique: true
      }
    },
    password: {
      type: String
    }
  })
}

export function createUniqueIDSchemaNonStrict() {
  return new mongoose.Schema(
    {
      uid: {
        type: 'String',
        required: true,
        unique: true
      }
    },
    { strict: false }
  )
}

export function createArrayOfNestedUserSchema() {
  return new mongoose.Schema({
    username: {
      type: String,
      unique: true
    },
    contacts: [
      {
        email: {
          type: String,
          index: true,
          unique: true
        }
      }
    ],
    password: {
      type: String
    }
  })
}

export function createNestedUserSchema(uniqueValidator) {
  const ContactSchema = new mongoose.Schema({
    email: {
      type: String,
      index: true,
      unique: true,
      required: true
    }
  })

  const Schema = new mongoose.Schema({
    username: {
      type: String,
      unique: true
    },
    contact: ContactSchema,
    password: {
      type: String
    }
  })
  Schema.plugin(uniqueValidator)

  return Schema
}

export function createDiscriminatorPartialFilterSchema() {
  const schema = new mongoose.Schema(
    {
      field1: { type: String },
      field2: { type: String }
    },
    { discriminatorKey: 'type' }
  )

  schema.index(
    { field1: 1, field2: 1 },
    {
      unique: true,
      partialFilterExpression: { type: 'TypeB' }
    }
  )

  return schema
}
