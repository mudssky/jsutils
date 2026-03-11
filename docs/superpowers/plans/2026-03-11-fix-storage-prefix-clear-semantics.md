# Storage Prefix Clear Semantics Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 `WebLocalStorage` 与 `WebSessionStorage` 在配置 `prefix` 后仍清空整个浏览器存储区的语义问题，让 `clearStorage`/`clearStorageSync` 真正遵守命名空间边界。

**Architecture:** 先用失败测试明确“有 prefix 只清当前命名空间、无 prefix 仍全清”的新语义，再在 `storage.ts` 中抽出共享的前缀清理 helper，分别复用到 local/session 两套 Web 存储实现。最后同步更新相关示例和注释，避免行为变化只存在于测试里。

**Tech Stack:** `TypeScript`, `Vitest`, `pnpm`

---

## Chunk 1: Behavior Lock

### Task 1: 用测试锁定 prefix 下的清理边界

**Files:**

- Modify: `test/storage.test.ts`

- [ ] **Step 1: 为 `WebLocalStorage` 写失败测试**

在 `test/storage.test.ts` 的 prefix 场景中新增至少 2 个用例：

```ts
test('clearStorageSync should only remove keys with current prefix', () => {})
test('clearStorage should only remove keys with current prefix', async () => {})
```

测试准备应包含：

- 一个带当前前缀的 key
- 一个带其他前缀的 key
- 一个无前缀 key

Expected: 当前实现会失败，因为它直接调用了 `localStorage.clear()`。

- [ ] **Step 2: 为 `WebSessionStorage` 写失败测试**

继续新增：

```ts
test('session clearStorageSync should only remove keys with current prefix', () => {})
test('session clearStorage should only remove keys with current prefix', async () => {})
```

Expected: 当前实现会失败，因为它直接调用了 `sessionStorage.clear()`。

- [ ] **Step 3: 锁定无 prefix 时的兼容行为**

再新增 2 个对照测试：

```ts
test('local clearStorageSync without prefix should still clear all keys', () => {})
test('session clearStorageSync without prefix should still clear all keys', () => {})
```

Expected: 这些测试应描述兼容语义，避免修复时误把无 prefix 的全清行为也改掉。

- [ ] **Step 4: 运行定向测试，确认红灯**

Run: `pnpm vitest run test/storage.test.ts`
Expected: FAIL，且失败点只与 prefix 清理语义有关。

---

## Chunk 2: Implementation

### Task 2: 在 `storage.ts` 中实现命名空间感知的清理逻辑

**Files:**

- Modify: `src/modules/storage.ts`

- [ ] **Step 1: 抽出共享的前缀清理 helper**

在 `AbstractStorage` 或文件内私有 helper 中增加类似能力：

```ts
protected clearPrefixedStorageKeys(storage: StorageLike): void {
  if (!this.prefix) {
    storage.clear()
    return
  }

  const keysToRemove: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const fullKey = storage.key(i)
    if (fullKey && fullKey.startsWith(this.prefix)) {
      keysToRemove.push(fullKey)
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key))
}
```

Expected: 清理时不会在遍历中边删边改索引。

- [ ] **Step 2: 让 `WebLocalStorage` 复用该 helper**

把：

```ts
localStorage.clear()
```

替换为共享 helper 调用，并保留缓存清理逻辑。

- [ ] **Step 3: 让 `WebSessionStorage` 复用该 helper**

把：

```ts
sessionStorage.clear()
```

替换为共享 helper 调用，并保留缓存清理逻辑。

- [ ] **Step 4: 更新方法注释，明确 prefix 语义**

至少补充 `clearStorageSync()` / `clearStorage()` 的注释，明确：

- 有 `prefix` 时，只清当前实例命名空间
- 无 `prefix` 时，仍清整个存储区

- [ ] **Step 5: 复跑定向测试**

Run: `pnpm vitest run test/storage.test.ts`
Expected: PASS。

---

## Chunk 3: Docs And Final Verification

### Task 3: 同步示例文档并完成回归

**Files:**

- Modify: `examples/storage-prefix-example.md`
- Modify: `examples/session-storage-example.md`
- Modify: `src/modules/storage.ts`
- Modify: `test/storage.test.ts`

- [ ] **Step 1: 在前缀示例中补充 clear 行为说明**

在 `examples/storage-prefix-example.md` 与 `examples/session-storage-example.md` 中各增加一段简短说明，例如：

```md
当实例配置了 `prefix` 时，`clearStorage()` 只会清除当前前缀下的数据，不会影响其他模块的数据。
```

Expected: 用户文档与新行为一致。

- [ ] **Step 2: 运行快速门禁**

Run: `pnpm qa`
Expected: PASS。

- [ ] **Step 3: 运行严格门禁**

Run: `pnpm ci:strict`
Expected: PASS，且 `storage.ts` 的覆盖率不下降。

- [ ] **Step 4: 运行发布前校验**

Run: `pnpm release:check`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/modules/storage.ts test/storage.test.ts examples/storage-prefix-example.md examples/session-storage-example.md
git commit -m "fix: scope prefixed storage clear"
```

Expected: 形成一个只围绕 prefix 清理语义与文档同步的修复提交。
