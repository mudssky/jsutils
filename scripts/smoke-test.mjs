/**
 * 构建产物冒烟测试
 *
 * 验证 ESM / CJS / UMD 三种格式的可加载性、核心导出存在性、
 * 类型声明文件完整性以及 package.json exports 路径有效性。
 *
 * 使用纯 Node.js API，零外部依赖。
 * 运行前需要先执行 pnpm build。
 */

import { createRequire } from 'node:module'
import { strict as assert } from 'node:assert'
import { readFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const require = createRequire(import.meta.url)

// 需要验证的核心导出（覆盖不同模块）
const CORE_EXPORTS = [
  'isString',    // typed 模块 — 类型守卫
  'chunk',       // array 模块 — 数组操作
  'cn',          // style 模块 — 依赖 clsx + tailwind-merge
  'debounce',    // function 模块 — 高阶函数
  'range',       // math 模块 — 纯函数
  'isArray',     // typed 模块 — 类型守卫
]

let passed = 0
let failed = 0

/**
 * 执行单个验证检查
 * @param {string} label - 检查项描述
 * @param {() => void} fn - 断言函数
 */
function check(label, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${label}`)
  } catch (e) {
    failed++
    console.error(`  ✗ ${label}: ${e.message}`)
  }
}

// ── 1. ESM 导入验证 ──────────────────────────────────────────
console.log('\n[ESM] dist/esm/index.js')
const esm = await import(pathToFileURL(resolve(root, 'dist/esm/index.js')).href)
for (const name of CORE_EXPORTS) {
  check(`export ${name}`, () => assert.equal(typeof esm[name], 'function'))
}
check('isString("hello") === true', () =>
  assert.equal(esm.isString('hello'), true),
)
check('chunk([1,2,3], 2).length === 2', () =>
  assert.equal(esm.chunk([1, 2, 3], 2).length, 2),
)

// ── 2. CJS 导入验证 ──────────────────────────────────────────
console.log('\n[CJS] dist/cjs/index.cjs')
const cjs = require(resolve(root, 'dist/cjs/index.cjs'))
for (const name of CORE_EXPORTS) {
  check(`export ${name}`, () => assert.equal(typeof cjs[name], 'function'))
}
check('isString("hello") === true', () =>
  assert.equal(cjs.isString('hello'), true),
)
check('chunk([1,2,3], 2).length === 2', () =>
  assert.equal(cjs.chunk([1, 2, 3], 2).length, 2),
)

// ── 3. UMD 导入验证（通过 vm 模拟 globalThis 环境） ─────────
console.log('\n[UMD] dist/umd/index.umd.js')
const umdPath = resolve(root, 'dist/umd/index.umd.js')
const umdCode = readFileSync(umdPath, 'utf-8')
check('文件非空', () => assert.ok(umdCode.length > 0))
const umdContext = { globalThis: {} }
runInNewContext(umdCode, umdContext)
const umdExports = umdContext.globalThis.utils
check('globalThis.utils 存在', () => assert.ok(umdExports))
check('导出对象非空', () => assert.ok(Object.keys(umdExports).length > 0))
check('isString 存在', () =>
  assert.equal(typeof umdExports.isString, 'function'),
)

// ── 4. 类型声明文件验证 ──────────────────────────────────────
console.log('\n[DTS] 类型声明文件')
const dtsFiles = ['dist/esm/index.d.ts', 'dist/cjs/index.d.cts']
for (const f of dtsFiles) {
  const p = resolve(root, f)
  check(f, () => {
    const stat = statSync(p)
    assert.ok(stat.size > 0, `${f} 为空文件`)
  })
}

// ── 5. package.json exports 路径验证 ──────────────────────────
console.log('\n[EXPORTS] package.json exports')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
const exportsEntry = pkg.exports['.']
const exportPaths = [
  exportsEntry.types,
  exportsEntry.require.types,
  exportsEntry.require.default,
  exportsEntry.import,
  exportsEntry.default,
]
for (const p of exportPaths) {
  check(p, () => statSync(resolve(root, p)))
}

// ── 结果汇总 ─────────────────────────────────────────────────
console.log(`\n总计: ${passed} 通过, ${failed} 失败\n`)
if (failed > 0) {
  process.exit(1)
}
