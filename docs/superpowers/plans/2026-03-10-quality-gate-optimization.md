# 质量闭环优化 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保持 `pnpm qa` 快速反馈的前提下，为仓库补齐类型断言测试、coverage 与发布前校验，形成开发、PR、发布三层质量门禁。

**Architecture:** 先收敛本地脚本与 Vitest 配置，让 `qa`、`ci:strict`、`release:check` 三层职责稳定，再改造 PR / release / pages workflow 复用这些脚本，最后校准 coverage 阈值并补充开发文档。整个过程避免大规模重构，只对质量门禁相关配置做最小修改。

**Tech Stack:** `pnpm`, `TypeScript`, `Vitest`, `ESLint`, `GitHub Actions`, `Rollup`

---

## Chunk 1: Local Gates

### Task 1: 调整本地脚本，形成快路径与严格路径分层

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 记录当前测试与门禁脚本**

Run: `Get-Content package.json | Select-String '"qa"|"test"|"test:silent"|"test:coverage"|"ci:check"' -Context 0,0`
Expected: 能看到当前 `qa`、测试脚本与 `ci:check` 的定义。

- [ ] **Step 2: 为类型断言测试新增独立脚本**

将 `package.json` 增加类似下面的脚本定义：

```json
{
  "scripts": {
    "test:types": "vitest typecheck"
  }
}
```

Expected: 仓库存在可单独执行的类型断言测试命令。

- [ ] **Step 3: 保持 `qa` 快速，但补上类型断言测试**

将 `qa` 调整为类似：

```json
{
  "scripts": {
    "qa": "pnpm typecheck && pnpm lint:fix && pnpm test:silent && pnpm test:types"
  }
}
```

Expected: `qa` 不包含 coverage / build / docs，但会覆盖运行时测试与类型断言测试。

- [ ] **Step 4: 新增严格 CI 与发布前校验脚本**

将 `package.json` 增加类似：

```json
{
  "scripts": {
    "ci:strict": "pnpm qa && pnpm test:coverage",
    "release:check": "pnpm ci:strict && pnpm build && pnpm docs:build"
  }
}
```

Expected: 仓库具备清晰的三层门禁脚本。

- [ ] **Step 5: 运行快路径脚本验证基础闭环**

Run: `pnpm qa`
Expected: 退出码为 0，且包含 `test:types` 的执行结果。

### Task 2: 调整 Vitest 类型测试与 coverage 口径

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: 增加类型断言测试匹配范围**

在 `vitest.config.ts` 的 `test` 配置中增加类似：

```ts
typecheck: {
  include: ['test/types/**/*.test-d.ts'],
}
```

Expected: `vitest typecheck` 只聚焦类型断言测试文件。

- [ ] **Step 2: 清理 coverage 统计范围**

把 `coverage` 配置调整为只统计有意义的运行时代码，排除类似：

```ts
exclude: [
  'src/types/**',
  'src/modules/config/**',
  'src/modules/dom/index.ts',
  'src/modules/regex/index.ts',
  'src/**/*.html',
]
```

Expected: coverage 报告不再被纯类型文件和 barrel 文件污染。

- [ ] **Step 3: 加入第一阶段 coverage threshold**

在 `coverage.thresholds` 中加入：

```ts
thresholds: {
  statements: 90,
  lines: 90,
  functions: 88,
  branches: 83,
}
```

Expected: CI 能阻止明显的 coverage 回退。

- [ ] **Step 4: 运行类型断言测试**

Run: `pnpm test:types`
Expected: 退出码为 0，能看到 Vitest typecheck 模式执行结果。

- [ ] **Step 5: 运行 coverage 并校准阈值**

Run: `pnpm test:coverage`
Expected: 退出码为 0；若实际基线低于预设阈值，只允许把阈值下调到“刚好防回退”的水平，不允许为了过 CI 大幅放水。

---

## Chunk 2: CI Workflows

### Task 3: 把 PR 工作流切换到严格门禁

**Files:**
- Modify: `.github/workflows/test.yml`

- [ ] **Step 1: 记录当前 PR workflow 的执行命令**

Run: `Get-Content .github/workflows/test.yml`
Expected: 能看到当前 workflow 运行的是 `pnpm ci:check` 或等价快路径。

- [ ] **Step 2: 将 PR workflow 改为执行 `pnpm ci:strict`**

把 workflow 中的最终执行命令改成类似：

```yml
- run: pnpm ci:strict
```

Expected: PR 校验默认执行严格门禁，而不是只执行快路径。

- [ ] **Step 3: 运行本地严格门禁模拟**

Run: `pnpm ci:strict`
Expected: 退出码为 0；若失败，先修脚本或 coverage 配置，再继续 workflow 修改。

### Task 4: 在 release 前增加发布前校验

**Files:**
- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: 记录当前 release workflow 的发布步骤**

Run: `Get-Content .github/workflows/release.yml`
Expected: 能看到安装依赖后直接执行 `pnpm semantic-release` 的流程。

- [ ] **Step 2: 在 `semantic-release` 前增加 `pnpm release:check`**

把 workflow 调整为类似：

```yml
- name: release check
  run: pnpm release:check

- name: release
  env:
    GITHUB_TOKEN: ${{ secrets.DEPENDABOT_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  run: pnpm semantic-release
```

Expected: 发布动作之前已经通过严格校验、构建与文档链路检查。

- [ ] **Step 3: 本地执行发布前校验**

Run: `pnpm release:check`
Expected: 退出码为 0；如果 `docs:build` 与 Pages 的真实部署目标不一致，改为仓库实际使用的文档构建命令，并保持 release 与 deploy 口径一致。

### Task 5: 明确 Pages workflow 的职责命名

**Files:**
- Modify: `.github/workflows/pages.yml`

- [ ] **Step 1: 检查 Pages workflow 当前产物来源**

Run: `Get-Content .github/workflows/pages.yml`
Expected: 确认当前发布的是 Typedoc 产物还是 VitePress 产物。

- [ ] **Step 2: 让 workflow 名称和步骤名表达真实职责**

把名称改成类似：

```yml
name: Deploy Typedoc Pages
```

并把构建步骤改为与产物一致的名字，例如：

```yml
- name: Build Typedoc
  run: pnpm typedoc:gen
```

Expected: workflow 名称、步骤名、构建命令和发布目录彼此一致。

---

## Chunk 3: Documentation And Final Verification

### Task 6: 更新命令文档，避免开发者误用

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: 在 README 中补充三层门禁命令说明**

新增简短说明，明确：

```md
- `pnpm qa`: 本地快速校验
- `pnpm ci:strict`: PR 严格门禁
- `pnpm release:check`: 发布前校验
```

Expected: 新开发者能直接判断应运行哪个命令。

- [ ] **Step 2: 在仓库约定中同步新的门禁定义**

更新 `AGENTS.md` 或项目文档中的命令说明，使其与 `package.json` 一致。

Expected: 仓库内不存在“文档说法”和“真实脚本”不一致的情况。

### Task 7: 完整回归验证并收尾

**Files:**
- Modify: `package.json`
- Modify: `vitest.config.ts`
- Modify: `.github/workflows/test.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/workflows/pages.yml`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: 运行快速门禁**

Run: `pnpm qa`
Expected: 退出码为 0。

- [ ] **Step 2: 运行严格门禁**

Run: `pnpm ci:strict`
Expected: 退出码为 0，coverage 阈值生效。

- [ ] **Step 3: 运行发布前校验**

Run: `pnpm release:check`
Expected: 退出码为 0，构建与文档链路正常。

- [ ] **Step 4: 检查工作区变更**

Run: `git status --short`
Expected: 只包含本计划涉及的配置与文档文件。

- [ ] **Step 5: 提交**

```bash
git add package.json vitest.config.ts .github/workflows/test.yml .github/workflows/release.yml .github/workflows/pages.yml README.md AGENTS.md
git commit -m "chore: tighten quality gates"
```

Expected: 形成单一职责清晰的质量门禁提交。
