import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

export default defineConfig(eslint.configs.recommended, eslintConfigPrettier, {
  files: ['**/*.spec.js'],
  languageOptions: {
    globals: {
      ...globals.mocha,
      chai: 'readonly'
    }
  },
  rules: {
    'no-unused-expressions': 'off'
  }
})
