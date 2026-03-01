import type { Schema } from 'mongoose'

export interface MongooseUniqueValidatorOptions {
  /** Error type string used in the ValidationError (default: `'unique'`). */
  type?: string

  /**
   * Error message template. Supports `{PATH}`, `{VALUE}`, and `{TYPE}` placeholders.
   * Default: `'Error, expected \`{PATH}\` to be unique. Value: \`{VALUE}\`'`
   */
  message?: string

  /** Optional error code attached to the ValidatorError. */
  code?: number | string
}

export interface MongooseUniqueValidator {
  (schema: Schema, options?: MongooseUniqueValidatorOptions): void

  defaults: MongooseUniqueValidatorOptions
}

declare const uniqueValidator: MongooseUniqueValidator

export default uniqueValidator
