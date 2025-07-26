// eslint.config.mjs
import js from '@eslint/js'
import tsdoc from 'eslint-plugin-tsdoc'
import tseslint from 'typescript-eslint' // 推荐的导入方式，包含了 parser 和 plugin

export default tseslint.config(
  // 全局忽略文件，这部分保持不变
  {
    ignores: ['node_modules', 'dist', 'temp', 'typedoc', 'vitedocs/.vitepress'],
  },

  // 1. 基础和推荐配置
  //    这取代了原来的 compat.extends(...)
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 2. TSDoc 插件配置
  {
    files: ['src/**/*.ts'], // 仅对 ts 文件启用
    plugins: {
      tsdoc,
    },
    rules: {
      'tsdoc/syntax': 'warn', // 为 TSDoc 插件添加推荐规则
    },
  },

  // 3. 针对特定配置文件的特殊处理 (例如 CommonJS)
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
        module: 'writable',
        process: 'readonly',
      },
      sourceType: 'commonjs',
    },
  },

  // 4. 针对 src 和 test 目录的通用规则
  {
    files: ['src/**/*.ts', '**/test/**'],
    rules: {
      'no-console': 'warn',
    },
  },

  // 5. 仅针对 test 目录的规则覆盖
  {
    files: ['**/test/**'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
)
