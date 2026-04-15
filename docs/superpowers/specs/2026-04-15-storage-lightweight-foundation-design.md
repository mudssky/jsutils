# Storage 轻量底座重构设计

**日期：** 2026-04-15
**状态：** 已确认
**主题：** 将 `src/modules/storage.ts` 从“场景功能集合”收敛为“轻量通用 storage 底座”，保留多平台统一 API，并把高级能力外置为扩展导出

---

## 背景

当前 [`src/modules/storage.ts`](c:/home/Projects/frontend/jsutils/src/modules/storage.ts) 已经同时承担了多类职责：

1. 基础存储抽象：读写、删除、清空、序列化、前缀命名空间。
2. 平台适配：`WebLocalStorage`、`WebSessionStorage`、`TaroStorage`、`UniStorage`。
3. 缓存策略：`enableCache`、缓存读写与缓存失效处理。
4. 场景能力：`syncToLocalStorage`、`restoreFromLocalStorage`、`autoSaveForm`、快照创建与清理。
5. 浏览器环境逻辑：`window`、`document`、`console`、`storage` 事件监听。

虽然当前设计已经提供了 key 的字面量类型约束，能减少 key 写错的问题，但整体模块已经偏离“轻量通用底座”的定位：

- 核心模块职责过多，文件过大，维护和测试边界不清晰。
- `WebSessionStorage` 混入了明显的业务场景能力，不再只是 storage 适配器。
- 目前只约束了 key 类型，value 仍然大多是 `unknown`，类型收益不完整。
- 抽象层直接依赖浏览器的 `Storage` 类型，不利于形成真正的平台无关底座。
- 底座层当前会直接 `console.warn` / `console.error`，日志决策与库职责耦合。

用户已明确本轮目标是：

- 把 `storage` 收敛为轻量通用底座。
- 接受 breaking change。
- 保留异步方法，为真正异步实现留扩展空间，同时统一多平台 API。
- 仍从主包统一导出核心与扩展能力，不拆成强制二级入口。

---

## 目标

1. 将 `storage` 主模块回归为轻量、可复用、平台无关的存储底座。
2. 保留多平台统一的 sync/async API 形态，避免未来异步存储接入时再次推翻接口。
3. 将类型系统从“只约束 key”升级为“约束 key 与 value 的 schema 映射”。
4. 将高级场景能力从核心 storage 类中移出，改为扩展 helper。
5. 清理 DOM 环境耦合和库层直接日志输出，让核心层职责更纯粹。

## 非目标

1. 本轮不引入全新的存储后端，例如 IndexedDB。
2. 本轮不把类式 API 全量改造成函数式工厂 API。
3. 本轮不保留旧的高级方法壳用于长期兼容；允许直接 breaking change。
4. 本轮不改变主包统一导出的发布方式，只做内部结构分层与导出分组。

---

## 方案对比

### 方案 1：保留平台存储类，场景能力外置为扩展 helper（采用）

- 保留 `WebLocalStorage`、`WebSessionStorage`、`TaroStorage`、`UniStorage`。
- 核心层只负责底座能力。
- 快照、表单自动保存、session/local 同步等能力移到扩展模块，以组合式 helper 暴露。

优点：

- 最符合“轻量通用底座”的目标。
- 基础 CRUD API 保持连续性，迁移成本可控。
- 可以显著收缩核心模块的职责、体积和测试面。

缺点：

- 使用高级功能的用户需要改用新的 helper API。
- 文档和测试需要重新按核心层/扩展层拆分。

### 方案 2：去类化，改为工厂函数 API

- 用 `createStorage(...)` 替代现有类。
- 将平台适配器注入到工厂中。

优点：

- API 更小，组合性和 tree-shaking 理论上更好。

缺点：

- breaking 面过大。
- 现有测试、示例、用户用法与心智都需要重建。
- 不符合本轮“聚焦收敛而非推倒重来”的节奏。

### 方案 3：保留现有类和高级方法，只做内部重构

- 对外 API 尽量不动。
- 只在内部重新拆分文件和职责。

优点：

- 使用方迁移成本最低。

缺点：

- 核心层语义依然不纯。
- 用户仍会把 `storage` 理解为“场景功能集合”，而非底座。
- 无法真正实现架构层面的瘦身。

---

## 最终设计

### 1. 模块边界

`storage` 主模块只保留底座职责：

- schema 驱动的 key/value 类型约束
- prefix 命名空间
- 序列化与反序列化
- sync/async 基础 CRUD
- `getKeys`
- `getStorageInfo`
- 可选缓存
- 平台适配器实现

以下能力从核心层移除，不再作为 `WebSessionStorage` 的实例方法存在：

- `syncToLocalStorage`
- `restoreFromLocalStorage`
- `autoSaveForm`
- `createSnapshot`
- `restoreSnapshot`
- `cleanExpiredSnapshots`

这些能力改为扩展 helper，并继续从主包统一导出，但在文档和导出组织上明确标记为 `Storage Extras`。

### 2. 文件组织

建议将当前单文件实现拆分为以下结构：

```text
src/modules/storage/
  types.ts
  base.ts
  adapters/
    web-local.ts
    web-session.ts
    taro.ts
    uni.ts
  index.ts

src/modules/storage-extras/
  session-sync.ts
  session-snapshot.ts
  form-autosave.ts
  index.ts
```

[`src/modules/storage.ts`](c:/home/Projects/frontend/jsutils/src/modules/storage.ts) 可转为兼容入口或 barrel，但不再承载全部实现细节。最终对外仍由 [`src/index.ts`](c:/home/Projects/frontend/jsutils/src/index.ts) 统一导出。

### 3. 类型系统升级

当前泛型形态主要是 `T extends string`，只能约束 key。重构后改为 schema 映射：

```ts
type StorageSchema = Record<string, unknown>
```

以 `Schema` 为泛型后：

- `setStorageSync('user', value)` 的 `value` 类型应为 `Schema['user']`
- `getStorageSync('user')` 的返回值应为 `Schema['user'] | null`
- async 版本 `getStorage('user')` 返回 `Promise<Schema['user'] | null>`

示例：

```ts
type AppStorageSchema = {
  user: { id: number; name: string }
  token: string
  theme: 'light' | 'dark'
}

const storage = new WebLocalStorage<AppStorageSchema>()
```

这使 storage 真正具备“key 与 value 成对收敛”的类型价值，而不只是 key 联合类型提示。

### 4. sync / async API 策略

异步方法本轮保留，不删减。

原因：

- 当前多个平台已经共享同一套 API 形态。
- 未来真正异步的存储实现需要稳定扩展点。
- 业务层可以统一按 async 调用，不必知道底层实现是否同步。

设计原则：

- sync 方法仍然是当前同步存储实现的核心。
- async 方法作为正式公共 API 保留。
- 对于同步底层，async 方法应尽量在基类提供默认桥接实现，减少各平台适配器重复样板代码。
- 如果未来接入“仅异步、无同步”的底层实现，应以新的异步适配器或新类承载，而不是破坏现有同步类语义。

### 5. 抽象层改为 `StorageLike`

当前抽象层直接依赖浏览器 DOM 的 `Storage` 类型，例如带前缀清理逻辑直接接收 `Storage`。

重构后，核心层改为依赖项目内最小抽象接口：

```ts
interface StorageLike {
  length: number
  key(index: number): string | null
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}
```

这样：

- Web 可直接复用 `localStorage` / `sessionStorage`
- mock 与测试实现可以直接复用同一抽象
- 非 DOM 平台的适配边界更清晰
- 核心层的语义变成“键值存储底座”，而不是“浏览器 storage 工具”

### 6. 错误处理与日志策略

核心原则：**底座层不直接 `console.warn` / `console.error`，只返回明确结果或抛出明确错误。**

#### 核心层行为

- key 不存在：返回 `null`
- 读取到非法 JSON：返回 `null`
- 读取到 `'undefined'`：返回 `null`
- 写入失败（例如 quota 超限、序列化失败、底层不可用）：抛错

必要时可引入稳定错误码，例如：

- `QUOTA_EXCEEDED`
- `STORAGE_UNAVAILABLE`
- `SERIALIZE_FAILED`

这样日志、埋点、提示语都由业务层控制，而不是由库层擅自输出。

#### 扩展层行为

扩展 helper 同样不直接打日志。

对于环境不满足或输入不合法的情况，采用以下策略之一：

- 抛出结构化错误
- 返回结构化结果，如 `{ ok: false, code: 'FORM_NOT_FOUND' }`

本轮推荐：

- 核心层优先“返回约定值 / 抛错”
- 扩展层优先“返回结构化结果或抛错”

但两者都不直接输出 `console`

### 7. `StorageInfo` 收敛

`StorageInfo` 应只保留稳定、可测试、跨平台可理解的信息，不暴露内部缓存细节对象。

建议保留：

- `keys`
- `currentSize`
- `limitSize`

如需暴露缓存信息，优先考虑摘要字段，例如：

- `cacheSize`

不再保留 `cacheInfo?: any` 这类不稳定、不可移植的结构。

### 8. 扩展导出策略

虽然内部结构拆分为核心层与扩展层，但对外仍保持主包统一导出。

导出分组建议为：

- `Core Storage`
- `Storage Extras`

命名上通过 helper 名称显式体现扩展属性，例如：

- `createSessionSnapshot`
- `restoreSessionSnapshot`
- `bindFormAutoSave`
- `syncSessionToLocalStorage`

这样既不要求用户改为二级入口，也不会再让 `WebSessionStorage` 本身看起来像“内建场景工具箱”。

---

## 迁移策略

### API 迁移

以下实例方法从 `WebSessionStorage` 移除：

- `syncToLocalStorage`
- `restoreFromLocalStorage`
- `autoSaveForm`
- `createSnapshot`
- `restoreSnapshot`
- `cleanExpiredSnapshots`

对应能力迁移为独立 helper。

迁移前：

```ts
const storage = new WebSessionStorage()
storage.createSnapshot('page', state)
```

迁移后：

```ts
const storage = new WebSessionStorage<AppSchema>()
createSessionSnapshot(storage, 'page', state)
```

### 文档迁移

- `storage` 示例文档只保留核心能力说明
- 快照、表单自动保存、session/local 同步示例移到扩展文档
- README 与 Typedoc 按核心层/扩展层分节描述

### 测试迁移

测试分三层：

1. 核心层测试
   - schema 类型映射
   - prefix 行为
   - cache 行为
   - sync/async 一致性
   - 错误处理语义
2. 平台适配层测试
   - Web / Taro / Uni 适配器行为
3. 扩展层测试
   - 表单自动保存
   - 快照
   - session/local 同步

并补充类型测试，重点验证 `Schema[key]` 的推导行为。

---

## 风险与控制

### 风险 1：breaking change 影响已有用户

控制方式：

- 在 changelog 中明确标注移除的实例方法与替代 helper。
- 在迁移文档中给出“旧 API -> 新 helper”对照表。

### 风险 2：保留 async API 但当前底层仍是同步实现，用户误判性能特征

控制方式：

- 文档中明确说明 async API 主要用于统一平台调用与未来扩展，并不代表当前实现一定异步。
- 避免在文档里暗示 Web local/session storage 具备真实异步语义。

### 风险 3：schema 类型升级后，旧的 `T extends string` 用户需要迁移

控制方式：

- 提供迁移示例，说明如何从 key 联合类型迁移到 schema。
- 如需要，可评估是否提供短期辅助类型帮助迁移，但不作为长期主形态。

### 风险 4：把高级能力外置后，导出过多导致主包认知仍不清晰

控制方式：

- 在 README、Typedoc、示例和对外命名中明确划分 `Core Storage` 与 `Storage Extras`。
- 核心类保持最小职责，不再回流扩展能力。

---

## 成功标准

满足以下条件即可视为本轮设计达成：

1. `storage` 主模块不再包含 DOM 场景能力、快照、表单自动保存、session/local 同步等扩展逻辑。
2. 核心层保留 sync/async 双 API，且多平台调用方式一致。
3. 泛型从 key 联合类型升级为 schema 映射，能够同时约束 key 和 value。
4. 抽象层不再直接依赖浏览器 `Storage` 类型，而是依赖项目内的 `StorageLike`。
5. 核心层不再直接输出 `console.warn` / `console.error`。
6. 主包仍统一导出，但文档和命名能够让用户明确区分核心层与扩展层。
