import uniqueValidator from '../../index.js'
import mongoose from 'mongoose'

export * from './schemas.js'
export * from './fixtures.js'

export async function afterEachCommon() {
  const collections = Object.keys(mongoose.connection.collections)
  for (let coll of collections) {
    try {
      await mongoose.connection.collections[coll].deleteMany({})
    } catch {
      // Collection may not exist
    }
  }
  mongoose.models = {}
  mongoose.connection.models = {}
  uniqueValidator.defaults = {}
}
