import uniqueValidator from '../../index.js'
import * as helpers from '../helpers.js'
import { expect } from 'chai'

export default function (mongoose) {
  describe('Validation', function () {
    afterEach(helpers.afterEachCommon)

    it('allows unique records', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS[0]).save()

      // Try saving a unique user
      await new User(helpers.USERS[1]).save()
    })

    it('allows unique records with regex wildcards', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserCaseInsensitiveSchema().plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS_REGEX[0]).save()

      // Try saving a unique user with email that has a regex wildcard
      const res = await new User(helpers.USERS_REGEX[1]).save()
      expect(res.email).to.equal(helpers.USERS_REGEX[1].email)
    })

    it('allows unique records with partial filter expression', async function () {
      const User = mongoose.model(
        'Employee',
        helpers
          .createUserPartialFilterExpressionSchema()
          .plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save()

      // Try saving a unique user
      await new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[1]).save()
    })

    it('throws error for single index violation', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS[0]).save()

      // Try saving a duplicate
      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.username.name).to.equal('ValidatorError')
        expect(err.errors.username.kind).to.equal('unique')
        expect(err.errors.username.path).to.equal('username')
        expect(err.errors.username.value).to.equal('JohnSmith')

        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('john.smith@gmail.com')
      }
    })

    it('throws error for compound index violation', async function () {
      const User = mongoose.model(
        'User',
        helpers.createCompoundIndexSchema().plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS[0]).save()

      // Try saving a duplicate
      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.username.name).to.equal('ValidatorError')
        expect(err.errors.username.kind).to.equal('unique')
        expect(err.errors.username.path).to.equal('username')
        expect(err.errors.username.value).to.equal('JohnSmith')
      }
    })

    it('throws an error for partial filter expression index violation', async function () {
      const User = mongoose.model(
        'Employee',
        helpers
          .createUserPartialFilterExpressionSchema()
          .plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save()

      // Try saving a duplicate
      try {
        await new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('jane.smith@gmail.com')
      }
    })

    it('does not throw error when saving self', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      const user = new User(helpers.USERS[0])

      // Save a user
      await user.save()
      user.password = 'somethingNew'

      await user.save()
    })

    it('does not throw error when saving self with new unique value', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      const user = new User(helpers.USERS[0])

      // Save a user
      await user.save()
      user.email = 'somethingNew@example.com'

      const result = await user.save()
      expect(result).to.be.an('object')
    })

    it('does not throw error when saving self with new unique value via findOneAndUpdate', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      const user = new User(helpers.USERS[0])

      // Save a user
      await user.save()
      const result = await User.findOneAndUpdate(
        { email: helpers.USERS[0].email },
        {
          email: 'somethingNew@example.com',
          username: 'JohnSmith'
        },
        { runValidators: true, context: 'query' }
      ).exec()
      expect(result).to.be.an('object')
    })

    it('does not throw error when saving self with new unique value via findByIdAndUpdate', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      const user = new User(helpers.USERS[0])

      // Save a user
      await user.save()
      const result = await User.findByIdAndUpdate(
        user._id,
        {
          email: 'somethingNew@example.com',
          username: 'JohnSmith'
        },
        { runValidators: true, context: 'query' }
      ).exec()
      expect(result).to.be.an('object')
    })

    // addresses https://github.com/blakehaswell/mongoose-unique-validator/issues/108
    it('does not throw error when saving self with new unique value via findByIdAndUpdate with multiple records', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      // Save a user
      const createdUsers = await User.insertMany([
        helpers.USERS[0],
        helpers.USERS[1]
      ])

      const result = await User.findByIdAndUpdate(
        createdUsers[0]._id,
        {
          email: 'somethingNew@example.com',
          username: 'JohnSmith'
        },
        { runValidators: true, context: 'query' }
      ).exec()

      expect(result).to.be.an('object')
    })

    it('does not throw error when saving self with new unique value via findById', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      const user = new User(helpers.USERS[0])

      // Save a user
      await user.save()
      const foundUser = await User.findById(user._id)
      foundUser.email = 'somethingNew@example.com'
      foundUser.username = 'JohnSmith'

      const result = await foundUser.save()
      expect(result).to.be.an('object')
    })

    // addresses https://github.com/blakehaswell/mongoose-unique-validator/issues/108
    it('does not throw error when saving self with new unique value via findById with multiple records', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      // Save a user
      const createdUsers = await User.insertMany([
        helpers.USERS[0],
        helpers.USERS[1]
      ])

      const foundUser = await User.findById(createdUsers[0]._id)
      foundUser.email = 'somethingNew@example.com'
      foundUser.username = 'JohnSmith'

      const result = await foundUser.save()
      expect(result).to.be.an('object')
    })

    it('throws error when saving self with new duplicate value', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()

      const user = new User(helpers.USERS[1])
      await user.save()

      user.email = helpers.USERS[0].email

      try {
        await user.save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('john.smith@gmail.com')
      }
    })

    it('throws error when saving self with new duplicate value via findOneAndUpdate', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()

      const user = new User(helpers.USERS[1])
      await user.save()

      try {
        await User.findOneAndUpdate(
          { email: helpers.USERS[0].email },
          { email: helpers.USERS[1].email },
          { runValidators: true, context: 'query' }
        ).exec()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('bob@robertmiller.com')
      }
    })

    it('throws error when saving self with new duplicate value via findByIdAndUpdate', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      const createdUser = await new User(helpers.USERS[0]).save()

      const user = new User(helpers.USERS[1])
      await user.save()

      try {
        await User.findByIdAndUpdate(
          createdUser._id,
          { email: helpers.USERS[1].email },
          { runValidators: true, context: 'query' }
        ).exec()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('bob@robertmiller.com')
      }
    })

    it('throws error when saving self with new duplicate value via findOneAndUpdate using $set', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()

      const user = new User(helpers.USERS[1])
      await user.save()

      try {
        await User.findOneAndUpdate(
          { email: helpers.USERS[0].email },
          {
            $set: {
              email: helpers.USERS[1].email
            }
          },
          { runValidators: true, context: 'query' }
        ).exec()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('bob@robertmiller.com')
      }
    })

    it('throws error when validating self with new duplicate value', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      // Save first record
      await new User(helpers.USERS[0]).save()

      // Save second record
      const user = new User(helpers.USERS[1])
      await user.save()

      // Try updating this record with an existing email
      user.email = helpers.USERS[0].email

      try {
        await user.validate()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('john.smith@gmail.com')
      }
    })

    it('throws error on unique violation for custom _id field', async function () {
      const Planet = mongoose.model(
        'Planet',
        helpers.createCustomIdSchema().plugin(uniqueValidator)
      )
      const id = new mongoose.Types.ObjectId('000000000000000000000141')

      // Save the first planet
      await new Planet({ _id: id }).save()

      // Try saving a duplicate
      try {
        await new Planet({ _id: id }).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors._id.name).to.equal('ValidatorError')
        expect(err.errors._id.kind).to.equal('unique')
        expect(err.errors._id.path).to.equal('_id')
      }
    })

    it('does not throw error when saving self (with custom _id field)', async function () {
      const Planet = mongoose.model(
        'Planet',
        helpers.createCustomIdSchema().plugin(uniqueValidator)
      )

      const planet = new Planet({
        _id: new mongoose.Types.ObjectId('000000000000000000000141')
      })

      // Save a planet
      await planet.save()
      planet.position = 1

      await planet.save()
    })

    it('does not throw error for sparse fields', async function () {
      const Student = mongoose.model(
        'Student',
        helpers.createSparseUserSchema().plugin(uniqueValidator)
      )

      // Save the first student without a username
      await new Student(helpers.USERS[2]).save()

      // Try saving a unique student without a username
      await new Student(helpers.USERS[3]).save()
    })

    it('does not throw error when using a partial filter expression', async function () {
      const User = mongoose.model(
        'Employee',
        helpers
          .createUserPartialFilterExpressionSchema()
          .plugin(uniqueValidator)
      )

      // Save the first (deactivated) user
      await new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[2]).save()

      // Try saving a the first user that has the same email, but is active
      await new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save()
    })

    it('throws error for duplicates in sparse fields', async function () {
      const Student = mongoose.model(
        'Student',
        helpers.createSparseUserSchema().plugin(uniqueValidator)
      )

      // Save the first student without a username
      await new Student(helpers.USERS[4]).save()

      try {
        await new Student(helpers.USERS[5]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.username.name).to.equal('ValidatorError')
        expect(err.errors.username.kind).to.equal('unique')
        expect(err.errors.username.path).to.equal('username')
        expect(err.errors.username.value).to.equal('JohnSmith')
      }
    })

    it('throws error for single index violation (case insensitive)', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserCaseInsensitiveSchema().plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS[0]).save()
      const user = new User(helpers.USERS[0])
      user.email = user.email.toUpperCase()

      // Try saving a duplicate
      try {
        await user.save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('JOHN.SMITH@GMAIL.COM')
      }
    })

    it('throws error for single nested index violation', async function () {
      const User = mongoose.model(
        'User',
        helpers.createNestedFieldUserSchema().plugin(uniqueValidator)
      )

      const nestedUser = {
        username: 'JohnSmith',
        contact: { email: 'john.smith@gmail.com' },
        password: 'j0hnNYb0i'
      }

      const otherNestedUser = {
        username: 'BobSmith',
        contact: { email: 'john.smith@gmail.com' },
        password: 'j0hnNYb0i'
      }

      // Save the first user
      await new User(nestedUser).save()

      try {
        await new User(otherNestedUser).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors['contact.email'].name).to.equal('ValidatorError')
        expect(err.errors['contact.email'].kind).to.equal('unique')
        expect(err.errors['contact.email'].path).to.equal('contact.email')
        expect(err.errors['contact.email'].value).to.equal(
          'john.smith@gmail.com'
        )
      }
    })

    it('throws error for index violation in an array of nested objects', async function () {
      const User = mongoose.model(
        'User',
        helpers.createArrayOfNestedUserSchema().plugin(uniqueValidator)
      )

      const firstUser = {
        username: 'JenSmith',
        contacts: [{ email: 'jen.smith@gmail.com' }],
        password: 'OMGitsJen'
      }

      const duplicateContactUser = {
        username: 'SamSmith',
        contacts: [{ email: 'jen.smith@gmail.com' }],
        password: 'SamRules1000'
      }

      // Save the first user
      await new User(firstUser).save()

      try {
        await new User(duplicateContactUser).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors['contacts.0.email'].name).to.equal('ValidatorError')
        expect(err.errors['contacts.0.email'].kind).to.equal('unique')
        expect(err.errors['contacts.0.email'].path).to.equal('email')
        expect(err.errors['contacts.0.email'].value).to.equal(
          'jen.smith@gmail.com'
        )
      }
    })

    it('throws error for nested schema index violation', async function () {
      const User = mongoose.model(
        'User',
        helpers.createNestedUserSchema(uniqueValidator)
      )

      const nestedUser = {
        username: 'JohnSmith',
        contact: { email: 'john.smith@gmail.com' },
        password: 'j0hnNYb0i'
      }

      const otherNestedUser = {
        username: 'BobSmith',
        contact: { email: 'john.smith@gmail.com' },
        password: 'j0hnNYb0i'
      }

      // Save the first user
      await new User(nestedUser).save()

      try {
        await new User(otherNestedUser).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors['contact.email'].name).to.equal('ValidatorError')
        expect(err.errors['contact.email'].kind).to.equal('unique')
        expect(err.errors['contact.email'].path).to.equal('email')
        expect(err.errors['contact.email'].value).to.equal(
          'john.smith@gmail.com'
        )
      }
    })

    it('throws error for compound index violation (case insensitive)', async function () {
      const User = mongoose.model(
        'User',
        helpers
          .createCaseInsensitiveCompoundIndexSchema()
          .plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS[0]).save()
      const user = new User(helpers.USERS[0])
      user.email = user.email.toUpperCase()

      // Try saving a duplicate
      try {
        await user.save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('JOHN.SMITH@GMAIL.COM')
      }
    })

    it('does not throw error when create vs save data (with model field)', async function () {
      const UID = mongoose.model(
        'UID',
        helpers.createUniqueIDSchemaNonStrict().plugin(uniqueValidator)
      )

      // Save the first user
      const payloadWithModelField = {
        uid: '12345',
        model: 'some-value'
      }

      // perform a create() vs save()
      const res = await UID.create(payloadWithModelField)
      expect(res.uid).to.equal(payloadWithModelField.uid)
      expect(res.model).to.equal(payloadWithModelField.model)
    })

    it('does not throw error when saving self with new unique value via findOneAndUpdate (case insensitive)', async function () {
      const User = mongoose.model(
        'UserCI',
        helpers.createUserCaseInsensitiveSchema().plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()

      const result = await User.findOneAndUpdate(
        { email: helpers.USERS[0].email },
        { email: 'new-unique@example.com' },
        { runValidators: true, context: 'query' }
      ).exec()
      expect(result).to.be.an('object')
    })

    it('throws error for case-insensitive index violation via findOneAndUpdate', async function () {
      const User = mongoose.model(
        'UserCI',
        helpers.createUserCaseInsensitiveSchema().plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()
      await new User(helpers.USERS[1]).save()

      try {
        await User.findOneAndUpdate(
          { email: helpers.USERS[1].email },
          { email: helpers.USERS[0].email.toUpperCase() },
          { runValidators: true, context: 'query' }
        ).exec()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('JOHN.SMITH@GMAIL.COM')
      }
    })

    it('throws error for case-insensitive index violation via findOneAndUpdate using $set', async function () {
      const User = mongoose.model(
        'UserCI',
        helpers.createUserCaseInsensitiveSchema().plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()
      await new User(helpers.USERS[1]).save()

      try {
        await User.findOneAndUpdate(
          { email: helpers.USERS[1].email },
          { $set: { email: helpers.USERS[0].email.toUpperCase() } },
          { runValidators: true, context: 'query' }
        ).exec()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('JOHN.SMITH@GMAIL.COM')
      }
    })

    it('does not throw when partially updating a case-insensitive compound index via findOneAndUpdate', async function () {
      const User = mongoose.model(
        'UserCICompound',
        helpers
          .createCaseInsensitiveCompoundIndexSchema()
          .plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()

      // Only email is updated — username is part of the same compound index but
      // absent from the update, so pathValue will be undefined. The pathValue != null
      // guard must prevent a TypeError when building the case-insensitive RegExp.
      const result = await User.findOneAndUpdate(
        { username: helpers.USERS[0].username },
        { email: 'new-unique@example.com' },
        { runValidators: true, context: 'query' }
      ).exec()
      expect(result).to.be.an('object')
    })

    it('does not throw error when using partial filter expression via findOneAndUpdate', async function () {
      const User = mongoose.model(
        'Employee',
        helpers
          .createUserPartialFilterExpressionSchema()
          .plugin(uniqueValidator)
      )

      await new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save()

      const result = await User.findOneAndUpdate(
        { username: helpers.USERS_PARTIAL_FILTER_EXPRESSION[0].username },
        { email: 'new-unique@example.com' },
        { runValidators: true, context: 'query' }
      ).exec()
      expect(result).to.be.an('object')
    })

    it('throws error for partial filter expression index violation via findOneAndUpdate', async function () {
      const User = mongoose.model(
        'Employee',
        helpers
          .createUserPartialFilterExpressionSchema()
          .plugin(uniqueValidator)
      )

      await new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[0]).save()
      await new User(helpers.USERS_PARTIAL_FILTER_EXPRESSION[1]).save()

      try {
        await User.findOneAndUpdate(
          { username: helpers.USERS_PARTIAL_FILTER_EXPRESSION[1].username },
          { email: helpers.USERS_PARTIAL_FILTER_EXPRESSION[0].email },
          { runValidators: true, context: 'query' }
        ).exec()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.email.name).to.equal('ValidatorError')
        expect(err.errors.email.kind).to.equal('unique')
        expect(err.errors.email.path).to.equal('email')
        expect(err.errors.email.value).to.equal('jane.smith@gmail.com')
      }
    })

    it('does not throw when updating nested array values', async function () {
      const User = mongoose.model(
        'User',
        helpers.createArrayOfNestedUserSchema().plugin(uniqueValidator)
      )

      // Save the first user
      const doc = await new User(helpers.USERS_NESTED_ARRAY[0]).save()

      // Try updating nested array to check if the unique validator will ignore the doc currently being updated
      doc.contacts = [
        helpers.USERS_NESTED_ARRAY[0].contacts[0],
        helpers.USERS_NESTED_ARRAY[1].contacts[0]
      ]
      await doc.save()
    })
  })
}
