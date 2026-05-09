# TypeScript 类型规范

> 类型的定义、组织和导出方式。

---

## 类型组织

### 位置

| 类型类别 | 位置 | 示例 |
|----------|------|------|
| 通用类型工具 | `src/types/` | `Nullable<T>`, `AnyFunction`, `PropertyName` |
| 模块特定类型 | 模块文件内或 `types.ts` | `StorageLike`, `MachineConfig` |
| 复杂模块类型 | `src/modules/<name>/types.ts` | `stateMachine/types.ts` |

### 导出规则

- `src/types/` 下的类型通过 `src/types/index.ts` barrel → `src/index.ts` 的 `export type * from './types/index'` 导出
- 模块内类型跟随模块导出，类型用 `export type { ... }`，值用 `export { ... }`
- 目录模块的 barrel 使用 `export type * from './types'` 导出类型文件

---

## 类型命名

### type vs interface

**优先使用 `type`** 用于：
- 工具类型、映射类型、条件类型
- 联合类型、交叉类型
- 简单对象形状

**使用 `interface`** 用于：
- 类的契约/API 接口（如 `LoggerOptions`, `StorageLike`）
- 带调用签名的类型守卫（如 `DebouncedFunction`）
- 构造函数参数对象

### 命名规则

| 类型 | 规则 | 示例 |
|------|------|------|
| 类型别名 | PascalCase | `Nullable<T>`, `PropertyName` |
| 接口 | PascalCase，无 I 前缀 | `LoggerOptions`, `MachineConfig` |
| 泛型参数 | 描述性名称 | `TValue`, `TResult`, `TContext` |
| 简单泛型 | 短名称 | `T`, `K`, `U` |
| 枚举值 | PascalCase | `SelectorFailReason.NOT_FOUND` |

### 禁止使用 TypeScript enum

项目使用 `EnumArray` 类模式替代 TypeScript `enum`。

新模块如需枚举，可使用 `enum` 关键字（如 debugger 模块的 `SelectorFailReason`），但应评估是否可用 `as const` 对象替代。

---

## JSDoc 规范

每个导出符号必须有 JSDoc：

```typescript
/**
 * 函数简要说明（中文）
 *
 * @param start - 范围的起始值
 * @param end - 范围的结束值
 * @returns 生成的数字数组
 *
 * @example
 * ```typescript
 * range(1, 5) // [1, 2, 3, 4, 5]
 * ```
 *
 * @public
 */
export function range(start: number, end: number): number[]
```

### 必需标签

| 标签 | 场景 |
|------|------|
| `@public` | 所有导出符号（必需） |
| `@param` | 所有函数参数 |
| `@returns` | 所有有返回值的函数 |
| `@example` | 核心函数（推荐） |
| `@throws` | 会抛出异常的函数 |
| `@deprecated` | 已弃用的 API |
| `@internal` | 内部实现细节 |

---

## `any` 的使用

项目在文件级别禁用 `@typescript-eslint/no-explicit-any`：

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
```

用于通用工具函数中无法精确标注类型的位置。新增 `any` 使用时应考虑是否能用泛型替代。

---

## 参考文件

| 文件 | 内容 |
|------|------|
| `src/types/utils.ts` | 核心工具类型（`Equal`, `IsAny`, `Nullable`） |
| `src/types/global.ts` | 基础共享类型（`PropertyName`, `AnyFunction`） |
| `src/modules/stateMachine/types.ts` | 复杂模块类型定义示例 |
| `src/modules/storage/types.ts` | 适配器模式类型定义示例 |
