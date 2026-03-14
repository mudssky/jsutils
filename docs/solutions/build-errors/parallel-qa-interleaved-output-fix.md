---
title: 使用 concurrently --group 修复 pnpm qa 并行输出交错问题
category: build-errors
date: 2026-03-14
tags:
  - concurrently
  - npm-run-all
  - pnpm
  - parallel-scripts
  - qa
  - developer-experience
  - vitest
---

# 使用 concurrently --group 修复 pnpm qa 并行输出交错问题

## Problem

将 `pnpm qa` 的四个步骤（typecheck、lint、test:silent、test:types）通过 `run-p`（npm-run-all）并行执行后，所有命令的 stdout/stderr 实时交错打印，无前缀、无缓冲，输出完全不可读。加上 `test:silent` 使用 `--reporter=dot`（dot reporter），在混合输出中进一步增加噪音。出错时无法分辨哪个步骤失败。

## Root Cause

`npm-run-all@4.1.5` 的 `run-p` 不支持输出缓冲或分组。所有并行子进程的输出直接合并到同一终端流。虽然 `--print-label`（`-l`）可以给每行加前缀标记，但输出仍然交错——只能区分来源，不能分组阅读。

此外，npm-run-all@4.x 已停止维护，存在已知 bug（如读取 `package.json` 的 `config` 字段并作为 CLI 选项传递给 pnpm）。

## Solution

### 1. 替换 npm-run-all 为 concurrently

```bash
pnpm remove npm-run-all && pnpm add -D concurrently
```

### 2. 更新 qa 脚本

```diff
- "qa": "run-p typecheck lint test:silent test:types",
+ "qa": "concurrently --group --names typecheck,lint,test,types -c blue,green,yellow,magenta \"pnpm typecheck\" \"pnpm lint\" \"pnpm test:run\" \"pnpm test:types\"",
```

关键参数：

- `--group`：将每个命令的输出缓冲到完成后再一次性打印，不交错
- `--names`：为每个命令分配可读标签作为前缀
- `-c`：为前缀配置颜色

### 3. 移除 dot reporter 并重命名脚本

```diff
- "test:silent": "vitest --run --reporter=dot",
+ "test:run": "vitest --run",
```

分组输出后，默认 vitest reporter 比 dot reporter 更有信息量（显示每个测试文件名和耗时）。脚本重命名为 `test:run` 以准确反映用途。

### 4. 同步更新 AGENTS.md

更新 qa 和 test:run 的描述以反映工具和行为变更。

## Prevention

- **选择并行运行工具时，将输出可读性作为硬性要求**。至少需要支持分组缓冲输出（如 `concurrently --group`），否则并行执行的调试体验会急剧下降。
- **避免使用停止维护的工具**。npm-run-all@4.x 最后发布于 2018 年，存在未修复的 bug。选择 devDependency 时检查最近发布日期和维护活跃度。
- **修改并行脚本后，实际阅读一次完整输出**。不要仅凭退出码判断正确性——交错输出问题不影响退出码但严重影响可用性。

## Related

- [qa-parallel-optimization-brainstorm](../../brainstorms/2026-03-14-qa-parallel-optimization-brainstorm.md) — 初始 qa 并行化方案（run-p）
- [qa-parallel-output-brainstorm](../../brainstorms/2026-03-14-qa-parallel-output-brainstorm.md) — 输出优化方案（迁移至 concurrently）
- [build-artifact-smoke-test.md](./build-artifact-smoke-test.md) — ci:strict pipeline 变更（含 qa）
