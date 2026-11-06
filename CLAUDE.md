# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests (uses docker mongo container)
pnpm test:docker

# Run a single test file
pnpm exec mocha test/tests/validation.spec.js --exit

# Lint
pnpm run lint

# Format code
pnpm run format
```

Pre-commit hooks run lint-staged automatically via Husky.

## Architecture

This is a single-file Mongoose plugin (`index.js`) with no build step. The package is published as ESM (`"type": "module"`).

**Plugin flow (`index.js`):**

1. On schema registration, iterates all indexes (including the implicit `_id` index) looking for `{ unique: true }`.
2. For each unique field path found, attaches an async Mongoose validator via `path.validate(...)`.
3. The validator runs a `model.find(conditions).countDocuments()` query before save. If count > 0, validation fails.
4. Two execution contexts are handled differently inside the validator:
   - **Document save** (`this.constructor.name !== 'Query'`): uses `$parent()` to detect subdocuments, skips validation if field is unmodified, excludes the document's own `_id` to allow updates.
   - **Query context** (`findOneAndUpdate` etc.): reads values from `_update` / `_update.$set`, requires `{ runValidators: true, context: 'query' }` from the caller.
5. Special cases handled: subdocuments vs nested paths, discriminator models (uses base model when no `partialFilterExpression`), case-insensitive matching via `uniqueCaseInsensitive` option, `partialFilterExpression` merging.

**Plugin options** (passed as second arg to `schema.plugin(uniqueValidator, options)`):

- `type` — error kind string (default `'unique'`)
- `message` — error message template supporting `{PATH}`, `{VALUE}`, `{TYPE}` (default provided)

**Global defaults** can be set via `uniqueValidator.defaults.type` / `uniqueValidator.defaults.message`.

**Test layout:**

- `test/index.spec.ts` — connects to MongoDB and orchestrates the four suites
- `test/helpers/` — shared schema factories (`schemas.ts`), fixture data (`fixtures.ts`) and `afterEachCommon`
- `test/tests/validation/` — core uniqueness scenarios (basic, nested, case-insensitive, discriminators, queries)
- `test/tests/types.spec.ts` — custom error type option
- `test/tests/messages.spec.ts` — custom error message option
- `test/tests/codes.spec.ts` — custom error code option

Tests require a running MongoDB at `mongodb://127.0.0.1:27017/mongoose-unique-validator`. The database is dropped after the full suite completes; individual tests clean collections in `afterEach` via `helpers.afterEachCommon`.
