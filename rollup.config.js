import { defineConfig } from 'rollup'
// import ts from '@rollup/plugin-typescript'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import ts from 'rollup-plugin-typescript2'

const babelPluginConfig = {
  babelHelpers: 'bundled',
  extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx'],
}

const commonConfig = {
  external: ['clsx', 'tailwind-merge'],
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
        entryFileNames: '[name].cjs', //使用cjs扩展名，避免兼容问题
      },
    ],
    plugins: [
      ts({
        tsconfig: './tsconfig.json',
      }),
      // babel(babelPluginConfig),
      commonjs(),
    ],
    ...commonConfig,
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
      resolve({ preferBuiltins: true, mainFields: ['browser'] }),
      commonjs(),
      babel(babelPluginConfig),
      globals(),
      builtins(),
      terser(),
    ],
  },
  // 打包类型声明
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'dist/types',
        format: 'esm',
        preserveModules: true,
      },
      {
        dir: 'dist/typescts',
        format: 'cjs',
        preserveModules: true,
        entryFileNames: '[name].d.cts',
      },
    ],
    plugins: [
      dts({
        tsconfig: './tsconfig.json',
      }),
    ],
    ...commonConfig,
  },
])

export default config
