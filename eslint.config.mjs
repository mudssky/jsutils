import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import tsdoc from 'eslint-plugin-tsdoc'
import { defineConfig, globalIgnores } from 'eslint/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  globalIgnores(['node_modules', 'dist', 'temp', 'typedoc']),
  {
    extends: compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ),
    plugins: {
      '@typescript-eslint': typescriptEslint,
      tsdoc,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: [
      '**/.prettierrc.{js,cjs}',
      '**/.releaserc.{js,cjs}',
      '**/changelog.config.{js,cjs}',
      '**/commitlint.config.{js,cjs}',
      '**/.prettierrc.{js,cjs}',
      'rollup.config.dev.js',
      'rollup.config.dev.js',
    ],
    languageOptions: {
      globals: {
        module: true,
        process: true,
      },
      ecmaVersion: 5,
      sourceType: 'commonjs',
    },
  },
  {
    files: ['src/**/*.ts', '**/test'],
    rules: {
      'no-console': 'warn',
    },
  },
  {
    files: ['**/test/**'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
])
