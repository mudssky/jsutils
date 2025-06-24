# Storage 前缀功能使用示例

## 基本用法

```typescript
import { WebLocalStorage } from '@mudssky/jsutils'

// 创建带前缀的存储实例
const userStorage = new WebLocalStorage({ prefix: 'user_' })
const appStorage = new WebLocalStorage({ prefix: 'app_' })

// 设置数据
userStorage.setStorageSync('profile', { name: 'John', age: 30 })
userStorage.setStorageSync('preferences', { theme: 'dark' })

appStorage.setStorageSync('version', '1.0.0')
appStorage.setStorageSync('config', { debug: true })

// 实际存储的key会自动添加前缀：
// localStorage: 'user_profile', 'user_preferences', 'app_version', 'app_config'

// 获取数据时不需要前缀
const profile = userStorage.getStorageSync('profile') // { name: 'John', age: 30 }
const version = appStorage.getStorageSync('version') // '1.0.0'
```

## 数据隔离

```typescript
// 不同前缀的存储实例之间数据完全隔离
const moduleA = new WebLocalStorage({ prefix: 'moduleA_' })
const moduleB = new WebLocalStorage({ prefix: 'moduleB_' })

moduleA.setStorageSync('data', 'A的数据')
moduleB.setStorageSync('data', 'B的数据')

console.log(moduleA.getStorageSync('data')) // 'A的数据'
console.log(moduleB.getStorageSync('data')) // 'B的数据'

// 获取各自的keys，只返回当前前缀的数据
console.log(moduleA.getKeys()) // ['data']
console.log(moduleB.getKeys()) // ['data']
```

## 结合缓存功能

```typescript
// 同时启用前缀和缓存功能
const cachedStorage = new WebLocalStorage({
  prefix: 'cache_',
  enableCache: true,
})

cachedStorage.setStorageSync('user', { id: 1, name: 'Alice' })

// 第一次从localStorage读取
const user1 = cachedStorage.getStorageSync('user')

// 第二次从内存缓存读取，更快
const user2 = cachedStorage.getStorageSync('user')
```

## 存储信息统计

```typescript
const storage = new WebLocalStorage({ prefix: 'myapp_' })

storage.setStorageSync('config', { theme: 'light' })
storage.setStorageSync('user', { name: 'Bob' })

// 获取存储信息，只统计当前前缀的数据
const info = await storage.getStorageInfo()
console.log(info.keys) // ['config', 'user']
console.log(info.currentSize) // 当前前缀数据的总大小
console.log(info.limitSize) // 5242880 (5MB)
```

## 迁移现有代码

```typescript
// 原有代码
const oldStorage = new WebLocalStorage()
oldStorage.setStorageSync('data', 'value')

// 迁移到带前缀的版本
const newStorage = new WebLocalStorage({ prefix: 'v2_' })
newStorage.setStorageSync('data', 'value')

// 或者不设置前缀保持兼容
const compatStorage = new WebLocalStorage({ prefix: '' })
// 等同于
const compatStorage2 = new WebLocalStorage()
```

## 最佳实践

1. **使用有意义的前缀**：如 `user_`、`app_`、`cache_` 等
2. **团队协作**：不同模块使用不同前缀避免冲突
3. **版本管理**：可以使用版本号作为前缀进行数据迁移
4. **环境隔离**：开发和生产环境使用不同前缀

```typescript
// 环境相关的前缀
const isDev = process.env.NODE_ENV === 'development'
const storage = new WebLocalStorage({
  prefix: isDev ? 'dev_' : 'prod_',
})
```
