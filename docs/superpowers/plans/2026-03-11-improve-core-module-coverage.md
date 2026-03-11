# Core Module Coverage Uplift Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升 `env.ts` 与 `storage.ts` 的低覆盖运行时分支覆盖率，在不改变既有公开语义的前提下提高质量门禁的信心。

**Architecture:** 先用当前 coverage 报告锁定 `env.ts` 与 `storage.ts` 的未覆盖分支，再通过补运行时测试和少量为测试性服务的内部整理来覆盖这些路径。浏览器依赖分支放到 DOM 环境测试中，纯逻辑与异常分支继续留在 Node 环境测试中，避免单个测试文件职责过载。

**Tech Stack:** `TypeScript`, `Vitest`, `happy-dom`, `pnpm`

---

## Chunk 1: Environment Coverage

### Task 1: 覆盖 `env.ts` 的浏览器与异常分支

**Files:**

- Modify: `test/env.test.ts`
- Modify: `src/modules/env.ts`

- [ ] **Step 1: 记录当前 `env.ts` 的未覆盖行**

Run: `pnpm test:coverage`
Expected: 报告中能看到 `env.ts` 当前仍有浏览器分支和异常分支未覆盖。

- [ ] **Step 2: 为浏览器分支写失败测试**

在 `test/env.test.ts` 中新增用例，覆盖至少这些行为：

```ts
it('should return true for isBrowser when window exists', () => {})
it('should return true for isDocumentAvailable when document exists', () => {})
it('should return browser fields from getEnvironmentInfo', () => {})
it('should execute callback in runInBrowser when window exists', () => {})
it('should execute callback in runWithDocument when document exists', () => {})
```

Expected: 至少部分用例因为测试环境准备不足或断言未满足而失败。

- [ ] **Step 3: 运行定向测试，确认红灯**

Run: `pnpm vitest run test/env.test.ts`
Expected: FAIL，失败原因应与浏览器全局对象模拟或断言预期有关，而不是语法错误。

- [ ] **Step 4: 做最小修复，让测试真正覆盖分支**

优先在测试中通过 `Object.defineProperty(globalThis, ...)` 注入：

```ts
window
document
navigator
localStorage
sessionStorage
```

只有当当前实现无法稳定测试时，才允许在 `src/modules/env.ts` 中抽出最小内部 helper，例如：

```ts
const getNavigator = () =>
  typeof navigator === 'undefined' ? undefined : navigator
```

Expected: 代码不做行为改动，只增加可测试性。

- [ ] **Step 5: 覆盖存储可用性的异常分支**

新增测试让 `localStorage.setItem` / `sessionStorage.setItem` 抛错，验证：

```ts
expect(isLocalStorageAvailable()).toBe(false)
expect(isSessionStorageAvailable()).toBe(false)
```

Run: `pnpm vitest run test/env.test.ts`
Expected: PASS。

---

## Chunk 2: Storage Coverage

### Task 2: 覆盖 `storage.ts` 的异常路径与浏览器辅助分支

**Files:**

- Modify: `test/storage.test.ts`
- Create: `test/dom/storage.test.ts`
- Modify: `src/modules/storage.ts`

- [ ] **Step 1: 锁定 `storage.ts` 当前主要未覆盖块**

Run: `pnpm test:coverage`
Expected: 报告与源码未覆盖块能对应到这些区域：

- `handleQuotaExceeded`
- `restoreFromLocalStorage()` 无参数分支
- `autoSaveForm()` 的非浏览器、找不到表单、解绑逻辑

- [ ] **Step 2: 为纯逻辑与异常路径写失败测试**

在 `test/storage.test.ts` 中新增用例，至少覆盖：

```ts
test('should retry quota exceeded writes once and keep cache consistent', () => {})
test('should throw when quota retry also fails', () => {})
test('should restore all prefixed keys from localStorage when keys are omitted', () => {})
test('should ignore non-prefixed keys when restoring without explicit keys', () => {})
```

Run: `pnpm vitest run test/storage.test.ts`
Expected: FAIL。

- [ ] **Step 3: 为 DOM 分支创建独立 happy-dom 测试文件**

创建 `test/dom/storage.test.ts`，用 `@vitest-environment happy-dom` 覆盖：

```ts
test('autoSaveForm should no-op outside browser-compatible setup', () => {})
test('autoSaveForm should warn and return disposer when form is missing', () => {})
test('autoSaveForm should persist form data and remove listeners on disposer', () => {})
```

Run: `pnpm vitest run test/dom/storage.test.ts`
Expected: FAIL。

- [ ] **Step 4: 做最小实现或最小测试性整理**

优先不改生产行为；如果某个分支无法稳定测试，只允许在 `src/modules/storage.ts` 中抽出很小的内部 helper，例如：

```ts
private getDocumentForm(formId: string) { ... }
private getAllPrefixedLocalKeys(): T[] { ... }
```

禁止顺手修 `prefix clear` 语义，那是下一份单独计划。

- [ ] **Step 5: 复跑定向测试**

Run: `pnpm vitest run test/storage.test.ts test/dom/storage.test.ts`
Expected: PASS。

### Task 3: 用 coverage 结果确认提升有效

**Files:**

- Modify: `test/env.test.ts`
- Modify: `test/storage.test.ts`
- Create: `test/dom/storage.test.ts`
- Modify: `src/modules/env.ts`
- Modify: `src/modules/storage.ts`

- [ ] **Step 1: 重新运行 coverage**

Run: `pnpm test:coverage`
Expected: `env.ts` 和 `storage.ts` 的 statements / branches 明显高于修改前基线。

- [ ] **Step 2: 运行严格门禁**

Run: `pnpm ci:strict`
Expected: PASS。

- [ ] **Step 3: 运行发布前校验**

Run: `pnpm release:check`
Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add test/env.test.ts test/storage.test.ts test/dom/storage.test.ts src/modules/env.ts src/modules/storage.ts
git commit -m "test: improve core module coverage"
```

Expected: 提交只围绕低覆盖核心模块的测试补强与必要的测试性整理。
