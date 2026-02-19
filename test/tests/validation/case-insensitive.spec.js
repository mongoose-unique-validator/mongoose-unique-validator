import uniqueValidator from '../../../index.js'
import * as helpers from '../../helpers/index.js'
import { expect } from 'chai'

export default function (mongoose) {
  describe('Case Insensitive', function () {
    afterEach(helpers.afterEachCommon)

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
  })
}
