---
title: 优化 pnpm qa 并行输出 — 分组缓冲
date: 2026-03-14
tags:
  - qa
  - parallelization
  - concurrently
  - developer-experience
---

# 优化 pnpm qa 并行输出 — 分组缓冲

## 背景

在 [qa-parallel-optimization-brainstorm](./2026-03-14-qa-parallel-optimization-brainstorm.md) 中，我们将 `pnpm qa` 的四个步骤从串行改为通过 `run-p`（npm-run-all）并行执行，耗时从 ~17.2s 降至 ~7.8s。

但 `run-p` 的输出行为存在问题：

- **交错输出**：四个命令的 stdout/stderr 实时交错打印，无法分辨来源
- **噪音过多**：`test:silent` 使用 dot reporter（`vitest --run --reporter=dot`），在交错输出中进一步降低可读性
- **定位困难**：出错时需要在混杂输出中人工识别哪个步骤失败

## 我们要做什么

### 目标

将 qa 的并行输出改为按任务分组打印：每个命令的输出缓冲到完成后再一次性输出，整体效果类似：

```
[typecheck] tsc --noEmit finished (0 errors)

[lint] eslint passed

[test:silent] 672 tests passed

[test:types] 75 type tests passed
```

### 不做什么

- 不改变 qa 包含的四个检查步骤
- 不改变各步骤的实际行为（typecheck、lint、test 配置不变）
- 不调整 `test:silent` 的 reporter（dot reporter 在分组输出中足够清晰）

## 为什么选这个方案

### 关键决策

| 决策                 | 结论                  | 理由                                         |
| -------------------- | --------------------- | -------------------------------------------- |
| 并行运行工具         | 替换为 `concurrently` | 支持 `--group` 缓冲输出，`run-p` 无此能力    |
| npm-run-all 是否保留 | 移除                  | concurrently 完全覆盖 `run-p` 功能，减少依赖 |
| test:silent reporter | 保持 dot              | 分组输出后 dot reporter 足够清晰，无需调整   |
| 是否允许新依赖       | 是                    | concurrently 是成熟工具，社区广泛使用        |

### 放弃的方案

- **run-p + `--print-label`**：只加前缀标记，输出仍交错，不满足分组需求
- **自定义 shell 脚本缓冲**：跨平台兼容性差（Windows/bash），维护成本高，违反 KISS

## 实现细节

### 变更内容

```diff
# package.json scripts
- "qa": "run-p typecheck lint test:silent test:types",
+ "qa": "concurrently --group --names typecheck,lint,test,types -c blue,green,yellow,magenta \"pnpm typecheck\" \"pnpm lint\" \"pnpm test:silent\" \"pnpm test:types\"",
```

```diff
# package.json devDependencies
- "npm-run-all": "^4.1.5",
+ "concurrently": "^9.x",
```

注意：需要确认 concurrently 最新版本号，以及是否有其他 scripts 使用 `run-p` 或 `run-s`。

### 迁移检查项

- 检查 package.json 中所有使用 `run-p` 和 `run-s` 的 script
- 确认 concurrently `--group` 在 Windows 上的兼容性
- 验证失败时的退出码行为（concurrently 默认任一失败即整体失败）

## 成功标准

- `pnpm qa` 输出按任务分组，不交错
- 执行时间与当前并行方案相当（< 10s）
- 所有四个检查仍正常执行并报告错误
- `pnpm ci:strict` 通过
