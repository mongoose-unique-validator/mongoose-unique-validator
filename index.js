const isFunction = val => typeof val === 'function'

const getPath = (obj, path) =>
  path.split('.').reduce((acc, key) => acc?.[key], obj)

const deepPath = function (schema, pathName) {
  let path
  const paths = pathName.split('.')

  if (paths.length > 1) {
    pathName = paths.shift()
  }

  if (isFunction(schema.path)) {
    path = schema.path(pathName)
  }

  if (path && path.schema) {
    path = deepPath(path.schema, paths.join('.'))
  }

  return path
}

const plugin = function (schema, options) {
  options = options || {}
  const type = options.type || plugin.defaults.type || 'unique'
  const message =
    options.message ||
    plugin.defaults.message ||
    'Error, expected `{PATH}` to be unique. Value: `{VALUE}`'

  // Mongoose Schema objects don't describe default _id indexes
  // https://github.com/Automattic/mongoose/issues/5998
  const indexes = [[{ _id: 1 }, { unique: true }]].concat(schema.indexes())

  // Dynamically iterate all indexes
  for (const index of indexes) {
    const indexOptions = index[1]

    if (indexOptions.unique) {
      const paths = Object.keys(index[0])
      for (const pathName of paths) {
        // Choose error message
        const pathMessage =
          typeof indexOptions.unique === 'string'
            ? indexOptions.unique
            : message

        // Obtain the correct path object
        const path = deepPath(schema, pathName) || schema.path(pathName)

        if (path) {
          // Add an async validator
          path.validate(
            function () {
              return new Promise((resolve, reject) => {
                const isQuery = this.constructor.name === 'Query'
                const conditions = {}
                let model

                if (isQuery) {
                  // If the doc is a query, this is a findAndUpdate.
                  for (const name of paths) {
                    let pathValue =
                      getPath(this, '_update.' + name) ||
                      getPath(this, '_update.$set.' + name)

                    // Wrap with case-insensitivity
                    if (
                      pathValue != null &&
                      (path?.options?.uniqueCaseInsensitive ||
                        indexOptions.uniqueCaseInsensitive)
                    ) {
                      // Escape RegExp chars
                      pathValue = pathValue.replace(
                        /[-[\]/{}()*+?.\\^$|]/g,
                        '\\$&'
                      )
                      pathValue = new RegExp('^' + pathValue + '$', 'i')
                    }

                    conditions[name] = pathValue
                  }

                  // Use conditions the user has with find*AndUpdate
                  for (const [key, value] of Object.entries(this._conditions)) {
                    conditions[key] = { $ne: value }
                  }

                  model = this.model
                } else {
                  const parentDoc = this.$parent()
                  const isNew = parentDoc.isNew

                  if (!isNew && !parentDoc.isModified(pathName)) {
                    return resolve(true)
                  }

                  // https://mongoosejs.com/docs/subdocs.html#subdocuments-versus-nested-paths
                  const isSubdocument = this._id !== parentDoc._id
                  const isNestedPath = isSubdocument
                    ? false
                    : pathName.split('.').length > 1

                  for (const name of paths) {
                    let pathValue
                    if (isSubdocument) {
                      pathValue = this[name.split('.').pop()]
                    } else if (isNestedPath) {
                      const keys = name.split('.')
                      pathValue = this[keys[0]]
                      for (let i = 1; i < keys.length; i++) {
                        const key = keys[i]
                        pathValue = pathValue?.[key]
                      }
                    } else {
                      pathValue = this[name]
                    }

                    // Wrap with case-insensitivity
                    if (
                      pathValue != null &&
                      (path?.options?.uniqueCaseInsensitive ||
                        indexOptions.uniqueCaseInsensitive)
                    ) {
                      // Escape RegExp chars
                      pathValue = pathValue.replace(
                        /[-[\]/{}()*+?.\\^$|]/g,
                        '\\$&'
                      )
                      pathValue = new RegExp('^' + pathValue + '$', 'i')
                    }

                    conditions[name] = pathValue
                  }

                  // If we're not new, exclude our own record from the query
                  if (!isNew) {
                    const ownerDocumentId = isSubdocument
                      ? this.ownerDocument()._id
                      : this._id
                    if (ownerDocumentId) {
                      conditions._id = {
                        $ne: ownerDocumentId
                      }
                    }
                  }

                  // Obtain the model depending on context
                  // https://github.com/Automattic/mongoose/issues/3430
                  // https://github.com/Automattic/mongoose/issues/3589
                  if (isSubdocument) {
                    model = this.ownerDocument().model(
                      this.ownerDocument().constructor.modelName
                    )
                  } else if (isFunction(this.model)) {
                    model = this.model(this.constructor.modelName)
                  } else {
                    model = this.constructor.model(this.constructor.modelName)
                  }
                }

                if (indexOptions.partialFilterExpression) {
                  Object.assign(
                    conditions,
                    indexOptions.partialFilterExpression
                  )
                }

                // Is this model a discriminator and the unique index is on the whole collection,
                // not just the instances of the discriminator? If so, use the base model to query.
                // https://github.com/Automattic/mongoose/issues/4965
                if (
                  model.baseModelName &&
                  (indexOptions.partialFilterExpression === null ||
                    indexOptions.partialFilterExpression === undefined)
                ) {
                  model = model.db.model(model.baseModelName)
                }

                model
                  .find(conditions)
                  .countDocuments()
                  .then(count => {
                    resolve(count === 0)
                  })
                  .catch(err => {
                    reject(err)
                  })
              })
            },
            pathMessage,
            type
          )
        }
      }
    }
  }
}

plugin.defaults = {}

export default plugin
