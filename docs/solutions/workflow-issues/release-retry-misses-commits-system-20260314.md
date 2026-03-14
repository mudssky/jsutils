---
module: System
date: 2026-03-14
problem_type: workflow_issue
component: development_workflow
symptoms:
  - 'semantic-release 发布失败后，main 上仍会留下 chore(release) 提交'
  - '重新发布时，失败前的业务 commits 不再进入新的 release notes 和 CHANGELOG'
  - 'CHANGELOG.md 已出现重复版本段落，说明回写过程缺少幂等保护'
root_cause: missing_workflow_step
resolution_type: workflow_improvement
severity: high
tags:
  [semantic-release, github-actions, changelog, release-retry, workflow-sync]
---

# Troubleshooting: semantic-release 重试后漏记提交

## Problem

发布链路把“外部发布事实”和“仓库文件回写”绑在了同一个事务里。只要
`semantic-release` 在 npm / GitHub Release 过程中半成功半失败，`main`
就可能先收到 `chore(release)` 提交，后续重试时提交基线被改写，导致失败前的
业务提交不再进入新的 release notes 和 `CHANGELOG.md`。

## Environment

- Module: System
- Affected Component: GitHub Actions release workflow + semantic-release config
- Date: 2026-03-14
- Key files:
  - `.releaserc.cjs`
  - `.github/workflows/release.yml`
  - `.github/workflows/release-sync.yml`
  - `scripts/sync-release-artifacts.mjs`
  - `scripts/lib/release-sync.mjs`
  - `test/release-sync.test.mjs`

## Symptoms

- 发布 workflow 在 `push main` 后执行 `pnpm semantic-release`，但失败后
  `main` 依然残留 release 提交
- 再次 `Re-run jobs` 或手动重试发布时，之前失败前的业务 commits 不再出现在
  新的 release notes / `CHANGELOG.md`
- 当前仓库的 `CHANGELOG.md` 已有重复版本段落，说明仅靠“重跑同步”无法保证
  文本结果稳定

## What Didn't Work

**Attempted Solution 1:** 继续保留 `@semantic-release/git` 和 `@semantic-release/changelog`，仅依赖重跑 workflow

- **Why it failed:** 发布事务和主线回写仍然耦合。只要 release commit 先进入
  `main`，下一次重试的提交范围就已经失真。

**Attempted Solution 2:** 在同一个 `release.yml` 里发布成功后立刻回写 `main`

- **Why it failed:** 比当前方案更好，但“发布”和“同步”仍然在同一条异常链路上，
  同步失败时不够容易单独补跑，也不利于手动恢复。

## Solution

把发布链路拆成两个事务：

1. **发布事务** 只负责版本判定、tag、npm 和 GitHub Release
2. **同步事务** 在 release 真正成功后，再把 `package.json version` 和
   `CHANGELOG.md` 幂等回写到 `main`

**Code changes**:

```js
// .releaserc.cjs
// Before (broken):
plugins: [
  '@semantic-release/commit-analyzer',
  '@semantic-release/release-notes-generator',
  ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
  '@semantic-release/npm',
  '@semantic-release/github',
  [
    '@semantic-release/git',
    {
      assets: ['CHANGELOG.md', 'package.json'],
      message:
        'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    },
  ],
]

// After (fixed):
plugins: [
  '@semantic-release/commit-analyzer',
  '@semantic-release/release-notes-generator',
  '@semantic-release/npm',
  '@semantic-release/github',
]
```

```yaml
# .github/workflows/release.yml
# Before (broken):
on:
  push:
    branches:
      - main

jobs:
  release-and-publish-npm:
    steps:
      - name: release
        run: pnpm semantic-release

# After (fixed):
on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: release-and-publish-npm-main
  cancel-in-progress: false

jobs:
  release-and-publish-npm:
    if: ${{ github.event_name != 'push' || !startsWith(github.event.head_commit.message, 'chore(release-sync):') }}
    steps:
      - name: release check
        run: pnpm release:check
      - name: release
        env:
          GITHUB_TOKEN: ${{ secrets.DEPENDABOT_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: pnpm semantic-release
```

```yaml
# .github/workflows/release-sync.yml
name: sync-release-artifacts

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      tag:
        required: true
        type: string

jobs:
  sync-release-artifacts:
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: main
      - run: node scripts/sync-release-artifacts.mjs
        env:
          GITHUB_TOKEN: ${{ github.token }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          GITHUB_API_URL: ${{ github.api_url }}
          RELEASE_TAG: ${{ github.event.release.tag_name || inputs.tag }}
```

```js
// scripts/lib/release-sync.mjs
// 关键点：基于已发布版本元数据生成 changelog，并对同版本补跑保持幂等。
export function upsertReleaseSection(changelog, version, nextSection) {
  const targetVersion = normalizeVersion(version)
  const { preamble, sections } = parseReleaseSections(changelog)
  const seenVersions = new Set([targetVersion])
  const dedupedSections = sections
    .filter((section) => {
      if (seenVersions.has(section.version)) {
        return false
      }

      seenVersions.add(section.version)
      return true
    })
    .map((section) => section.content)

  const body = [nextSection.trim(), ...dedupedSections].join('\n\n').trim()
  return preamble ? `${preamble}\n\n${body}\n` : `${body}\n`
}
```

**Commands run**:

```bash
pnpm qa
pnpm ci:strict
pnpm release:check
```

## Why This Works

1. **真正的根因不是 semantic-release 本身，而是缺少独立的“发布后同步”阶段。**  
   旧流程让 `semantic-release` 在发布还没完全成功前，就直接写回
   `CHANGELOG.md` 和 `package.json` 到 `main`，导致失败时主线状态先被污染。

2. **拆成“发布事务 + 同步事务”后，提交基线恢复稳定。**  
   发布事务只产生外部事实：npm 版本、Git tag、GitHub Release。只有这些事实都
   成功存在后，才进入主线回写，因此重试发布时不会因为已有 release commit 而漏掉
   业务提交。

3. **同步逻辑以已发布版本元数据为真相源，而不是重新扫描 `main`。**  
   `CHANGELOG.md` 不再通过“上一个 tag 到当前 HEAD 的提交范围”来重算，而是
   直接使用指定 release 的 `tag`、发布日期和 release notes 来生成单版本段落。

4. **幂等和回退保护让手动补跑可控。**  
   同版本重复执行会 no-op 或定点更新；旧版本补跑如果会导致 `package.json`
   回退，则直接 fail fast，不把历史版本重新顶到 changelog 顶部。

5. **同步提交不会重新触发 release。**  
   自动同步 workflow 使用 `GITHUB_TOKEN` 回写，并额外保留 `[skip ci]` 和
   `chore(release-sync):` 提交前缀过滤，避免形成发布循环。

## Prevention

- 不要把“发布外部事实”和“回写仓库镜像文件”放在同一个事务里
- 把 GitHub Release / npm / tag 作为发布真相源，`package.json` 与
  `CHANGELOG.md` 只作为同步镜像
- 对任何支持手动补跑的 workflow，明确约束为“单版本、幂等、可拒绝回退”
- 为 changelog 合成逻辑补最小单测，至少覆盖：
  - 首次插入
  - 同版本重跑
  - 重复版本去重
  - 旧版本补跑阻止回退
- 发布链路改动后，必须跑完整门禁：
  - `pnpm qa`
  - `pnpm ci:strict`
  - `pnpm release:check`

## Related Issues

- See also: [build-artifact-smoke-test.md](../build-errors/build-artifact-smoke-test.md)
