import basicSpec from './basic.spec.js'
import caseInsensitiveSpec from './case-insensitive.spec.js'
import discriminatorsSpec from './discriminators.spec.js'
import nestedSpec from './nested.spec.js'
import querySpec from './query.spec.js'

export default function (mongoose) {
  describe('Validation', function () {
    basicSpec(mongoose)
    querySpec(mongoose)
    caseInsensitiveSpec(mongoose)
    nestedSpec(mongoose)
    discriminatorsSpec(mongoose)
  })
}
