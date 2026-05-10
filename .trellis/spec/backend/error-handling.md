# 错误处理规范

> 工具库中的错误处理和防御性编程模式。

---

## 错误类型

### 自定义错误类

项目使用 `ArgumentError`（`src/modules/error.ts`）作为参数验证错误：

```typescript
class ArgumentError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ArgumentError'
    this.message = message
  }
}
```

### 错误类型选择

| 场景 | 错误类型 | 示例 |
|------|----------|------|
| 参数不合法 | `ArgumentError` | `range` step=0、`randomInt` start > end |
| 装饰器使用错误 | `TypeError` | `debounceMethod` 修饰非方法 |
| 通用业务错误 | `Error` | `generateBase62Code` 负数长度 |

---

## 错误处理模式

### 模式 1：抛出错误（不合法输入）

当输入参数完全无法处理时，明确抛出错误：

```typescript
if (step === 0) {
  throw new ArgumentError('step cannot be 0')
}
```

### 模式 2：优雅降级（空值/边界输入）

大多数工具函数对 null/undefined/空输入返回安全默认值，不抛异常：

```typescript
first([])           // → null
pick(null, ['a'])   // → {}
trim(null)          // → ''
chunk([], 3)        // → []
```

**原则**：工具函数应尽量不抛异常，让调用者无需 try-catch 包裹。

### 模式 3：try-catch 静默处理

内部操作失败时静默返回失败结果，不冒泡异常：

```typescript
// isValidSelector 内部
try {
  document.createDocumentFragment().querySelector(selector)
  return true
} catch {
  return false
}
```

---

## 测试中的错误断言

```typescript
// 断言抛出特定错误类型
expect(() => range(0.5, 5)).toThrowError('unsupport decimal number')
expect(() => getRandomItemFromArray([])).toThrow(ArgumentError)
```

---

## 禁止的模式

- **禁止吞掉异常后不返回有意义的值** — 要么抛出，要么返回明确的默认值
- **禁止在工具函数中使用 console.error 后继续** — 应抛出或返回错误结果
- **禁止裸 throw 字符串** — 必须使用 Error 或其子类
