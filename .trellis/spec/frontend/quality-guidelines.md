# 测试规范

> 测试组织、框架使用和覆盖率要求。

---

## 测试框架

- **测试运行器**：Vitest
- **DOM 环境**：happy-dom（需 `@vitest-environment happy-dom` 标注）
- **类型测试**：`vitest --typecheck` + `assertType<T>()`

---

## 测试目录结构

测试在独立的 `test/` 目录，镜像 `src/modules/` 结构：

```
test/
├── <module>.test.ts              # 单元测试
├── dom/
│   ├── domHelper.test.ts         # 子目录模块测试
│   └── debugger.test.ts
├── stateMachine/
│   └── createMachine.test.ts
└── types/
    └── <module>.test-d.ts        # 类型级测试
```

---

## 导入规范

被测模块通过包名导入（vitest alias 映射到 `./src/index.ts`）：

```typescript
// 命名导入（推荐）
import { chunk, range } from '@mudssky/jsutils'

// 或命名空间导入
import * as _ from '@mudssky/jsutils'
```

---

## 测试结构

### describe/test 组织

```typescript
describe('模块名', () => {
  // 可选：共享 setup
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  test('功能描述', () => {
    // arrange + act + assert
  })
})
```

### 断言风格

两种风格混用，无强制要求：

```typescript
// expect 风格（Jest）
expect(result).toBe(true)
expect(arr).toEqual([1, 2, 3])
expect(fn).toHaveBeenCalledWith(1, 2)

// assert 风格（Chai）
assert.equal(result, 'expected')
assert.deepEqual(obj, {})
assert.isTrue(flag)
```

### 类型级测试

```typescript
import { assertType, test } from 'vitest'

test('type check', () => {
  assertType<Nullable<string>>('hello')
  // @ts-expect-error 不接受 number
  assertType<Nullable<string>>(123)
})
```

### 参数化测试

使用项目内置的 `tableTest` 工具：

```typescript
import { tableTest, TestCase } from '@mudssky/jsutils'

const cases: TestCase<[string, string]>[] = [
  { input: ['hello', 'world'], expect: 'helloworld' },
]
tableTest(cases, (tcase) => {
  expect(concat(...tcase.input)).toBe(tcase.expect)
})
```

---

## 覆盖率要求

| 指标 | 阈值 |
|------|------|
| Statements | 90% |
| Lines | 90% |
| Functions | 88% |
| Branches | 83% |

---

## DOM 测试

DOM 相关测试需标注环境：

```typescript
/**
 * @vitest-environment happy-dom
 */
```

在 `beforeEach` 中创建容器并在 `document.body` 上挂载：

```typescript
beforeEach(() => {
  container = document.createElement('div')
  container.innerHTML = `<div class="target">Content</div>`
  document.body.appendChild(container)
})
```

---

## 定时器测试

```typescript
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

test('debounce', () => {
  const fn = vi.fn()
  const debounced = debounce(fn, 100)
  debounced()
  vi.advanceTimersByTime(100)
  expect(fn).toBeCalledTimes(1)
})
```

---

## 禁止的模式

- 禁止在测试文件中直接 `import` 源文件相对路径 — 使用 `@mudssky/jsutils` 包名
- 禁止跳过测试（`test.skip`）提交到主分支 — 仅在开发中使用
- 配置文件（Dockerfile、nginx.conf 等）不需要单元测试
