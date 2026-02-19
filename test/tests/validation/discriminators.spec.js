import uniqueValidator from '../../../index.js'
import * as helpers from '../../helpers/index.js'
import { expect } from 'chai'

export default function (mongoose) {
  describe('Discriminators and Partial Filter Expressions', function () {
    afterEach(helpers.afterEachCommon)

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

    // Regression: documents whose type is outside the partialFilterExpression
    // scope must not be validated against an index they are not subject to.
    it('does not throw for discriminator document outside partial filter scope', async function () {
      const Base = mongoose.model(
        'Base',
        helpers.createDiscriminatorPartialFilterSchema().plugin(uniqueValidator)
      )
      const TypeA = Base.discriminator('TypeA', new mongoose.Schema({}))
      const TypeB = Base.discriminator('TypeB', new mongoose.Schema({}))

      // Create a TypeB document — it is subject to the unique index.
      await new TypeB({ field1: 'foo', field2: 'bar' }).save()

      // A TypeA document with the same values should succeed because the
      // partialFilterExpression { type: 'TypeB' } excludes TypeA from the index.
      const result = await new TypeA({ field1: 'foo', field2: 'bar' }).save()
      expect(result).to.be.an('object')
    })

    it('throws for duplicate discriminator document inside partial filter scope', async function () {
      const Base = mongoose.model(
        'Base',
        helpers.createDiscriminatorPartialFilterSchema().plugin(uniqueValidator)
      )
      Base.discriminator('TypeA', new mongoose.Schema({}))
      const TypeB = Base.discriminator('TypeB', new mongoose.Schema({}))

      await new TypeB({ field1: 'foo', field2: 'bar' }).save()

      try {
        await new TypeB({ field1: 'foo', field2: 'bar' }).save()
        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors.field1.name).to.equal('ValidatorError')
        expect(err.errors.field1.kind).to.equal('unique')
      }
    })

    it('does not throw false positive when saving new standalone doc whose schema is also embedded in a plugin-bearing parent schema', async function () {
      // Regression: plugin on ParentSchema added a validator to ChildSchema's
      // shared path object with pathName='child.field'. When a standalone Child
      // was saved, the validator queried { 'child.field': null } which matched
      // all documents, producing a spurious uniqueness error.
      const ChildSchema = new mongoose.Schema({ field: String })
      ChildSchema.index({ field: 1 }, { unique: true })

      const ParentSchema = new mongoose.Schema({ child: ChildSchema })
      ParentSchema.plugin(uniqueValidator)

      mongoose.model('Parent', ParentSchema)
      const Child = mongoose.model('Child', ChildSchema)

      // Save one child so the collection is non-empty
      await new Child({ field: 'existing' }).save()

      // Saving a new child with a different value must not throw
      await new Child({ field: 'new' }).save()
    })

    it('does not throw false positive when updating a standalone doc whose schema is also embedded in a plugin-bearing parent schema', async function () {
      // Regression: same shared-validator issue as above, but for the update
      // path (the exact scenario from the original bug report).
      const ChildSchema = new mongoose.Schema({ field: String })
      ChildSchema.index({ field: 1 }, { unique: true })

      const ParentSchema = new mongoose.Schema({ child: ChildSchema })
      ParentSchema.plugin(uniqueValidator)

      mongoose.model('Parent', ParentSchema)
      const Child = mongoose.model('Child', ChildSchema)

      await new Child({ field: 'y' }).save()

      const child = await Child.findOne({})
      child.field = 'x'
      await child.save()
    })

    it('still throws for embedded subdoc uniqueness violation when parent schema has plugin', async function () {
      // Regression guard: the fix must not suppress legitimate validation for
      // documents that ARE embedded subdocs of the plugin-bearing parent schema.
      const ChildSchema = new mongoose.Schema({ field: String })
      ChildSchema.index({ field: 1 }, { unique: true })

      const ParentSchema = new mongoose.Schema({ child: ChildSchema })
      ParentSchema.plugin(uniqueValidator)

      const Parent = mongoose.model('Parent', ParentSchema)
      mongoose.model('Child', ChildSchema)

      await new Parent({ child: { field: 'dupe' } }).save()

      try {
        await new Parent({ child: { field: 'dupe' } }).save()
        throw new Error('Should have thrown')
      } catch (err) {
        expect(err.errors['child.field'].kind).to.equal('unique')
      }
    })
  })
}
