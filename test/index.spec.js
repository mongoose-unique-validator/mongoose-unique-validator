import messagesSpec from './tests/messages.spec.js'
import typesSpec from './tests/types.spec.js'
import validationSpec from './tests/validation.spec.js'
import mongoose from 'mongoose'

try {
  await mongoose.connect('mongodb://127.0.0.1:27017/mongoose-unique-validator')
  // eslint-disable-next-line no-undef
  console.log('Connected to the database...')
} catch (err) {
  // eslint-disable-next-line no-undef
  console.error(err)

  throw err
}

describe('Mongoose Unique Validator', function () {
  validationSpec(mongoose)
  typesSpec(mongoose)
  messagesSpec(mongoose)

  after(function () {
    mongoose.connection.dropDatabase()
  })
})
