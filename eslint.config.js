import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  eslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: globals.mocha
    },
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: globals.node
    }
  }
)
