---
title: 'Rollup v4 到 tsdown v0.21.2 构建系统迁移：isolatedDeclarations、输出格式与 UMD 打包问题'
category: build-errors
date: 2026-03-14
tags:
  - tsdown
  - rolldown
  - oxc
  - rollup-migration
  - isolatedDeclarations
  - build-system
  - typescript
  - dts-generation
  - umd
  - esm
  - cjs
  - package-exports
component: build-system
severity: high
time_to_resolve: '2-4 days'
---

# Rollup v4 到 tsdown v0.21.2 构建系统迁移

## Problem

将 `@mudssky/jsutils` 的构建工具从 Rollup v4 + 9 个插件（跨两个配置文件）迁移到 tsdown v0.21.2（基于 Rolldown/Oxc 的库打包工具）。迁移过程中遇到 6 个关键兼容性问题。

## Root Cause

tsdown 与 Rollup 在以下方面存在显著行为差异：

1. **dts 生成机制**：tsdown 使用 Oxc 的 `isolatedDeclarations`，要求所有导出必须有显式类型标注
2. **输出扩展名**：默认行为受 `package.json` 的 `type` 字段影响，与 Rollup 不同
3. **依赖外部化**：自动读取 `dependencies` 并 external 所有格式，包括需要内联的 UMD
4. **API 差异**：`external` 废弃为 `deps.neverBundle`，UMD 文件名硬编码 `.umd.` 后缀

## Investigation Steps

### 1. isolatedDeclarations（127 errors / 19 files）

tsdown 的 dts 生成要求所有导出函数/变量有显式类型标注。直接在 `tsconfig.json` 中添加 `isolatedDeclarations: true` 触发 TS5069（与 `noEmit: true` 冲突）。

**验证方式**（不修改 tsconfig）：

```bash
npx tsc --noEmit --isolatedDeclarations --declaration --emitDeclarationOnly -p tsconfig.json
```

**修复**：为 19 个文件中的 127 个导出补全显式类型标注（使用 4 个并行 agent 同时修复）。

### 2. 文件扩展名控制

`package.json` 设置了 `"type": "module"`，导致 tsdown 默认 ESM 输出 `.mjs`，但 `exports` 字段期望 `.js`。

**修复**：使用 `outExtensions` 回调：

```typescript
// ESM
outExtensions: () => ({ js: '.js', dts: '.d.ts' })
// CJS
outExtensions: () => ({ js: '.cjs', dts: '.d.cts' })
```

### 3. UMD 依赖内联

tsdown 自动将 `package.json` 的 `dependencies` 设为 external（所有格式），但 UMD 需要内联 `clsx` 和 `tailwind-merge`。

**修复**：使用 `deps.alwaysBundle` 正则匹配所有包：

```typescript
deps: {
  alwaysBundle: [/./]
}
```

### 4. UMD 文件名后缀

tsdown 源码硬编码了 `.umd.` 后缀（`index.umd.js` vs `index.js`）。

**解决**：接受新命名，`package.json` 未引用 UMD 路径，不影响使用。

### 5. `external` 选项废弃

**修复**：`external: ['clsx', 'tailwind-merge']` → `deps: { neverBundle: ['clsx', 'tailwind-merge'] }`

### 6. 类型声明路径变更

旧路径 `dist/types/` 和 `dist/typescts/` → 新路径 `dist/esm/` 和 `dist/cjs/`。

**修复**：更新 `package.json` 的 `exports.types`、`typings` 字段，以及 `api-extractor.json` 的 `mainEntryPointFilePath`。

## Working Solution

### tsdown.config.ts

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: 'esm',
    outDir: 'dist/esm',
    unbundle: true,
    dts: true,
    target: 'es2017',
    sourcemap: false,
    outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
    deps: { neverBundle: ['clsx', 'tailwind-merge'] },
  },
  {
    entry: ['src/index.ts'],
    format: 'cjs',
    outDir: 'dist/cjs',
    unbundle: true,
    dts: true,
    target: 'es2017',
    sourcemap: false,
    outExtensions: () => ({ js: '.cjs', dts: '.d.cts' }),
    deps: { neverBundle: ['clsx', 'tailwind-merge'] },
  },
  {
    entry: { index: 'src/index.ts' },
    format: 'umd',
    outDir: 'dist/umd',
    globalName: 'utils',
    minify: true,
    target: 'es2017',
    sourcemap: false,
    deps: { alwaysBundle: [/./] },
  },
])
```

### 关键配置要点

| 问题                      | 解决方案                                               |
| ------------------------- | ------------------------------------------------------ |
| ESM 扩展名 `.mjs` → `.js` | `outExtensions: () => ({ js: '.js', dts: '.d.ts' })`   |
| CJS 扩展名                | `outExtensions: () => ({ js: '.cjs', dts: '.d.cts' })` |
| UMD 依赖内联              | `deps: { alwaysBundle: [/./] }`                        |
| ESM/CJS 排除特定依赖      | `deps: { neverBundle: ['clsx', 'tailwind-merge'] }`    |
| 类型声明生成              | `dts: true`（仅 ESM/CJS）                              |
| 保留模块结构              | `unbundle: true`（ESM/CJS）                            |

## Results

- **构建时间**：约 7 秒（3 个配置并行）
- **移除 8 个 devDependencies**：rollup、esbuild、tslib 及相关插件
- **移除 3 个配置文件**：`rollup.config.js`、`rollup.config.dev.js`、`tsconfig.cts.json`
- **测试全部通过**：672 个运行时测试 + 75 个类型测试

## Prevention & Best Practices

### 1. Pre-migration Checklist

- 迁移前跑 `pnpm qa` + `pnpm ci:strict`，确认基线全通过
- 保存产物目录快照（`find dist -type f | sort > dist-baseline-tree.txt`）
- 盘点所有 Rollup 插件，逐一确认 tsdown 替代方案
- 记录 `package.json` 中所有 `exports`/`main`/`types` 路径

### 2. isolatedDeclarations 就绪性

- 提前在 CI 中启用 `@typescript-eslint/explicit-function-return-type` 规则
- 定期运行 `tsc --noEmit --isolatedDeclarations` 检查，把问题前置到编码阶段
- 增量修复技巧：按模块分批修复，避免一次性大量变更

### 3. tsdown 特有注意点

| 领域         | Rollup 做法                   | tsdown 差异                              |
| ------------ | ----------------------------- | ---------------------------------------- |
| 输出扩展名   | `output.entryFileNames`       | `outExtensions` 回调                     |
| UMD 外部依赖 | `external` + `output.globals` | `deps.alwaysBundle` 显式内联             |
| 类型声明路径 | `rollup-plugin-dts` 可控      | 默认输出到 outDir，需更新 `package.json` |
| 废弃选项     | —                             | tsdown 迭代快，关注控制台警告            |

### 4. 迁移后测试策略

1. `pnpm qa` — 类型检查 + lint + 全量单测
2. 产物结构对比 — 确认文件名、扩展名、目录层级
3. 产物体积对比 — 变化超过 ±15% 需排查
4. `pnpm release:check` — 构建 + Typedoc 验证
5. 消费端冒烟测试 — `pnpm link` 后分别用 ESM/CJS 方式引入

## Related Documentation

- **Brainstorm**: `docs/brainstorms/2026-03-13-migrate-to-tsdown-brainstorm.md`
- **Plan**: `docs/plans/2026-03-13-001-feat-migrate-build-to-tsdown-plan.md`
- **Key commits**:
  - `df39eca` — 主迁移 commit（修改 9 个文件，删除旧配置，新增 tsdown.config.ts）
  - `5e07768` — isolatedDeclarations 前置改造（19 个文件的类型标注修复）
