# WebSessionStorage 使用示例

`WebSessionStorage` 是对浏览器 `sessionStorage` 的封装，提供了类型安全、缓存优化和高级功能的会话级存储解决方案。

## 基本用法

```typescript
import { WebSessionStorage } from '@mudssky/jsutils'

// 创建实例
const sessionStorage = new WebSessionStorage()

// 存储数据
sessionStorage.setStorageSync('user', { name: 'John', age: 30 })
sessionStorage.setStorageSync('token', 'abc123')

// 读取数据
const user = sessionStorage.getStorageSync('user')
const token = sessionStorage.getStorageSync('token')

console.log(user) // { name: 'John', age: 30 }
console.log(token) // 'abc123'
```

## 带前缀的存储

```typescript
// 使用前缀避免键名冲突
const userStorage = new WebSessionStorage({
  prefix: 'user_',
  enableCache: true,
})

// 实际存储的键名为 'user_profile'
userStorage.setStorageSync('profile', { name: 'Alice' })

// 获取所有带前缀的键
const keys = userStorage.getKeys() // ['profile']
```

## 类型安全的存储

```typescript
// 定义存储键的类型
type StorageKeys = 'userInfo' | 'settings' | 'cache'

const typedStorage = new WebSessionStorage<StorageKeys>({
  enableCache: true,
})

// TypeScript 会提供类型检查和自动补全
typedStorage.setStorageSync('userInfo', { id: 1, name: 'Bob' })
typedStorage.setStorageSync('settings', { theme: 'dark' })

// 编译时错误：Argument of type '"invalidKey"' is not assignable
// typedStorage.setStorageSync('invalidKey', 'value')
```

## 异步操作

```typescript
const storage = new WebSessionStorage()

// 异步存储和读取
await storage.setStorage('data', { timestamp: Date.now() })
const data = await storage.getStorage('data')

// 异步删除和清空
await storage.removeStorage('data')
await storage.clearStorage()
```

## 存储信息查询

```typescript
const storage = new WebSessionStorage({ prefix: 'app_' })

storage.setStorageSync('config', { version: '1.0' })
storage.setStorageSync('cache', { data: 'cached' })

// 获取存储信息
const info = storage.getStorageInfoSync()
console.log(info.keys) // ['config', 'cache']
console.log(info.currentSize) // 当前使用的字节数
console.log(info.limitSize) // 存储限制（通常5MB）
```

## 数据同步功能

```typescript
const sessionStorage = new WebSessionStorage({ prefix: 'sync_' })

// 存储一些数据到 sessionStorage
sessionStorage.setStorageSync('userPrefs', { theme: 'dark', lang: 'zh' })
sessionStorage.setStorageSync('tempData', { step: 3 })

// 同步到 localStorage（持久化）
sessionStorage.syncToLocalStorage(['userPrefs'])

// 从 localStorage 恢复数据
sessionStorage.restoreFromLocalStorage(['userPrefs'])
```

## 页面状态快照

```typescript
const storage = new WebSessionStorage()

// 创建页面状态快照
const pageState = {
  scrollPosition: window.scrollY,
  formData: { name: 'John', email: 'john@example.com' },
  currentTab: 'profile',
}

storage.createSnapshot('page_state', pageState)

// 恢复页面状态
const restored = storage.restoreSnapshot('page_state')
if (restored) {
  console.log('恢复的状态:', restored)
  console.log('快照时间:', new Date(restored.timestamp))
}

// 清理过期快照（默认24小时）
storage.cleanExpiredSnapshots()

// 自定义过期时间（12小时）
storage.cleanExpiredSnapshots(12 * 60 * 60 * 1000)
```

## 表单自动保存

```html
<!-- HTML 表单 -->
<form id="userForm">
  <input name="name" type="text" placeholder="姓名" />
  <input name="email" type="email" placeholder="邮箱" />
  <textarea name="bio" placeholder="个人简介"></textarea>
</form>
```

```typescript
const storage = new WebSessionStorage()

// 启用表单自动保存（每5秒保存一次）
const stopAutoSave = storage.autoSaveForm('userForm', 5000)

// 恢复表单数据
const savedFormData = storage.getStorageSync('form_userForm')
if (savedFormData) {
  // 填充表单字段
  Object.entries(savedFormData).forEach(([name, value]) => {
    const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (input) {
      input.value = value as string
    }
  })
}

// 停止自动保存
// stopAutoSave()
```

## 错误处理

```typescript
const storage = new WebSessionStorage()

try {
  // 尝试存储大量数据
  const largeData = new Array(1000000).fill('data')
  storage.setStorageSync('largeData', largeData)
} catch (error) {
  console.error('存储失败:', error.message)
  // 处理存储空间不足的情况
  if (error.message.includes('quota')) {
    // 清理一些不重要的数据
    storage.removeStorageSync('cache')
    storage.removeStorageSync('tempData')
  }
}
```

## 与 localStorage 的区别

| 特性     | sessionStorage               | localStorage         |
| -------- | ---------------------------- | -------------------- |
| 生命周期 | 标签页关闭即清除             | 持久化存储           |
| 作用域   | 仅限当前标签页               | 同源下所有标签页共享 |
| 默认缓存 | 启用（提升性能）             | 可选                 |
| 适用场景 | 临时数据、表单暂存、页面状态 | 用户设置、长期数据   |

## 最佳实践

1. **使用前缀**：避免键名冲突

   ```typescript
   const storage = new WebSessionStorage({ prefix: 'myApp_' })
   ```

2. **启用缓存**：提升读取性能（默认已启用）

   ```typescript
   const storage = new WebSessionStorage({ enableCache: true })
   ```

3. **类型安全**：定义存储键的类型

   ```typescript
   type AppStorageKeys = 'user' | 'settings' | 'cache'
   const storage = new WebSessionStorage<AppStorageKeys>()
   ```

4. **定期清理**：清理过期的快照数据

   ```typescript
   // 在应用启动时清理过期数据
   storage.cleanExpiredSnapshots()
   ```

5. **错误处理**：妥善处理存储异常

   ```typescript
   try {
     storage.setStorageSync('key', value)
   } catch (error) {
     // 处理存储失败
   }
   ```
