import uniqueValidator from '../../index.js'
import * as helpers from '../helpers.js'
import { expect } from 'chai'

export default function (mongoose) {
  describe('Messages', function () {
    afterEach(helpers.afterEachCommon)

    it('uses default validation message', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS[0]).save()

      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.username.message).to.equal(
          'Error, expected `username` to be unique. Value: `JohnSmith`'
        )
      }
    })

    it('uses custom message via options', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator, {
          message: 'Path: {PATH}, value: {VALUE}, type: {TYPE}'
        })
      )

      // Save the first user
      await new User(helpers.USERS[0]).save()

      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.username.message).to.equal(
          'Path: username, value: JohnSmith, type: unique'
        )
        expect(err.errors.email.message).to.equal(
          'Path: email, value: john.smith@gmail.com, type: unique'
        )
      }
    })

    it('uses custom message from default plugin configuration', async function () {
      uniqueValidator.defaults.message =
        'Path: {PATH}, value: {VALUE}, type: {TYPE}'
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      // Save the first user
      await new User(helpers.USERS[0]).save()

      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.username.message).to.equal(
          'Path: username, value: JohnSmith, type: unique'
        )
        expect(err.errors.email.message).to.equal(
          'Path: email, value: john.smith@gmail.com, type: unique'
        )
      }
    })
  })
}
