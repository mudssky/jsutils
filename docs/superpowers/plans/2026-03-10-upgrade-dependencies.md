# Dependency Upgrade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前项目的运行时与开发依赖升级到最新可用版本，并把项目恢复到可验证的可构建状态。

**Architecture:** 先更新包清单与锁文件，再用项目既有的测试、类型检查、Lint 和构建命令识别兼容性问题，最后只对受升级影响的配置或源码做最小修复。

**Tech Stack:** `pnpm`, `TypeScript`, `Vitest`, `ESLint`, `Rollup`, `Biome`

---

## Chunk 1: Manifest Upgrade

### Task 1: 升级依赖清单与锁文件

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: 记录当前可升级依赖**

Run: `pnpm outdated`
Expected: 输出当前版本与最新版本对照表。

- [ ] **Step 2: 升级到最新版本**

Run: `pnpm up -Lri --latest`
Expected: `package.json` 与 `pnpm-lock.yaml` 更新到最新可解析版本。

- [ ] **Step 3: 安装并整理锁文件**

Run: `pnpm install`
Expected: 安装成功，锁文件稳定，无未解析依赖错误。

## Chunk 2: Compatibility Verification

### Task 2: 运行质量门禁并修复升级兼容性

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `eslint.config.mjs`
- Modify: `rollup.config.js`
- Modify: `rollup.config.dev.js`
- Modify: `vitest.config.ts`
- Modify: `tsconfig.json`
- Modify: `test/bytes.test.ts`

- [ ] **Step 1: 运行类型检查**

Run: `pnpm typecheck`
Expected: 0 errors；若失败，记录受升级影响的配置或源码。

- [ ] **Step 2: 运行测试**

Run: `pnpm test:silent`
Expected: 0 failures；若失败，修复与依赖升级直接相关的问题。

- [ ] **Step 3: 运行 Lint**

Run: `pnpm lint`
Expected: 0 errors；若失败，调整配置或代码以兼容新版规则。

- [ ] **Step 4: 运行构建**

Run: `pnpm build`
Expected: 构建成功，产物正常生成。

- [ ] **Step 5: 复跑完整验证**

Run: `pnpm qa && pnpm build`
Expected: 全部命令退出码为 0。
