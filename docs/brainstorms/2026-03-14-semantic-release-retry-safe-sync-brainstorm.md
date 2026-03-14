---
title: Semantic Release 失败重试与主线回写解耦
date: 2026-03-14
tags:
  - release
  - semantic-release
  - github-actions
  - changelog
  - package-version
  - retry
---

# Semantic Release 失败重试与主线回写解耦

## 背景

当前发布链路在 `push main` 后执行 `pnpm semantic-release`，并通过
`@semantic-release/git` 直接把 `package.json` 和 `CHANGELOG.md` 回写到
`main`。这会带来一个恢复性问题：

- 当 npm / GitHub Release / 其他发布步骤中途失败时，`main` 可能已经出现
  `chore(release)` 提交
- 后续再次重试发布时，semantic-release 计算变更范围的基线已经被这次失败
  发布改写
- 结果是失败前的业务提交不会再被完整纳入新的 release notes / changelog

问题的本质不是“重跑 workflow 不稳定”，而是“发布事实”和“主线回写”被绑成了
同一个事务。

## 我们要做什么

### 目标

调整 `semantic-release` 与 GitHub Actions 的职责边界，使发布链路满足以下行为：

1. **发布失败不污染 `main`**  
   任何失败中的 release 不应提前在 `main` 留下 `package.json` /
   `CHANGELOG.md` / `chore(release)` 提交

2. **重试发布不丢失失败前的业务提交**  
   无论是 GitHub Actions 的 `Re-run jobs`，还是手动触发的重试入口，
   都必须继续基于真实业务提交历史计算版本和发布说明

3. **发布成功后仍然同步仓库状态**  
   成功发布后，`main` 最终仍需拿到：
   - `package.json` 中的最终 `version`
   - 项目内的 `CHANGELOG.md`

4. **同步失败可单独补跑**  
   如果“主线回写”失败，不应影响已成功的 npm / GitHub Release；后续应能
   单独补跑同步步骤

### 不做什么

- **不做** 发布前在 `main` 上创建 release commit
- **不做** 失败后自动回滚 tag / npm 已发布版本
- **不做** 一次同步自动补齐多个漏掉的版本
- **不做** 把仓库 `CHANGELOG.md` 作为发布主事务的真相源

## 为什么选这个方案

### 选择理由

采用“发布成功后触发独立同步 workflow”的两阶段模型：

- **第一阶段：发布事务**  
  `semantic-release` 只负责版本判定、打 tag、创建 GitHub Release、发布 npm
  等发布事实，不直接改写 `main`

- **第二阶段：主线同步事务**  
  由独立 workflow 在发布成功后，把单个已发布版本的 `package.json version`
  与 `CHANGELOG.md` 回写到 `main`

这样做的核心收益是：

- `main` 的提交历史不再影响发布是否可重试
- 发布失败与主线同步失败的恢复路径被拆开，排障更清晰
- `CHANGELOG.md` 不再通过“当前 `main` 的提交范围”重算，而是基于“已成功发布
  的单个版本结果”生成，避免漏记失败前的业务提交

### 放弃的方案

#### 方案 A：同一 workflow 内发布成功后立刻回写

优点是链路更短，但“发布”和“同步”仍然耦合在同一 workflow 内，异常分支和
幂等处理会更绕。

#### 方案 C：发布后自动创建同步 PR

审计性更强，但会引入额外人工合并步骤，不符合当前“发布完成后主线应尽快
反映版本结果”的偏好。

## 关键决策

- **发布与主线回写解耦**：semantic-release 不再通过 `@semantic-release/git`
  直接向 `main` 提交 release 产物
- **`main` 不再承载发布前事务状态**：只有真正发布成功后，才允许把版本和
  changelog 同步回默认分支
- **仓库 `CHANGELOG.md` 改为“发布结果镜像”**：它仍然保留在项目中，但不再
  作为发布主事务的一部分
- **同步 workflow 默认只处理一个版本**：自动触发时只处理刚刚发布成功的版本；
  手动补跑时也只允许按单个 `tag/version` 执行
- **同步过程必须幂等**：同一个版本重复执行同步时，不应产生额外错误提交，也不应
  破坏已有结果
- **同时支持自动与手动补跑**：发布成功后自动触发同步；若同步失败，再通过
  `workflow_dispatch` 按指定版本手动补跑
- **changelog 来源固定为成功发布的版本结果**：同步 `CHANGELOG.md` 时应使用
  已成功发布的 release notes / tag 对应元数据，而不是重新从 `main` 计算

## 建议流程

### 阶段 1：发布 workflow

`release.yml` 仅负责：

1. 安装依赖并执行 `pnpm release:check`
2. 执行 `pnpm semantic-release`
3. 产出“本次成功发布的版本信息”，供后续同步 workflow 使用

这里的关键变化是：发布成功前，不向 `main` 写任何版本提交或 changelog 提交。

### 阶段 2：同步 workflow

独立 workflow 负责：

1. 接收单个已发布版本的 `tag/version`
2. 以该版本的已发布说明为真相源生成 / 更新 `CHANGELOG.md`
3. 将 `package.json version` 更新为该已发布版本
4. 生成一次面向 `main` 的同步提交

### 失败恢复

- **发布失败**：可直接 `Re-run jobs` 或手动重触发发布入口，因为 `main`
  没有被失败中的 release 改写
- **同步失败**：不重新发布 npm，仅对指定的单个已发布版本手动补跑同步 workflow

## 成功标准

- 发布失败后，`main` 上不再出现残留的 `chore(release)` 或半成品 changelog 提交
- 重新发布时，失败前的业务提交仍能进入版本判定和发布说明
- 发布成功后，`main` 最终能同步到正确的 `package.json version`
- 项目内 `CHANGELOG.md` 能反映已成功发布的版本内容
- 同步 workflow 可按单个版本手动补跑，且重复执行不造成额外错误结果

## 已确认决策

- `CHANGELOG.md` 仍然需要保留并更新到项目中
- `package.json version` 可以在发布成功后再同步回 `main`
- 自动同步之外，还需要支持手动补跑
- 手动补跑采用“单版本同步”模型，而不是自动补齐多个历史版本

## Next Steps

→ `/ce:plan docs/brainstorms/2026-03-14-semantic-release-retry-safe-sync-brainstorm.md`
把方案细化为：

- `.releaserc.cjs` 如何移除主线直写职责
- `release.yml` 如何只保留发布事务
- 新的同步 workflow 如何接收版本元数据、生成 changelog 并幂等回写 `main`
