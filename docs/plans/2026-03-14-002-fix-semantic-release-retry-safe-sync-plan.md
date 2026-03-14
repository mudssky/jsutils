---
title: 'fix: Make semantic-release retry-safe'
type: fix
status: active
date: 2026-03-14
origin: docs/brainstorms/2026-03-14-semantic-release-retry-safe-sync-brainstorm.md
---

# fix: Make semantic-release retry-safe

## Overview

将当前“发布事实”和“主线回写”耦合在一起的 semantic-release 流程拆成两个事务：

1. 发布事务只负责 `npm`、`git tag`、GitHub Release 等外部发布事实
2. 主线同步事务只负责在发布成功后，把 `package.json version` 和
   `CHANGELOG.md` 回写到 `main`

这样可以消除“失败发布在 `main` 留下 `chore(release)` 提交，导致后续重试漏算
提交范围”的问题，同时保留项目内 `CHANGELOG.md` 与 `package.json` 版本同步。

(see brainstorm: docs/brainstorms/2026-03-14-semantic-release-retry-safe-sync-brainstorm.md)

## Problem Statement

当前发布链路的关键事实如下：

- `.releaserc.cjs` 同时启用了 `@semantic-release/changelog` 和
  `@semantic-release/git`，会在发布过程中直接修改并提交 `CHANGELOG.md` 与
  `package.json`（`.releaserc.cjs:7-19`）
- `.github/workflows/release.yml` 在 `push main` 后执行
  `pnpm release:check` 和 `pnpm semantic-release`
  （`.github/workflows/release.yml:3-41`）
- `release:check` 已被项目文档定义为 release 前严格质量门禁，不能弱化
  （`package.json:74`,
  `docs/superpowers/specs/2026-03-10-quality-gate-optimization-design.md:174-176`）

这套设计在“发布中途失败”时会出现两个行为回归：

1. `main` 先被 release commit 污染
2. 下次重试时，semantic-release 看到的提交基线已经被那次失败发布改写，
   导致失败前的业务提交不再进入新的 release notes / changelog

补充观察：

- 当前 `CHANGELOG.md` 已经存在重复版本段落（`CHANGELOG.md:19` 与
  `CHANGELOG.md:37` 都是 `1.32.0`），说明新的同步方案必须显式考虑幂等和
  去重，不能继续依赖“多跑几次也没事”的隐含假设

## Proposed Solution

采用“发布 workflow + 独立同步 workflow”的两阶段模型。

### 阶段 1：发布 workflow

保留 `release.yml` 作为唯一发布入口，但收窄职责：

- 继续执行 `pnpm release:check`
- 继续执行 `pnpm semantic-release`
- 不再让 semantic-release 直接提交 `CHANGELOG.md` / `package.json` 到 `main`

`semantic-release` 成功后，仓库外部的真相源变为：

- npm 上的已发布版本
- Git tag
- GitHub Release（含 release notes）

### 阶段 2：同步 workflow

新增独立 `release-sync.yml`，负责：

- 自动监听 GitHub Release `published` 事件
- 手动支持 `workflow_dispatch`，允许按单个 `tag/version` 补跑
- 读取该单个已发布版本的元数据
- 生成 / 更新项目内 `CHANGELOG.md`
- 把 `package.json version` 同步为该版本
- 以一次幂等同步提交回写到 `main`

### 核心设计默认值

- 自动触发路径以 **GitHub Release published** 为信号，不依赖重新扫描 `main`
  的提交范围
- 手动补跑默认只处理 **一个版本**
- 同步逻辑以 **已发布版本元数据** 为真相源，而不是重新用
  conventional commits 从 `main` 反推
- 同步回写默认优先使用 **`GITHUB_TOKEN` 推送**，利用 GitHub 官方的
  “由 `GITHUB_TOKEN` 触发的事件不会再触发新 workflow” 语义，避免回写提交
  重新触发 release；同时保留 `[skip ci]` 作为附加保险

## Technical Approach

### Architecture

#### 1. 收缩 `.releaserc.cjs` 的职责

把 `.releaserc.cjs` 从“发布 + 仓库写回”收缩为“纯发布”：

- 保留：
  - `@semantic-release/commit-analyzer`
  - `@semantic-release/release-notes-generator`
  - `@semantic-release/npm`
  - `@semantic-release/github`
- 移除：
  - `@semantic-release/git`
  - `@semantic-release/changelog`

这样做与官方插件定位一致：

- `@semantic-release/git` 适用于需要把变更回提到仓库时使用；本方案明确要把
  这部分从发布主事务中移出
- `@semantic-release/changelog` 官方也明确说明会增加复杂度，只有在需要把
  发布说明写入仓库文件时才值得使用；而这里的仓库 changelog 已改为“发布成功后
  的镜像”

#### 2. 维持 `release.yml` 为发布前门禁

`release.yml` 继续保留以下行为：

- `push main` 触发
- `pnpm release:check` 必须先通过
- 成功后执行 `pnpm semantic-release`

新增建议：

- 为 release workflow 增加 `concurrency`，避免快速连续 push 到 `main` 时
  出现并行发布竞争
- 继续使用能触发后续 workflow 的令牌执行 semantic-release
  （当前是 `DEPENDABOT_TOKEN`），不要切回默认 `GITHUB_TOKEN`，否则
  自动同步 workflow 可能收不到后续事件

#### 3. 新增 `release-sync.yml`

新增同步 workflow，建议包含两个触发器：

```yaml
on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      tag:
        description: 'Published tag to sync, e.g. v1.35.0'
        required: true
```

自动路径：

- 仅处理 `published` 且非 `draft` / 非 `prerelease` 的 release

手动路径：

- 由操作者显式指定单个 `tag`
- 只补跑同步，不重复发布 npm / GitHub Release

#### 4. 同步脚本职责

建议新增一个专用 Node 脚本，例如：

- `scripts/sync-release-artifacts.mjs`

必要时再把纯文本处理逻辑拆到可测试的 helper 中。

脚本输入：

- `tag`
- 可选 `version`（默认从 tag 推导）
- 可选 `release body`（自动路径可直接注入；手动路径可再通过 GitHub API 取回）

脚本输出：

- 更新后的 `package.json`
- 更新后的 `CHANGELOG.md`
- 明确的退出状态：
  - `0`：已同步或无需变更
  - 非 `0`：缺少 release 元数据、版本回退、格式异常等需要人工处理的情况

脚本核心行为：

1. 解析目标版本
2. 读取当前 `package.json version`
3. 读取当前 `CHANGELOG.md`
4. 从 GitHub Release 元数据获取：
   - tag
   - published date
   - release body / notes
5. 生成目标版本对应的 changelog 段落
6. 如果目标版本段落已存在，则执行幂等更新或 no-op，而不是再追加一份
7. 如果 `main` 上的 `package.json version` 已经等于目标版本且 changelog 也已包含
   该版本，脚本直接 no-op
8. 如果目标版本小于 `main` 当前版本且尚未同步，脚本 fail fast，提示人工判断，
   防止把 `package.json` 回退到旧版本

#### 5. CHANGELOG 生成策略

`CHANGELOG.md` 的目标是“镜像 GitHub Release 事实”，不是重新成为发布真相源。

建议策略：

- 仍然保持现有 semantic-release 风格的段落结构，尽量减少历史 diff 噪音
- 新段落由以下数据拼装：
  - 当前 tag
  - 上一个 tag（用于 compare 链接）
  - GitHub Release published date
  - GitHub Release body
- 对目标版本执行定点更新 / 去重，不全量重写整个 changelog

这样可以满足两个目标：

- 重跑同步时不会重复追加相同版本
- 不会在一次补跑里意外“顺便补齐多个历史版本”，与 brainstorm 决策一致

#### 6. 回写提交策略

同步 workflow 生成的提交建议形如：

```text
chore(release-sync): v1.35.0 [skip ci]
```

回写策略要求：

- 默认推送到 `main`
- 优先使用 `GITHUB_TOKEN`，减少额外 PAT 写权限暴露
- 即使未来 token 策略调整，`[skip ci]` 也继续保留，作为避免循环触发的第二层保护

### Implementation Phases

#### Phase 1: 收缩发布事务

涉及文件：

- Modify: `.releaserc.cjs`
- Modify: `.github/workflows/release.yml`

任务：

- [ ] 从 `.releaserc.cjs` 中移除 `@semantic-release/git`
- [ ] 从 `.releaserc.cjs` 中移除 `@semantic-release/changelog`
- [ ] 确认保留 `@semantic-release/npm` 与 `@semantic-release/github` 后，
      semantic-release 仍能完成版本判定、tag、npm 与 GitHub Release
- [ ] 为 `release.yml` 增加并发保护
- [ ] 明确 release workflow 仍以 `pnpm release:check` 为前置门禁

成功标准：

- 发布成功前，`main` 上不再产生 release commit
- 发布失败后可安全重跑 release workflow，而不会先被错误 changelog / version 污染

#### Phase 2: 建立同步事务

涉及文件：

- Add: `.github/workflows/release-sync.yml`
- Add: `scripts/sync-release-artifacts.mjs`
- Optional Add: `scripts/lib/release-sync.js`

任务：

- [ ] 新建自动 + 手动双入口的同步 workflow
- [ ] 自动入口监听 GitHub Release `published`
- [ ] 手动入口支持按单个 `tag` 补跑
- [ ] 实现同步脚本，按目标版本更新 `package.json` 与 `CHANGELOG.md`
- [ ] 增加幂等保护：重复执行同一版本不会产生重复 commit
- [ ] 增加回退保护：旧版本补跑不会把 `package.json` 降回旧值
- [ ] 采用不会再次触发 release workflow 的回写策略

成功标准：

- GitHub Release 成功发布后，`main` 最终能收到对应的版本同步提交
- 同步失败时，仅需手动重跑同步 workflow，不需要重新发布 npm

#### Phase 3: 可验证性与文档收尾

涉及文件：

- Optional Add: `test/release-sync/*.test.ts`
- Modify: `README.md`
- Modify: `AGENTS.md`（仅当需要补充发布恢复说明时）

任务：

- [ ] 为 changelog 文本合成 / 幂等逻辑补充最小夹具测试，至少覆盖：
      首次写入、同版本重跑、重复段落去重、旧版本补跑失败
- [ ] 在 workflow 中添加简洁中文注释，说明自动触发与手动补跑职责
- [ ] 如 README 存在发布流程说明，补充“发布成功后异步同步主线”的事实来源
- [ ] 完成实现后执行 `pnpm qa`
- [ ] 完成实现后执行 `pnpm ci:strict`
- [ ] 完成实现后执行 `pnpm release:check`

成功标准：

- 文档能解释“为什么发布成功后 `main` 的 version/changelog 可能延迟几分钟才更新”
- 脚本和 workflow 的异常路径具备最小可回归验证

## Alternative Approaches Considered

### 方案 A：同一 workflow 成功后直接回写

优点：

- 文件更少
- 上下文连续，不需要跨 workflow 传参

放弃原因：

- 发布与回写仍耦合在一个 workflow 中
- 出现“发布成功但回写失败”时，恢复路径不够清晰
- 不如独立同步 workflow 易于手动补跑

### 方案 C：发布后自动创建同步 PR

优点：

- 主线审计更强
- 不需要直接 push `main`

放弃原因：

- 发布成功后还要人工合并
- 不符合“主线应尽快反映已发布版本”的诉求

### `workflow_run` 触发同步

优点：

- 不依赖 GitHub Release 事件

放弃原因：

- 无法天然获得 release body / tag / published 时间等 changelog 所需元数据
- 需要额外 artifact 或 API 拼装，复杂度高于直接消费 `release.published`

## System-Wide Impact

### Interaction Graph

```text
push main
  -> .github/workflows/release.yml
  -> pnpm release:check
  -> pnpm semantic-release
  -> npm publish + git tag + GitHub Release
  -> .github/workflows/release-sync.yml (on release.published)
  -> scripts/sync-release-artifacts.mjs
  -> update package.json + CHANGELOG.md
  -> push sync commit to main
  -> no new release workflow run
```

### Error & Failure Propagation

- `release:check` 失败：
  - 发布 workflow 直接停止
  - 不会创建 tag / GitHub Release / npm 发布
  - 不会触发同步 workflow

- semantic-release 在发布前阶段失败：
  - `main` 未被 release commit 改写
  - 可以直接 `Re-run jobs` 或重新触发发布

- semantic-release 已部分外部发布但未创建 GitHub Release：
  - 自动同步不会触发
  - 该情况属于“外部发布事实异常”，需要先人工修复 release 事实，再手动补跑同步

- 同步 workflow 失败：
  - npm / tag / GitHub Release 仍然视为成功事实
  - 仅需手动重跑同步，不需要重新发布

### State Lifecycle Risks

- 发布成功与主线回写之间存在短暂最终一致窗口
- 在这个窗口里：
  - npm 版本已经更新
  - Git tag 已存在
  - GitHub Release 已存在
  - `main` 上的 `package.json version` 仍可能是旧值

这是方案接受的设计权衡，必须在文档中明确说明。

### API Surface Parity

受影响的接口 / 文件面：

- semantic-release 配置：`.releaserc.cjs`
- 发布入口：`.github/workflows/release.yml`
- 新同步入口：`.github/workflows/release-sync.yml`
- 仓库版本镜像：`package.json`
- 仓库发布日志镜像：`CHANGELOG.md`

### Integration Test Scenarios

- [ ] 有 releasable commit 时，发布成功并自动生成同步提交
- [ ] `release:check` 失败时，不产生 tag / release / sync
- [ ] 同一 `tag` 手动重跑同步时 no-op，不新增重复 changelog 段落
- [ ] 同步提交推回 `main` 时，不会再次触发 release workflow
- [ ] 手动传入旧版本 `tag` 时，脚本明确拒绝回退 `package.json`

## Acceptance Criteria

### Functional Requirements

- [ ] `.releaserc.cjs` 不再直接把 `CHANGELOG.md` 与 `package.json` 提交回 `main`
- [ ] `release.yml` 仍然在发布前执行 `pnpm release:check`
- [ ] 新增独立同步 workflow，同时支持自动触发与手动补跑
- [ ] 同步 workflow 默认按单个 `tag/version` 工作
- [ ] `CHANGELOG.md` 基于已发布版本元数据生成，而不是重新扫描 `main` 提交范围
- [ ] 同一版本重复同步不会产生重复 changelog 段落或重复同步提交
- [ ] 同步提交通路不会造成 release workflow 循环触发
- [ ] 旧版本补跑不会把 `package.json version` 回退

### Non-Functional Requirements

- [ ] 不引入新的运行时依赖
- [ ] 同步脚本在常规 changelog 文件规模下应保持秒级执行
- [ ] workflow 权限遵循最小可用原则
- [ ] 自动路径与手动路径共享同一套同步逻辑，避免双份实现漂移

### Quality Gates

- [ ] `pnpm qa`
- [ ] `pnpm ci:strict`
- [ ] `pnpm release:check`
- [ ] 如抽出纯函数 helper，则补充针对 changelog 合成和幂等的 Vitest 测试

## Success Metrics

- 失败发布后，`main` 上不再出现残留的 `chore(release)` 提交
- 重新发布时，失败前的业务提交仍会进入版本判定与 release notes
- 发布成功后，`main` 最终能同步到正确的 `package.json version`
- `CHANGELOG.md` 不再因为重复补跑而出现新增重复版本段落
- 同步失败的恢复成本下降为“手动重跑一个 workflow + 指定一个 tag”

## Dependencies & Prerequisites

- 自动同步依赖 GitHub Release `published` 事件
- 触发自动同步的发布动作需要使用能产生后续 workflow 事件的 token
- 同步 workflow 需要 `contents: write` 权限
- checkout 必须拿到完整 tags / 历史，便于生成 compare 链接与版本校验

## Risk Analysis & Mitigation

### 风险 1：`GITHUB_TOKEN` 无法直接推送到 `main`

影响：

- 自动同步无法回写文件

缓解：

- 先验证当前仓库权限模型
- 若受 branch protection 限制，再回退到 PAT 推送，并保留 `[skip ci]` +
  显式提交前缀过滤作为防环保护

### 风险 2：GitHub Release body 与现有 changelog 格式不完全一致

影响：

- `CHANGELOG.md` 风格可能出现轻微漂移

缓解：

- 在同步脚本中自行补齐版本标题、compare 链接、发布日期
- 仅复用 body 的正文部分

### 风险 3：semantic-release 出现“npm 已发布但 GitHub Release 未创建”的部分成功

影响：

- 自动同步 workflow 不会触发

缓解：

- 在文档中明确这属于人工恢复路径
- 手动补跑同步前先补齐 GitHub Release 事实，确保 changelog 真相源完整

### 风险 4：手动补跑旧版本导致版本倒退或 changelog 排序异常

影响：

- `package.json` 与 changelog 状态失真

缓解：

- 同步脚本默认对旧版本 fail fast
- 仅把“刚发布版本的补跑”作为正式支持场景

## Documentation Plan

- 在 `.github/workflows/release.yml` 和新增的
  `.github/workflows/release-sync.yml` 中补充简洁中文注释
- 如 README 涉及发布说明，补充“GitHub Release / npm 为发布事实源，
  `package.json` 与 `CHANGELOG.md` 为后同步镜像”
- 如实现中发现恢复步骤需要人工参与，再补一段最小运维说明

## Sources & References

### Origin

- **Brainstorm document:** `docs/brainstorms/2026-03-14-semantic-release-retry-safe-sync-brainstorm.md`
  — 继承的关键决策：
  1. 发布与主线回写解耦
  2. 同步 workflow 默认只处理单个版本
  3. 自动同步之外必须支持手动补跑

### Internal References

- `.releaserc.cjs:7-19` — 当前 changelog 与 git 回写配置
- `.github/workflows/release.yml:3-41` — 当前发布 workflow
- `package.json:55,74` — `ci:strict` 与 `release:check`
- `CHANGELOG.md:1-37` — 当前 changelog 格式与重复段落现状
- `docs/superpowers/specs/2026-03-10-quality-gate-optimization-design.md:174-176`
  — release 前必须执行 `release:check`

### External References

- GitHub Actions docs — Release event (`release.published`)
- GitHub Actions docs — Events triggered by `GITHUB_TOKEN` do not start new workflow runs
- GitHub Actions docs — Skipping workflow runs with `[skip ci]`
- semantic-release `@semantic-release/git` README
- semantic-release `@semantic-release/changelog` README
