---
title: Build Artifact Smoke Test — ESM/CJS/UMD Validation
category: build-errors
date: 2026-03-14
tags:
  - smoke-test
  - esm
  - cjs
  - umd
  - ci
  - windows
  - vm
---

# Build Artifact Smoke Test — ESM/CJS/UMD Validation

## Problem

672 个运行时测试通过 Vitest alias 直接引用 `src/index.ts` 源码，从不测试 `dist/` 构建产物。`release:check` 执行 `pnpm build` 但不验证产物是否可正确导入。存在"测试全绿但构建产物不可用"的风险。

## Root Cause

Vitest 配置中的路径别名绕过了 `dist/` 产物，所有测试实际上是对源码的验证，而非对最终交付物的验证。构建工具（tsdown）的配置错误、依赖外部化问题、或输出格式问题都不会被现有测试捕获。

## Solution

创建 `scripts/smoke-test.mjs`，使用纯 Node.js API 验证三种构建格式的可加载性和核心导出存在性。

### 关键实现细节

**1. Windows ESM 动态导入需要 file:// URL**

```javascript
import { pathToFileURL } from 'node:url'
// ❌ Windows 下报错 ERR_UNSUPPORTED_ESM_URL_SCHEME
const esm = await import(resolve(root, 'dist/esm/index.js'))
// ✅ 正确方式
const esm = await import(pathToFileURL(resolve(root, 'dist/esm/index.js')).href)
```

**2. UMD 不能直接 require()，需用 vm 沙箱**

tsdown 生成的 UMD 使用 `(this, function)` 模式，Node.js strict mode 下 `require()` 返回空对象。需通过 `vm.runInNewContext()` 模拟浏览器全局环境：

```javascript
import { runInNewContext } from 'node:vm'
const umdCode = readFileSync(umdPath, 'utf-8')
const umdContext = { globalThis: {} }
runInNewContext(umdCode, umdContext)
const umdExports = umdContext.globalThis.utils // tsdown UMD 全局名为 'utils'
```

**3. ESLint 需为 scripts/ 目录声明 Node.js 全局变量**

```javascript
// eslint.config.mjs
{
  files: ['scripts/**/*.mjs'],
  languageOptions: {
    globals: { console: 'readonly', process: 'readonly' },
  },
},
```

**4. 验证核心导出前需确认公共 API**

brainstorm 阶段选定的候选函数中，`sleepAsync`、`clamp`、`deepClone` 实际未在 `src/index.ts` 中导出。必须先验证 barrel 文件的实际导出，再确定测试目标。最终选定：`isString`, `chunk`, `cn`, `debounce`, `range`, `isArray`。

### Pipeline 变更

```diff
- "ci:strict": "pnpm qa && pnpm test:coverage",
+ "ci:strict": "pnpm qa && pnpm test:coverage && pnpm build && pnpm test:smoke",
+ "test:smoke": "node scripts/smoke-test.mjs",
- "release:check": "pnpm ci:strict && pnpm build && pnpm typedoc:gen",
+ "release:check": "pnpm ci:strict && pnpm typedoc:gen",
```

## Prevention

- 新增构建格式或修改 `tsdown.config.ts` 时，同步更新 `scripts/smoke-test.mjs` 的验证项。
- 新增公共 API 导出时，考虑将其加入 `CORE_EXPORTS` 列表以增强覆盖。
- `pnpm ci:strict` 已自动包含 smoke test，PR 合并前必须通过。

## Related

- [rollup-to-tsdown-migration.md](./rollup-to-tsdown-migration.md) — UMD 文件名 `.umd.` 后缀、依赖处理等 gotchas
- [Brainstorm](../../brainstorms/2026-03-14-build-artifact-smoke-test-brainstorm.md) — 设计决策记录
- [Plan](../../plans/2026-03-14-001-feat-build-artifact-smoke-test-plan.md) — 实施计划与验收标准
