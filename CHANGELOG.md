# Changelog

## 1.0.4

- Added support for `$set` usage in `findOneAndUpdate`.

## 1.0.3

- Added extra option `type`, resolved #17.

#### 1.0.2

- Fixed isNew type-check because "false" is acceptable.

#### 1.0.1

- Added workaround for `isNew` and `_id` missing from `find*AndUpdate` queries.
