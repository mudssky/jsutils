# WebSessionStorage 扩展能力示例

`Storage Extras` helper 提供快照、表单自动保存和 session/local 同步等场景能力。它们不再挂在 `WebSessionStorage` 实例方法上，而是通过组合式函数复用底座能力。

## 快照与同步

```typescript
import {
  WebSessionStorage,
  createSessionSnapshot,
  restoreSessionFromLocalStorage,
  restoreSessionSnapshot,
  syncSessionToLocalStorage,
} from '@mudssky/jsutils'

type SessionSchema = {
  theme: string
} & Record<`snapshot_${string}`, { page: number; timestamp: number }>

const storage = new WebSessionStorage<SessionSchema>({
  prefix: 'app_',
  enableCache: true,
})

createSessionSnapshot(storage, 'settings', { page: 2 })
const snapshot = restoreSessionSnapshot(storage, 'settings')

storage.setStorageSync('theme', 'dark')
syncSessionToLocalStorage(storage, ['theme'])

sessionStorage.clear()
restoreSessionFromLocalStorage(storage, ['theme'])
```

## 表单自动保存

```typescript
import { bindFormAutoSave, WebSessionStorage } from '@mudssky/jsutils'

type FormSchema = Record<`form_${string}`, Record<string, FormDataEntryValue>>

const storage = new WebSessionStorage<FormSchema>({
  enableCache: true,
})

const result = bindFormAutoSave(storage, 'settings-form', 5000)

if (!result.ok) {
  // 业务侧自行决定是否提示或上报
}

// 需要时取消自动保存
result.dispose()
```
