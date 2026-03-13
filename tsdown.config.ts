import { defineConfig } from 'tsdown'

export default defineConfig([
  // ESM（unbundle 模式保留模块结构）
  {
    entry: ['src/index.ts'],
    format: 'esm',
    outDir: 'dist/esm',
    unbundle: true,
    dts: true,
    target: 'es2017',
    sourcemap: false,
    // 保持 .js / .d.ts 扩展名，匹配 package.json exports 路径
    outExtensions: () => ({
      js: '.js',
      dts: '.d.ts',
    }),
    deps: {
      neverBundle: ['clsx', 'tailwind-merge'],
    },
  },
  // CJS（unbundle 模式保留模块结构，.cjs 扩展名）
  {
    entry: ['src/index.ts'],
    format: 'cjs',
    outDir: 'dist/cjs',
    unbundle: true,
    dts: true,
    target: 'es2017',
    sourcemap: false,
    // 保持 .cjs / .d.cts 扩展名，匹配 package.json exports 路径
    outExtensions: () => ({
      js: '.cjs',
      dts: '.d.cts',
    }),
    deps: {
      neverBundle: ['clsx', 'tailwind-merge'],
    },
  },
  // UMD（单文件打包，minified，内联所有依赖）
  {
    entry: { index: 'src/index.ts' },
    format: 'umd',
    outDir: 'dist/umd',
    globalName: 'utils',
    minify: true,
    target: 'es2017',
    sourcemap: false,
    // UMD 内联所有依赖（含 clsx、tailwind-merge），用于 <script> 标签场景
    deps: {
      // 使用正则匹配所有包名，强制内联到 bundle 中
      alwaysBundle: [/./],
    },
  },
])
