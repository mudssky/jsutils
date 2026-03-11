# Typedoc Warning Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清理当前 `typedoc:gen` 中的 warning，让发布链路在保持现有行为的前提下达到“0 errors / 0 warnings”的文档生成状态。

**Architecture:** 先把真正属于公共 API 的性能模块出口补齐，再把 `enum.ts` 里暴露给公共文档的内部类型引用收束到稳定的公共接口上，最后用 `typedoc:gen` 和 `release:check` 作为最终验证。整个过程优先修正“公共文档与真实 API 不一致”的问题，而不是为了消 warning 生硬扩大内部实现细节。

**Tech Stack:** `TypeScript`, `TSDoc`, `Typedoc`, `Vitest`, `pnpm`

---

## Chunk 1: Public API Alignment

### Task 1: 让性能模块的公共出口与文档保持一致

**Files:**

- Modify: `src/index.ts`
- Modify: `test/performance.test.ts`

- [ ] **Step 1: 写一个证明根出口缺少性能 API 的失败测试**

把 `test/performance.test.ts` 的导入切到包别名，示例：

```ts
import {
  PerformanceMonitor,
  comparePerformance,
  createPerformanceMonitor,
  measurePerformance,
  type PerformanceResult,
} from '@mudssky/jsutils'
```

Expected: 当前会因为根出口没有导出 `performance` 模块而失败。

- [ ] **Step 2: 运行定向测试，确认红灯**

Run: `pnpm vitest run test/performance.test.ts`
Expected: FAIL，错误信息指向 `@mudssky/jsutils` 缺少 `PerformanceMonitor` 或相关导出。

- [ ] **Step 3: 做最小实现，补齐根出口**

在 `src/index.ts` 中增加：

```ts
export * from './modules/performance'
```

Expected: 性能模块与 `aidocs/performance-and-decorators.md` 中的公开用法保持一致。

- [ ] **Step 4: 复跑定向测试**

Run: `pnpm vitest run test/performance.test.ts`
Expected: PASS。

### Task 2: 收敛 `enum.ts` 的内部类型泄漏，避免 Typedoc 文档追踪到内部类

**Files:**

- Modify: `src/modules/enum.ts`
- Modify: `test/types/enum.test-d.ts`

- [ ] **Step 1: 先重现当前 warning 列表**

Run: `pnpm typedoc:gen`
Expected: 输出中仍然包含 `BaseEnumObj`、`EnumMatcherBuilder`、`EnumMatcher` 相关 warning。

- [ ] **Step 2: 为公共匹配链路补一个类型层面的失败用例**

在 `test/types/enum.test-d.ts` 中增加对下面两条公共调用链的断言：

```ts
const matchResult = statusEnum.match().value(1).labelIsIn(['待审核'])
const attrMatchResult = statusEnum
  .getAttrMatcher('color')
  .value('orange')
  .labelIsIn(['待审核'])
assertType<boolean>(matchResult)
assertType<boolean>(attrMatchResult)
```

Expected: 如果后续重构返回类型时破坏了外部调用链，类型测试会直接失败。

- [ ] **Step 3: 运行类型测试，确认当前基线**

Run: `pnpm test:types`
Expected: 当前 PASS，作为后续重构的保护网。

- [ ] **Step 4: 把公共文档引用改成稳定公共类型**

在 `src/modules/enum.ts` 中执行这组最小重构：

```ts
export interface EnumArrayObj {
  value: string | number
  label: string
  displayText?: string
  [key: string]: any
}

export interface EnumMatchResult<T extends readonly EnumArrayObj[]> {
  labelIsIn(labels: readonly T[number]['label'][]): boolean
}

export interface EnumMatchBuilder<T extends readonly EnumArrayObj[]> {
  value(value: ExternalValue): EnumMatchResult<T>
  label(label: EnhancedLabel<LabelOf<T>>): EnumMatchResult<T>
  attr<K extends AttributeOf<T>>(
    key: K,
    value: T[number][K],
  ): EnumMatchResult<T>
}
```

同时：

- 删除 `BaseEnumObj -> EnumArrayObj` 的别名链。
- 让 `match()` 返回 `EnumMatchBuilder<T>`。
- 让 `getAttrMatcher()` 返回只暴露公共接口的对象类型。
- 把 `{@link EnumMatcher}` 这类指向内部类的注释改为公共接口名。

Expected: Typedoc 不再需要追踪内部类和内部基础类型。

- [ ] **Step 5: 复跑类型测试**

Run: `pnpm test:types`
Expected: PASS，且新增断言保持通过。

---

## Chunk 2: Typedoc Verification

### Task 3: 用文档链路和完整门禁验证 warning 已消失

**Files:**

- Modify: `src/index.ts`
- Modify: `src/modules/enum.ts`
- Modify: `test/performance.test.ts`
- Modify: `test/types/enum.test-d.ts`

- [ ] **Step 1: 重新生成 Typedoc**

Run: `pnpm typedoc:gen`
Expected: 输出中不再出现 warning；如果仍有 warning，只允许继续修当前 warning 对应的公共/内部边界，不要顺手重构其他模块。

- [ ] **Step 2: 运行快速门禁**

Run: `pnpm qa`
Expected: PASS。

- [ ] **Step 3: 运行发布前校验**

Run: `pnpm release:check`
Expected: PASS，且 `typedoc:gen` 仍为 0 warning。

- [ ] **Step 4: 提交**

```bash
git add src/index.ts src/modules/enum.ts test/performance.test.ts test/types/enum.test-d.ts
git commit -m "docs: clean typedoc warnings"
```

Expected: 形成一个只围绕公共文档边界与导出一致性的提交。
