---
title: 优化 pnpm qa 执行速度 — 并行化
date: 2026-03-14
tags:
  - performance
  - ci
  - qa
  - parallelization
---

# 优化 pnpm qa 执行速度 — 并行化

## 背景

当前 `pnpm qa` 的四个步骤完全串行执行，总耗时约 17.2 秒：

| 步骤     | 命令                                          | 耗时       |
| -------- | --------------------------------------------- | ---------- |
| 1        | `tsc --noEmit`（typecheck）                   | ~4.4s      |
| 2        | `eslint ./ --fix`（lint:fix）                 | ~5.3s      |
| 3        | `vitest --run --reporter=dot`（test:silent）  | ~5.0s      |
| 4        | `vitest --run --typecheck.only`（test:types） | ~3.6s      |
| **总计** |                                               | **~17.2s** |

四个步骤之间没有数据依赖（各自读源码后独立判断），唯一的冲突是 `lint:fix` 会写文件。

## 我们要做什么

### 目标

将 `pnpm qa` 中互相独立的步骤并行执行，缩短总耗时。

### 不做什么

- 不改变各步骤的行为（typecheck、lint、test 的配置不变）
- 不引入新依赖（已有 `npm-run-all@4.1.5`）
- 不改变 `ci:strict` 或 `release:check` 的流程

## 为什么选这个方案

### 关键决策

| 决策             | 结论                       | 理由                           |
| ---------------- | -------------------------- | ------------------------------ |
| lint:fix vs lint | qa 中改用 `lint`（只检查） | 消除写文件冲突，允许安全并行   |
| 并行范围         | 四步全并行                 | 步骤之间无数据依赖，最大化收益 |
| 并行工具         | `run-p`（npm-run-all）     | 项目已有该依赖，无需新增       |

### 选择理由

- 四个步骤都是**只读**操作（lint 改为不带 --fix 后），可以安全并行
- 使用已有的 `run-p`，零新依赖
- 理论耗时从 ~17.2s 降至 ~5.3s（最慢步骤的耗时），**~3.2x 提速**

### 放弃的方案

- 分组并行（两组各两步）：更保守但收益更小
- 仅检查步骤并行：收益最小

## 实现细节

### 变更内容

```diff
- "qa": "pnpm typecheck && pnpm lint:fix && pnpm test:silent && pnpm test:types",
+ "qa": "run-p typecheck lint test:silent test:types",
```

注意 `run-p` 使用的是 script name 而非 `pnpm xxx`。

### lint vs lint:fix

`lint:fix` 保留给开发者手动使用。qa 门禁中使用 `lint`（`eslint ./`），只检查不修复。

## 成功标准

- `pnpm qa` 执行时间 < 8 秒（相比当前 ~17 秒）
- 所有四个检查仍然正常执行并报告错误
- `pnpm ci:strict` 通过
