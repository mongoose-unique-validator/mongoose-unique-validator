import uniqueValidator from '../index.js'
import mongoose from 'mongoose'

export async function afterEachCommon() {
  const collections = Object.keys(mongoose.connection.collections)
  for (let coll of collections) {
    try {
      await mongoose.connection.collections[coll].deleteMany({})
    } catch {
      // Collection may not exist
    }
  }
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.models = {}
  uniqueValidator.defaults = {}
}

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

export const USERS = [
  {
    username: 'JohnSmith',
    email: 'john.smith@gmail.com',
    password: 'j0hnNYb0i'
  },
  {
    username: 'Robert Miller',
    email: 'bob@robertmiller.com',
    password: '@b0B#b0B$b0B%'
  },
  {
    email: 'john.smith@gmail.com'
  },
  {
    email: 'bob@robertmiller.com'
  },
  {
    email: 'john.smith@gmail.com',
    username: 'JohnSmith'
  },
  {
    email: 'john.smith2000@gmail.com',
    username: 'JohnSmith'
  }
]

export const USERS_REGEX = [
  {
    username: 'JohnSmith0',
    email: 'john0smith@gmail.com',
    password: 'j0hnNYb0i0'
  },
  {
    username: 'JohnSmith',
    email: 'john.smith@gmail.com',
    password: 'j0hnNYb0i'
  }
]

export const USERS_PARTIAL_FILTER_EXPRESSION = [
  {
    username: 'JaneSmith',
    email: 'jane.smith@gmail.com',
    password: 'j4n3Ru13s',
    active: true
  },
  {
    username: 'Robert Miller',
    email: 'bob@robertmiller.com',
    password: '@b0B#b0B$b0B%',
    active: true
  },
  {
    username: 'JaneSmith',
    email: 'jane.smith@gmail.com',
    password: 'j4n3Ru13s',
    active: false
  }
]

export const USERS_NESTED_ARRAY = [
  {
    username: 'JenSmith',
    contacts: [{ email: 'jen.smith@gmail.com' }],
    password: 'OMGitsJen'
  },
  {
    username: 'SamSmith',
    contacts: [{ email: 'sam.smith@gmail.com' }],
    password: 'SamRules1000'
  }
]
