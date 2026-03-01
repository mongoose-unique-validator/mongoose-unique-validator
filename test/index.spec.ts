import codesSpec from './tests/codes.spec.js'
import messagesSpec from './tests/messages.spec.js'
import typesSpec from './tests/types.spec.js'
import validationSpec from './tests/validation/index.spec.js'
import mongoose from 'mongoose'

try {
  await mongoose.connect('mongodb://127.0.0.1:27017/mongoose-unique-validator')
  console.log('Connected to the database...')
} catch (err) {
  console.error(err)

  throw err
}

describe('Mongoose Unique Validator', function () {
  validationSpec(mongoose)
  typesSpec(mongoose)
  messagesSpec(mongoose)
  codesSpec(mongoose)

  after(function () {
    mongoose.connection.dropDatabase()
  })
})
