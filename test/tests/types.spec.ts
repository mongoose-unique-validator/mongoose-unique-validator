import uniqueValidator from '../../index.js'
import * as helpers from '../helpers/index.js'
import type { Mongoose, ValidationError } from '../types.js'
import { expect } from 'chai'

export default function (mongoose: Mongoose) {
  describe('Types', function () {
    afterEach(helpers.afterEachCommon)

    it('uses default validation type', async function () {
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
        const e = err as ValidationError
        expect(e.errors.username.kind).to.equal('unique')
      }
    })

    it('uses custom type via options', async function () {
      const User = mongoose.model(
        'User',
        helpers.createUserSchema().plugin(uniqueValidator, {
          type: 'mongoose-unique-validator'
        })
      )

      // Save the first user
      await new User(helpers.USERS[0]).save()

      // Try saving a duplicate
      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        const e = err as ValidationError
        expect(e.errors.username.kind).to.equal('mongoose-unique-validator')
        expect(e.errors.email.kind).to.equal('mongoose-unique-validator')
      }
    })

    it('uses custom type for compound index violation', async function () {
      const User = mongoose.model(
        'User',
        helpers.createCompoundIndexSchema().plugin(uniqueValidator, {
          type: 'mongoose-unique-validator'
        })
      )

      await new User(helpers.USERS[0]).save()

      try {
        await new User(helpers.USERS[0]).save()

        throw new Error('Should have thrown')
      } catch (err) {
        const e = err as ValidationError
        expect(e.errors.username.kind).to.equal('mongoose-unique-validator')
      }
    })

    it('uses custom type from default plugin configuration', async function () {
      uniqueValidator.defaults.type = 'mongoose-unique-validator'

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
        const e = err as ValidationError
        expect(e.errors.username.kind).to.equal('mongoose-unique-validator')
        expect(e.errors.email.kind).to.equal('mongoose-unique-validator')
      }
    })
  })
}
