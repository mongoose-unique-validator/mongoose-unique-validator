import uniqueValidator from '../../../index.js'
import * as helpers from '../../helpers/index.js'
import { expect } from 'chai'

export default function (mongoose) {
  describe('Query Context', function () {
    afterEach(helpers.afterEachCommon)

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

    // Regression: when the filter field is also the unique field being updated to the
    // same value, the $ne exclusion must not overwrite the equality check, causing
    // false positives when other documents exist in the collection.
    it('does not throw error when keeping unique field value unchanged via findOneAndUpdate with multiple records', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      await User.insertMany([helpers.USERS[0], helpers.USERS[1]])

      const result = await User.findOneAndUpdate(
        { email: helpers.USERS[0].email },
        { email: helpers.USERS[0].email, username: 'JohnSmith' },
        { runValidators: true, context: 'query' }
      ).exec()
      expect(result).to.be.an('object')
    })

    it('does not throw error when keeping unique field value unchanged via updateOne with multiple records', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      await User.insertMany([helpers.USERS[0], helpers.USERS[1]])

      await User.updateOne(
        { email: helpers.USERS[0].email },
        { email: helpers.USERS[0].email, username: 'JohnSmith' },
        { runValidators: true, context: 'query' }
      )
    })

    it('does not throw error when keeping unique field value unchanged via findOneAndUpdate using $set with multiple records', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      await User.insertMany([helpers.USERS[0], helpers.USERS[1]])

      const result = await User.findOneAndUpdate(
        { email: helpers.USERS[0].email },
        { $set: { email: helpers.USERS[0].email, username: 'JohnSmith' } },
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

    it('does not throw error when saving self with new unique value via updateOne', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      const user = new User(helpers.USERS[0])

      // Save a user
      await user.save()
      await User.updateOne(
        { email: helpers.USERS[0].email },
        { email: 'somethingNew@example.com', username: 'JohnSmith' },
        { runValidators: true, context: 'query' }
      )
    })

    it('throws error when saving self with new duplicate value via updateOne', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()

      const user = new User(helpers.USERS[1])
      await user.save()

      try {
        await User.updateOne(
          { email: helpers.USERS[0].email },
          { email: helpers.USERS[1].email },
          { runValidators: true, context: 'query' }
        )

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
  })
}
