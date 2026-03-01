import uniqueValidator from '../../index.js'
import mongoose from 'mongoose'

export * from './schemas.js'
export * from './fixtures.js'

export async function afterEachCommon(): Promise<void> {
  const collections = Object.keys(mongoose.connection.collections)
  for (const coll of collections) {
    try {
      await mongoose.connection.collections[coll].deleteMany({})
    } catch {
      // Collection may not exist
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ;(mongoose as any).models = {}
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ;(mongoose.connection as any).models = {}
  uniqueValidator.defaults = {}
}
