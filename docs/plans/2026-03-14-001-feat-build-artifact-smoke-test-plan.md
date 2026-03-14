---
title: 'feat: Add build artifact smoke test'
type: feat
status: completed
date: 2026-03-14
origin: docs/brainstorms/2026-03-14-build-artifact-smoke-test-brainstorm.md
---

# feat: Add build artifact smoke test

在 `ci:strict` 门禁中添加轻量级构建产物冒烟测试，验证 ESM / CJS / UMD 三种格式的可加载性、核心导出存在性、类型声明文件完整性以及 `package.json` exports 路径有效性。

(see brainstorm: docs/brainstorms/2026-03-14-build-artifact-smoke-test-brainstorm.md)

## Acceptance Criteria

- [x] 创建 `scripts/smoke-test.mjs`，使用纯 Node.js API（`import()`, `createRequire`, `fs`, `assert`），零新依赖
- [x] 验证 ESM：动态 `import()` 加载 `dist/esm/index.js`，检查 6 个核心导出存在且为函数
- [x] 验证 CJS：`createRequire` 加载 `dist/cjs/index.cjs`，检查 6 个核心导出存在且为函数
- [x] 验证 UMD：`vm.runInNewContext` 加载 `dist/umd/index.umd.js`，检查 globalThis.utils 非空
- [x] 验证类型声明：`dist/esm/index.d.ts` 和 `dist/cjs/index.d.cts` 存在且非空
- [x] 验证 exports 路径：解析 `package.json` 的 `exports` 字段，确认所有路径指向存在的文件
- [x] 对简单函数做一次基本调用断言（如 `isString('hello') === true`、`chunk([1,2,3], 2)` 长度正确）
- [x] 新增 `pnpm test:smoke` 脚本（`node scripts/smoke-test.mjs`）
- [x] 修改 `ci:strict` 为 `pnpm qa && pnpm test:coverage && pnpm build && pnpm test:smoke`
- [x] 修改 `release:check` 为 `pnpm ci:strict && pnpm typedoc:gen`（避免重复 build）
- [x] 脚本执行时间 < 3 秒
- [x] `pnpm qa` 通过
- [x] `pnpm ci:strict` 通过（含新的 smoke test）

## Context

### 问题背景

项目 672 个运行时测试通过 Vitest alias 直接引用 `src/index.ts` 源码，从不测试 `dist/` 产物。`release:check` 执行 `pnpm build` 但不验证产物可否正确导入。理论上存在"测试全绿但构建产物不可用"的风险。

### 核心导出候选（已验证存在）

| 函数         | 模块  | 验证价值                                     |
| ------------ | ----- | -------------------------------------------- |
| `isString`   | typed | 类型守卫，基本导出验证                       |
| `chunk`      | array | 数组操作，可做简单调用断言                   |
| `cn`         | style | 依赖 clsx + tailwind-merge，验证外部依赖处理 |
| `sleepAsync` | async | Promise 返回值，异步函数                     |
| `range`      | math  | 纯函数，可验证返回值                         |
| `isArray`    | typed | 类型守卫，与 isString 覆盖不同入口           |

### UMD 文件名

tsdown 硬编码 `.umd.` 后缀，实际文件为 `dist/umd/index.umd.js`（非 `index.js`）。

### 关键决策来源

| 决策             | 结论                          | 来源       |
| ---------------- | ----------------------------- | ---------- |
| 实现方式         | 独立 .mjs 脚本                | brainstorm |
| 单文件 vs 分文件 | 单文件 + createRequire        | brainstorm |
| 测试深度         | 轻量 smoke（非完整 API 表面） | brainstorm |
| 运行时机         | ci:strict                     | brainstorm |
| UMD 测试方式     | Node.js require               | brainstorm |

## MVP

### scripts/smoke-test.mjs

```javascript
import { createRequire } from 'node:module'
import { strict as assert } from 'node:assert'
import { readFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const require = createRequire(import.meta.url)

// 需要验证的核心导出
const CORE_EXPORTS = [
  'isString',
  'chunk',
  'cn',
  'sleepAsync',
  'range',
  'isArray',
]

let passed = 0
let failed = 0

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

// 1. ESM 导入验证
console.log('\n[ESM] dist/esm/index.js')
const esm = await import(resolve(root, 'dist/esm/index.js'))
for (const name of CORE_EXPORTS) {
  check(`export ${name}`, () => assert.equal(typeof esm[name], 'function'))
}
check('isString("hello") === true', () =>
  assert.equal(esm.isString('hello'), true),
)
check('chunk([1,2,3], 2).length === 2', () =>
  assert.equal(esm.chunk([1, 2, 3], 2).length, 2),
)

// 2. CJS 导入验证
console.log('\n[CJS] dist/cjs/index.cjs')
const cjs = require(resolve(root, 'dist/cjs/index.cjs'))
for (const name of CORE_EXPORTS) {
  check(`export ${name}`, () => assert.equal(typeof cjs[name], 'function'))
}

// 3. UMD 导入验证
console.log('\n[UMD] dist/umd/index.umd.js')
const umd = require(resolve(root, 'dist/umd/index.umd.js'))
check('导出对象非空', () => assert.ok(Object.keys(umd).length > 0))

// 4. 类型声明文件验证
console.log('\n[DTS] 类型声明文件')
const dtsFiles = ['dist/esm/index.d.ts', 'dist/cjs/index.d.cts']
for (const f of dtsFiles) {
  const p = resolve(root, f)
  check(f, () => {
    const stat = statSync(p)
    assert.ok(stat.size > 0, `${f} 为空文件`)
  })
}

// 5. package.json exports 路径验证
console.log('\n[EXPORTS] package.json exports')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
const exports = pkg.exports['.']
const paths = [
  exports.types,
  exports.require.types,
  exports.require.default,
  exports.import,
  exports.default,
]
for (const p of paths) {
  check(p, () => statSync(resolve(root, p)))
}

// 结果汇总
console.log(`\n总计: ${passed} 通过, ${failed} 失败`)
if (failed > 0) process.exit(1)
```

### package.json 脚本变更

```diff
- "ci:strict": "pnpm qa && pnpm test:coverage",
+ "ci:strict": "pnpm qa && pnpm test:coverage && pnpm build && pnpm test:smoke",
+ "test:smoke": "node scripts/smoke-test.mjs",
- "release:check": "pnpm ci:strict && pnpm build && pnpm typedoc:gen",
+ "release:check": "pnpm ci:strict && pnpm typedoc:gen",
```

## Sources

- **Origin brainstorm:** [docs/brainstorms/2026-03-14-build-artifact-smoke-test-brainstorm.md](docs/brainstorms/2026-03-14-build-artifact-smoke-test-brainstorm.md) — 关键决策：独立 .mjs 脚本、单文件、轻量 smoke、ci:strict 集成
- **迁移文档:** [docs/solutions/build-errors/rollup-to-tsdown-migration.md](docs/solutions/build-errors/rollup-to-tsdown-migration.md) — UMD 文件名、扩展名、依赖处理等 gotchas
- **质量门禁设计:** [docs/superpowers/specs/2026-03-10-quality-gate-optimization-design.md](docs/superpowers/specs/2026-03-10-quality-gate-optimization-design.md) — 三层门禁架构背景
