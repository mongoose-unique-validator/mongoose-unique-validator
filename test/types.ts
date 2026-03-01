import type mongoose from 'mongoose'

/**
 * Type alias for the mongoose default export. Test suites receive mongoose as
 * a function parameter named `mongoose`, which shadows any same-named import
 * and causes TS2502 ("referenced in its own type annotation"). Aliasing the
 * type here under a different name avoids the circular reference.
 */
export type Mongoose = typeof mongoose

/** Mongoose validation error shape used throughout tests */
export interface ValidationError extends Error {
  errors: Record<
    string,
    {
      name: string
      kind: string
      path: string
      value: any
      message: string
      properties: {
        code?: number | string
        [key: string]: any
      }
    }
  >
}
