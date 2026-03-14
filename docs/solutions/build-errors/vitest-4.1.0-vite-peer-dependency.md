---
title: vitest 4.1.0 requires vite ^6 as peerDependency — breaks CI with vitepress 1.x
category: build-errors
date: 2026-03-14
tags:
  - vitest
  - vite
  - vitepress
  - peer-dependency
  - ci
  - ERR_PACKAGE_PATH_NOT_EXPORTED
---

# vitest 4.1.0 requires vite ^6 as peerDependency — breaks CI with vitepress 1.x

## Problem

GitHub Actions CI 在执行 `pnpm release:check` → `pnpm test:silent` 时报错：

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './module-runner' is not defined
by "exports" in .../vite/package.json imported from .../vitest/dist/chunks/nativeModuleRunner.BIakptoF.js
```

本地开发可能不报错（pnpm 解析行为差异），但 CI 上 `pnpm install --frozen-lockfile` 后严格 ESM 解析会暴露问题。

## Root Cause

`vitest@4.1.0` 是一个**破坏性变更**：将 vite 从内部依赖改为 peerDependency，要求 `vite: '^6.0.0 || ^7.0.0 || ^8.0.0-0'`。

而项目的 `vitepress@1.6.4` 依赖 `vite@5.x`（vitepress 2.x 尚未发布）。vitest 4.1.0 尝试导入 `vite/module-runner`（Vite 6 新增导出），但实际安装的 vite 5.x 不提供该导出路径。

**关键对比**：

- `vitest@4.0.x`：**无** vite peerDependency（内置 vite）
- `vitest@4.1.0`：**新增** `vite: '^6.0.0'` peerDependency

## Solution

将 vitest 全家桶锁定到 `4.0.18`（4.0.x 最后一版，不需要 vite peer dependency）：

```diff
# package.json
- "@vitest/coverage-v8": "^4.1.0",
+ "@vitest/coverage-v8": "4.0.18",
- "@vitest/ui": "^4.1.0",
+ "@vitest/ui": "4.0.18",
- "vitest": "4.1.0"
+ "vitest": "4.0.18"
```

注意三个包必须使用**精确版本**（不带 `^`），避免自动升级到 4.1.0。然后执行 `pnpm install` 更新 lockfile。

## Prevention

- 升级 vitest 时，检查其 peerDependencies 是否新增了 vite 版本要求，并与项目中 vitepress 使用的 vite 版本交叉验证。
- 后续如需升级到 vitest 4.1+，需同步将 vitepress 升级到支持 vite 6 的版本（vitepress 2.x）。
- 考虑在 CI 中启用 pnpm 的 `strict-peer-dependencies=true`，让 peer 不匹配在 install 阶段就报错，而非运行时才暴露。

## Related

- [rollup-to-tsdown-migration.md](./rollup-to-tsdown-migration.md) — 构建工具迁移相关
- [build-artifact-smoke-test.md](./build-artifact-smoke-test.md) — 构建产物冒烟测试（同样在 ci:strict 中运行）
