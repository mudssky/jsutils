# Storage

## 模块定位

`storage` 是一组轻量的类型化键值存储适配器，用来统一 Web Storage、Taro
和 uni-app 的同步存储接口。

它适合这类场景：

- 给 `localStorage` / `sessionStorage` 增加 TypeScript schema 约束。
- 在不同平台间复用同一套 `getStorageSync` / `setStorageSync` 调用习惯。
- 用 `prefix` 做模块级命名空间隔离，避免多个业务写入同名 key。
- 在 Web 端按需开启内存缓存，减少重复反序列化。

它不是完整的数据持久化框架，也不内置运行时数据校验、迁移、加密或跨端同步。
如果需要快照、自动保存、session/local 同步等能力，请优先查看 `storage-extras`。

## 快速开始

```typescript
import { WebLocalStorage } from '@mudssky/jsutils'

type AppStorageSchema = {
  user: { id: number; name: string }
  settings: { theme: 'light' | 'dark' }
}

const storage = new WebLocalStorage<AppStorageSchema>({
  prefix: 'app_',
})

storage.setStorageSync('user', { id: 1, name: 'Alice' })
storage.setStorageSync('settings', { theme: 'dark' })

const user = storage.getStorageSync('user')
const settings = await storage.getStorage('settings')
```

传入泛型 schema 后，key 和 value 会在编译期保持对应关系：

```typescript
// 编译时报错：key 不存在
// storage.setStorageSync('token', 'abc')

// 编译时报错：settings.theme 不接受其他字符串
// storage.setStorageSync('settings', { theme: 'auto' })
```

## 适配器选择

- `WebLocalStorage`：封装浏览器 `localStorage`，适合长期保存的用户配置、低频缓存。
- `WebSessionStorage`：封装浏览器 `sessionStorage`，适合会话内临时状态。
- `TaroStorage`：封装 Taro 同步存储 API，通过构造函数传入 Taro 桥接对象。
- `UniStorage`：封装 uni-app 同步存储 API，通过构造函数传入 uni 桥接对象。

Web 适配器依赖浏览器存储对象，建议只在浏览器环境中实例化和调用。Taro 与 uni-app
适配器不直接导入平台包，而是接收实现了 `NativeStorageBridge` 的对象，方便测试和适配。

## 核心概念

- `StorageSchema`：描述业务 key 与 value 的映射类型。
- `StorageKey`：从 schema 中推导出来的可用 key。
- `prefix`：写入真实存储前拼接到 key 前面的命名空间前缀。
- `enableCache`：Web 适配器的内存缓存开关。
- `StorageInfo`：当前命名空间下的 `keys`、`currentSize` 和 `limitSize` 摘要。

`prefix` 会影响 `getKeys()`、`clearStorageSync()` 和 `getStorageInfoSync()` 的范围。
配置了 `prefix` 后，清空操作只清理当前命名空间下的 key；未配置时，行为接近原生
`clear()`。

## 实例 API

- `getStorageSync(key)`：同步读取值，不存在或解析失败时返回 `null`。
- `setStorageSync(key, value)`：同步写入值。
- `removeStorageSync(key)`：同步移除值。
- `clearStorageSync()`：同步清空当前命名空间。
- `getStorageInfoSync()`：同步获取存储信息。
- `getKeys()`：获取当前命名空间下的逻辑 key 列表。
- `getStorage(key)`：异步读取值，是同步读取的 Promise 包装。
- `setStorage(key, value)`：异步写入值。
- `removeStorage(key)`：异步移除值。
- `clearStorage()`：异步清空当前命名空间。
- `getStorageInfo()`：异步获取存储信息。

## prefix 与缓存

```typescript
type ModuleStorageSchema = {
  data: string
}

const moduleA = new WebLocalStorage<ModuleStorageSchema>({
  prefix: 'moduleA_',
  enableCache: true,
})

const moduleB = new WebLocalStorage<ModuleStorageSchema>({
  prefix: 'moduleB_',
})

moduleA.setStorageSync('data', 'A')
moduleB.setStorageSync('data', 'B')

console.log(moduleA.getStorageSync('data')) // 'A'
console.log(moduleB.getStorageSync('data')) // 'B'
console.log(moduleA.getKeys()) // ['data']
```

`WebLocalStorage` 默认不启用缓存，`WebSessionStorage` 默认启用缓存。开启缓存后，
同一实例会优先从内存中读取已经写入或读取过的值；移除、清空和相关 storage 事件会同步维护缓存。

## 与 Zod 搭配

storage 的 TypeScript schema 只提供编译期约束，不能保证真实存储中的历史数据、
外部篡改数据或旧版本数据一定符合当前类型。Zod 适合在业务层补上运行时校验。

推荐做法是：storage 继续负责读写和命名空间，Zod schema 负责读取后的 `safeParse`
校验。这样不增加 storage 核心依赖，也能在关键业务处处理脏数据。

实际项目中通常会创建一个全局 storage 单例，再从统一模块导出。下面示例把
`globalStorage`、Zod schema 和校验 helper 放在一起：

```typescript
import { WebLocalStorage } from '@mudssky/jsutils'
import type { StorageKey } from '@mudssky/jsutils'
import { z } from 'zod'

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
})

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']),
})

type AppStorageSchema = {
  user: z.infer<typeof userSchema>
  settings: z.infer<typeof settingsSchema>
}

export const globalStorage = new WebLocalStorage<AppStorageSchema>({
  prefix: 'app_',
  enableCache: true,
})

/**
 * 读取并校验全局 storage 中的数据。
 * @param key - 存储键。
 * @param schema - 用于校验读取结果的 Zod schema。
 * @returns 校验成功的数据，失败或不存在时返回 null。
 */
export function getParsedStorage<Key extends StorageKey<AppStorageSchema>>(
  key: Key,
  schema: z.ZodType<AppStorageSchema[Key]>,
): AppStorageSchema[Key] | null {
  const result = schema.safeParse(globalStorage.getStorageSync(key))

  return result.success ? result.data : null
}

/**
 * 校验后写入全局 storage。
 * @param key - 存储键。
 * @param value - 待写入的值。
 * @param schema - 用于校验写入值的 Zod schema。
 * @returns 是否写入成功。
 */
export function setParsedStorage<Key extends StorageKey<AppStorageSchema>>(
  key: Key,
  value: AppStorageSchema[Key],
  schema: z.ZodType<AppStorageSchema[Key]>,
): boolean {
  const result = schema.safeParse(value)
  if (!result.success) {
    return false
  }

  globalStorage.setStorageSync(key, result.data)

  return true
}

export const storageSchemas = {
  user: userSchema,
  settings: settingsSchema,
} as const
```

业务代码中只需要从这个全局模块导入：

```typescript
import {
  getParsedStorage,
  setParsedStorage,
  storageSchemas,
} from './app-storage'

setParsedStorage('settings', { theme: 'dark' }, storageSchemas.settings)

const user = getParsedStorage('user', storageSchemas.user)
```

如果某个业务需要强制校验所有读取结果，可以在业务侧封装一个很薄的 helper，
让 helper 接收 storage 实例和 Zod schema。当前不建议把 Zod 直接做成 storage
核心依赖，因为这会扩大基础模块边界，也会让不需要运行时校验的使用者承担额外依赖。

如果项目存在 SSR 或其他非浏览器运行环境，请避免在服务端直接调用 Web Storage
读写方法，可以把读取动作延后到浏览器生命周期中执行。

## 设计边界

当前模块刻意保持轻量，不包含这些能力：

- 运行时 schema 校验。
- 数据版本迁移。
- 数据加密或脱敏。
- 过期时间与自动清理。
- 跨标签页或跨端同步策略。
- 异步原生存储 API 的完整封装。

这些能力更适合放在业务层或 `storage-extras` 这类可选 helper 中。

## 示例

- [WebLocalStorage 前缀与类型示例](./examples/storage-prefix-example.md)
- [WebSessionStorage 核心能力示例](./examples/session-storage-example.md)
