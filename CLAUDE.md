# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests (starts/stops the docker mongo container)
pnpm test:docker

# Run all tests against an already-running MongoDB
pnpm test

# Run all tests against Mongoose 8 (temporarily swaps the devDependency, then restores it)
pnpm test:docker:mongoose8

# Run a single suite (requires MongoDB running; filter by describe/it name)
pnpm test --grep "Codes"

# Lint
pnpm run lint

# Typecheck (index.d.ts + TypeScript tests)
pnpm run typecheck

# Format code
pnpm run format
```

Spec files can't be run individually with `mocha <file>`: each one only exports a `(mongoose) => describe(...)` factory, and the DB connection lives in `test/index.spec.ts`. Use `--grep` instead.

Pre-commit hooks run lint-staged via Husky: `prettier --write` then `eslint --max-warnings=0`, so any lint warning blocks a commit.

## Architecture

This is a single-file Mongoose plugin (`index.js`) with no build step. The package is published as ESM (`"type": "module"`). Supports `mongoose ^8 || ^9` (peer dependency) and Node `>=22`; CI runs a Node 22/24 × Mongoose 8/9 matrix.

**Types:** `index.d.ts` is hand-written (not generated) and exported via `exports`/`types`. Keep it in sync whenever plugin options change. The plugin signature is generic so it satisfies Mongoose's `PluginFunction` constraint.

**Plugin flow (`index.js`):**

1. On schema registration, iterates all indexes (including the implicit `_id` index) looking for `unique`.
2. For each unique field path found, attaches an async Mongoose validator via `path.validate(...)`.
3. The validator runs a `model.find(conditions).countDocuments()` query. If count > 0, validation fails.
4. Two execution contexts are handled differently inside the validator:
   - **Document save** (`this.constructor.name !== 'Query'`): uses `$parent()` to detect subdocuments, skips validation if the field is unmodified, excludes the document's own `_id` (or owner document's `_id` for subdocs) to allow updates.
   - **Query context** (`findOneAndUpdate` etc.): reads values from `_update` / `_update.$set`, requires `{ runValidators: true, context: 'query' }` from the caller. The query's filter conditions are added as `$ne` exclusions; if a filter field overlaps a unique field, the exclusion goes into `$and` so it doesn't overwrite the uniqueness check.
5. Validation is skipped (resolves `true`) when:
   - called via static `Model.validate(obj)` — `this` is a plain object with no `$parent`, so there's no document context;
   - the document/query filter falls outside a `partialFilterExpression` (checked by `matchesSimpleFilter`, which only evaluates simple equality and conservatively treats operators/missing fields as matches);
   - the validator was registered via a parent schema's plugin but is running on a standalone document whose own schema lacks the path (prevents false positives for embedded child schemas).
6. Other special cases: subdocuments vs nested paths, discriminator models (queries the base model when there's no `partialFilterExpression`), case-insensitive matching (regex-escaped, anchored, `i` flag), `partialFilterExpression` merged into query conditions.

**Plugin options** (passed as second arg to `schema.plugin(uniqueValidator, options)`):

- `type` — error kind string (default `'unique'`)
- `message` — error message template supporting `{PATH}`, `{VALUE}`, `{TYPE}` (default provided)
- `code` — optional number or string attached to the validator error's `properties.code`

**Global defaults** can be set via `uniqueValidator.defaults.type` / `.message` / `.code`.

**Schema-level options:**

- `unique: 'Custom message'` — a string instead of `true` overrides the message for that path.
- `uniqueCaseInsensitive: true` — on the path options or the index options, enables case-insensitive matching.

**Test layout** (TypeScript, run through `tsx` via `.mocharc.yml`):

- `test/index.spec.ts` — connects to MongoDB and orchestrates the four suites
- `test/helpers/` — `schemas.ts` (schema factories), `fixtures.ts` (fixture data), `index.ts` (re-exports + `afterEachCommon`)
- `test/types.ts` — shared `Mongoose` type alias and `ValidationError` shape
- `test/tests/validation/` — core uniqueness scenarios, split into `basic`, `query`, `case-insensitive`, `nested`, `discriminators` (aggregated by `index.spec.ts`)
- `test/tests/types.spec.ts` — custom error **`type` option** (not TypeScript types)
- `test/tests/messages.spec.ts` — custom error message option
- `test/tests/codes.spec.ts` — custom error code option

New spec files must export a `(mongoose: Mongoose) => void` factory and be registered in the relevant aggregator (`test/index.spec.ts` or `test/tests/validation/index.spec.ts`).

Tests require a running MongoDB at `mongodb://127.0.0.1:27017/mongoose-unique-validator`. The database is dropped after the full suite completes. `helpers.afterEachCommon` runs after each test to clear all collections, reset `mongoose.models` / `connection.models`, and reset `uniqueValidator.defaults`.
