# Changelog

## 3.0.0

- Re-versions and deprecates v2.0.4 due to major mongoose version bump.

## 2.0.4

- Updates Mongoose dependency to 6.x.

## 2.0.3

- Escapes regular expression characters when used with case-insensitive option.

## 2.0.2

- Updates collection.count to collection.countDocuments for mongoose deprecation.

## 2.0.1

- Restores strict mode for backwards-compat with Node 4+.

## 2.0.0

- Corrects handling of `_id` column index when used with Mongoose v5.
- Removes tests/support for custom `_id` column unique indexes.

## 1.0.6

- Adds support for `uniqueCaseInsensitive` on index options.

## 1.0.5

- Updated validator to use a promise, as async validators are deprecated as of Mongoose 4.9.

## 1.0.4

- Added support for `$set` usage in `findOneAndUpdate`.

## 1.0.3

- Added extra option `type`, resolved #17.

#### 1.0.2

- Fixed isNew type-check because "false" is acceptable.

#### 1.0.1

- Added workaround for `isNew` and `_id` missing from `find*AndUpdate` queries.
