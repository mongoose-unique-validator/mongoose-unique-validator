import type { Model, Schema } from 'mongoose'

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
  <
    DocType,
    TModelType extends Model<DocType>,
    TInstanceMethods,
    TQueryHelpers,
    TVirtuals,
    TStaticMethods
  >(
    schema: Schema<
      DocType,
      TModelType,
      TInstanceMethods,
      TQueryHelpers,
      TVirtuals,
      TStaticMethods
    >,
    options?: MongooseUniqueValidatorOptions
  ): void

  defaults: MongooseUniqueValidatorOptions
}

declare const uniqueValidator: MongooseUniqueValidator

export default uniqueValidator
