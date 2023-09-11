import { defineConfig } from 'rollup'
// import ts from '@rollup/plugin-typescript'
import ts from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import globals from 'rollup-plugin-node-globals'
import builtins from 'rollup-plugin-node-builtins'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'

const babelPluginConfig = {
  babelHelpers: 'bundled',
  extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx'],
}

const config = defineConfig([
  // 输出两种模式：ES Module和CommonJS
  {
    input: ['src/index.ts'],
    output: [
      {
        dir: 'dist/esm',
        format: 'esm',
        preserveModules: true, // 开启这个选项会将每个模块单独打包，有利于摇树优化
      },
      {
        dir: 'dist/cjs',
        format: 'cjs',
        preserveModules: true,
      },
    ],
    plugins: [
      ts({
        tsconfig: './tsconfig.json',
      }),
      // babel(babelPluginConfig),
      commonjs(),
    ],
  },
  // 打包为UMD
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/umd/index.js',
        format: 'umd',
        name: 'utils',
      },
    ],
    plugins: [
      ts(),
      babel(babelPluginConfig),
      commonjs(),
      resolve({ preferBuiltins: true, mainFields: ['browser'] }),
      globals(),
      builtins(),
      terser(),
    ],
  },
  // 打包类型声明
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/types',
      format: 'esm',
      preserveModules: true,
    },
    plugins: [dts()],
  },
])

export default config
