import uniqueValidator from '../../../index.js'
import * as helpers from '../../helpers/index.js'
import type { Mongoose, ValidationError } from '../../types.js'
import { expect } from 'chai'

export default function (mongoose: Mongoose) {
  describe('Nested Fields', function () {
    afterEach(helpers.afterEachCommon)

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
        const e = err as ValidationError
        expect(e.errors['contact.email'].name).to.equal('ValidatorError')
        expect(e.errors['contact.email'].kind).to.equal('unique')
        expect(e.errors['contact.email'].path).to.equal('contact.email')
        expect(e.errors['contact.email'].value).to.equal('john.smith@gmail.com')
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
        const e = err as ValidationError
        expect(e.errors['contacts.0.email'].name).to.equal('ValidatorError')
        expect(e.errors['contacts.0.email'].kind).to.equal('unique')
        expect(e.errors['contacts.0.email'].path).to.equal('email')
        expect(e.errors['contacts.0.email'].value).to.equal(
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
        const e = err as ValidationError
        expect(e.errors['contact.email'].name).to.equal('ValidatorError')
        expect(e.errors['contact.email'].kind).to.equal('unique')
        expect(e.errors['contact.email'].path).to.equal('email')
        expect(e.errors['contact.email'].value).to.equal('john.smith@gmail.com')
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
      ] as any
      await doc.save()
    })
  })
}
