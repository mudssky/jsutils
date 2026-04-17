# WebSessionStorage 核心能力示例

`WebSessionStorage` 现在只负责类型安全的 session 级存储底座：schema 类型、prefix、缓存和统一的 sync/async API。快照、表单自动保存、session/local 同步等高级能力已经移动到独立的 `Storage Extras` helper。

## 基本用法

```typescript
import { WebSessionStorage } from '@mudssky/jsutils'

type SessionSchema = {
  user: { name: string; age: number }
  token: string
}

const storage = new WebSessionStorage<SessionSchema>()

storage.setStorageSync('user', { name: 'John', age: 30 })
storage.setStorageSync('token', 'abc123')

const user = storage.getStorageSync('user')
const token = storage.getStorageSync('token')
```

## 带前缀的会话存储

```typescript
type UserSessionSchema = {
  profile: { name: string }
}

const userStorage = new WebSessionStorage<UserSessionSchema>({
  prefix: 'user_',
  enableCache: true,
})

userStorage.setStorageSync('profile', { name: 'Alice' })

const keys = userStorage.getKeys() // ['profile']
```

配置了 `prefix` 后，`clearStorage()` 和 `clearStorageSync()` 只会清理当前命名空间下的数据；未配置 `prefix` 时，行为与原生 `sessionStorage.clear()` 一致。

## schema 类型安全

```typescript
type AppSessionSchema = {
  userInfo: { id: number; name: string }
  settings: { theme: 'light' | 'dark' }
  cache: string[]
}

const typedStorage = new WebSessionStorage<AppSessionSchema>({
  enableCache: true,
})

typedStorage.setStorageSync('userInfo', { id: 1, name: 'Bob' })
typedStorage.setStorageSync('settings', { theme: 'dark' })

// 编译时报错：key 不存在
// typedStorage.setStorageSync('invalidKey', 'value')
```

## 异步 API

```typescript
type AsyncSessionSchema = {
  data: { timestamp: number }
}

const storage = new WebSessionStorage<AsyncSessionSchema>()

await storage.setStorage('data', { timestamp: Date.now() })
const data = await storage.getStorage('data')

await storage.removeStorage('data')
await storage.clearStorage()
```

## 存储信息查询

```typescript
type InfoSessionSchema = {
  config: { version: string }
  cache: { data: string }
}

const storage = new WebSessionStorage<InfoSessionSchema>({
  prefix: 'app_',
})

storage.setStorageSync('config', { version: '1.0' })
storage.setStorageSync('cache', { data: 'cached' })

const info = storage.getStorageInfoSync()
console.log(info.keys) // ['config', 'cache']
console.log(info.currentSize) // 当前使用的估算字节数
console.log(info.limitSize) // 5242880 (5MB)
```

## 错误处理

```typescript
type LargeSessionSchema = {
  largeData: string[]
}

const storage = new WebSessionStorage<LargeSessionSchema>()

try {
  storage.setStorageSync('largeData', new Array(1000000).fill('data'))
} catch (error) {
  // 业务层自行决定如何提示或上报
}
```
