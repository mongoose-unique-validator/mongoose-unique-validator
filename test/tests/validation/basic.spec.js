import uniqueValidator from '../../../index.js'
import * as helpers from '../../helpers/index.js'
import { expect } from 'chai'

export default function (mongoose) {
  describe('Basic', function () {
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

    it('does not throw error when using static Model.validate()', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      // Static Model.validate() runs validators with `this` as a plain object,
      // not a Mongoose Document. Uniqueness cannot be DB-checked in this context,
      // so the plugin should skip uniqueness validation rather than crash.
      await User.validate({
        username: helpers.USERS[0].username,
        email: helpers.USERS[0].email,
        password: helpers.USERS[0].password
      })
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
  })
}
