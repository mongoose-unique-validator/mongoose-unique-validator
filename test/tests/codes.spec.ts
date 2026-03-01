import uniqueValidator from '../../index.js'
import * as helpers from '../helpers/index.js'
import type { Mongoose, ValidationError } from '../types.js'
import { expect } from 'chai'

export default function (mongoose: Mongoose) {
  describe('Codes', function () {
    afterEach(helpers.afterEachCommon)

    it('has no code property by default', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()

      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        const e = err as ValidationError
        expect(e.errors.username.properties.code).to.be.undefined
      }
    })

    it('uses custom code via options', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator, { code: 11000 })
      )

      await new User(helpers.USERS[0]).save()

      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        const e = err as ValidationError
        expect(e.errors.username.properties.code).to.equal(11000)
        expect(e.errors.email.properties.code).to.equal(11000)
      }
    })

    it('uses custom string code via options', async function () {
      const User = mongoose.model(
        'User',
        helpers
          .createUserSchema()
          .plugin(uniqueValidator, { code: 'DUPLICATE_VALUE' })
      )

      await new User(helpers.USERS[0]).save()

      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        const e = err as ValidationError
        expect(e.errors.username.properties.code).to.equal('DUPLICATE_VALUE')
        expect(e.errors.email.properties.code).to.equal('DUPLICATE_VALUE')
      }
    })

    it('uses custom code from default plugin configuration', async function () {
      uniqueValidator.defaults.code = 11000

      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator)
      )

      await new User(helpers.USERS[0]).save()

      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        const e = err as ValidationError
        expect(e.errors.username.properties.code).to.equal(11000)
        expect(e.errors.email.properties.code).to.equal(11000)
      }
    })
  })
}
