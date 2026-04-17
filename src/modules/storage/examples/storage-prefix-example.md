# WebLocalStorage 前缀与类型示例

## 基本用法

```typescript
import { WebLocalStorage } from '@mudssky/jsutils'

type UserStorageSchema = {
  profile: { name: string; age: number }
  preferences: { theme: 'light' | 'dark' }
}

const userStorage = new WebLocalStorage<UserStorageSchema>({
  prefix: 'user_',
})

userStorage.setStorageSync('profile', { name: 'John', age: 30 })
userStorage.setStorageSync('preferences', { theme: 'dark' })

const profile = userStorage.getStorageSync('profile')
const preferences = userStorage.getStorageSync('preferences')
```

## 命名空间隔离

```typescript
type ModuleStorageSchema = {
  data: string
}

const moduleA = new WebLocalStorage<ModuleStorageSchema>({
  prefix: 'moduleA_',
})
const moduleB = new WebLocalStorage<ModuleStorageSchema>({
  prefix: 'moduleB_',
})

moduleA.setStorageSync('data', 'A 的数据')
moduleB.setStorageSync('data', 'B 的数据')

console.log(moduleA.getStorageSync('data')) // 'A 的数据'
console.log(moduleB.getStorageSync('data')) // 'B 的数据'
console.log(moduleA.getKeys()) // ['data']
console.log(moduleB.getKeys()) // ['data']
```

配置了 `prefix` 后，`clearStorage()` 和 `clearStorageSync()` 只会清理当前命名空间下的数据；未配置 `prefix` 时，行为与原生 `localStorage.clear()` 一致。

## 结合缓存

```typescript
type CacheStorageSchema = {
  user: { id: number; name: string }
}

const cachedStorage = new WebLocalStorage<CacheStorageSchema>({
  prefix: 'cache_',
  enableCache: true,
})

cachedStorage.setStorageSync('user', { id: 1, name: 'Alice' })

const firstRead = cachedStorage.getStorageSync('user')
const secondRead = cachedStorage.getStorageSync('user')
```

## 存储信息

```typescript
type AppStorageSchema = {
  config: { theme: 'light' | 'dark' }
  user: { name: string }
}

const storage = new WebLocalStorage<AppStorageSchema>({
  prefix: 'myapp_',
})

storage.setStorageSync('config', { theme: 'light' })
storage.setStorageSync('user', { name: 'Bob' })

const info = await storage.getStorageInfo()
console.log(info.keys) // ['config', 'user']
console.log(info.currentSize) // 当前命名空间的估算占用字节数
console.log(info.limitSize) // 5242880 (5MB)
```

`StorageInfo` 现在只暴露稳定字段：`keys`、`currentSize` 和 `limitSize`，不再暴露内部缓存对象。

## 迁移旧代码

```typescript
type LegacySchema = {
  data: string
}

const oldStorage = new WebLocalStorage<LegacySchema>()
oldStorage.setStorageSync('data', 'value')

const newStorage = new WebLocalStorage<LegacySchema>({
  prefix: 'v2_',
})
newStorage.setStorageSync('data', 'value')
```
