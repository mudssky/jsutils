# 状态机 XState 风格对齐设计

**日期：** 2026-04-17  
**状态：** 已确认  
**主题：** 在保持轻量同步核心的前提下，让 `stateMachine` 的配置词汇和快照形态更接近 XState

---

## 背景

当前仓库已经有一版可用的轻量状态机模块，具备以下特点：

1. `transition.ts` 负责纯同步状态转移计算。
2. `createMachine.ts` 直接返回可运行实例，而不是 machine definition。
3. 配置项使用 `onEnter` / `onExit` / `reduce` 等命名。
4. 快照字段使用 `{ state, context }`。

这版实现对于当前需求已经足够轻量，但与 XState 的主流词汇体系存在明显差异：

1. XState 常用 `entry` / `exit`，而不是 `onEnter` / `onExit`。
2. XState 常用 `assign` 表达上下文更新。
3. XState snapshot 更强调 `value` / `context`。

用户希望后续复杂需求若要迁移到 XState，当前 API 能尽量减少心智差异与重写成本。
同时，用户明确给出两项约束：

1. 保持简单，不引入 actor 模型、异步编排、生命周期扩展。
2. 不需要兼容旧命名，可以直接改名。

---

## 目标

1. 让状态机配置词汇更接近当前 XState 心智模型。
2. 保持 `transition` + `createMachine` 的轻量同步核心不变。
3. 让未来迁移到 XState 时，配置和 snapshot 结构更容易映射。
4. 保持当前模块的可读性、可测试性和低复杂度。

## 非目标

1. 本轮不引入 `createActor(machine)` / `start()` 运行时模型。
2. 本轮不引入 `invoke`、异步 effect、取消、竞态控制。
3. 本轮不引入 `actions` 数组、`assign(...)` helper 工具函数或 actor 系统。
4. 本轮不保留 `state` / `onEnter` / `onExit` / `reduce` 的兼容别名。

---

## 方案对比

### 方案 1：仅保留当前命名

保持 `state`、`onEnter`、`onExit`、`reduce` 不变，只在 README 中说明与 XState
的差异。

优点：

1. 实现成本最低。
2. 不需要改动现有测试和示例。

缺点：

1. 迁移到 XState 时仍然要整体替换词汇。
2. 长期会形成“长得像状态机，但心智不太像 XState”的落差。

### 方案 2：词汇与快照形态对齐（采用）

保持轻量同步核心，但直接把对外词汇切换为更接近 XState 的命名。

具体包括：

1. `state` 改为 `value`
2. `onEnter` / `onExit` 改为 `entry` / `exit`
3. `reduce` 改为 `assign`
4. `getState()` 改为 `getValue()`

优点：

1. 能显著降低迁移时的词汇摩擦。
2. 不需要引入 actor 模型，也不会明显增加运行时复杂度。
3. 保持现有轻量实现和测试结构。

缺点：

1. 需要一次性更新实现、测试、README 和 examples。
2. `assign` 如果只改名不改语义，会出现“看着像 XState，实际不像”的问题。

### 方案 3：深度运行时对齐

进一步引入 `createActor(machine)`、`start()`、更完整的 snapshot 语义。

优点：

1. 与 XState 的迁移路径最接近。

缺点：

1. 复杂度明显提高。
2. 会让当前模块从轻量状态机走向小型状态编排器。
3. 超出用户当前“保持简单”的约束。

**最终选择：** 采用方案 2，优先对齐配置词汇和快照形态，不对齐 actor
运行时模型。

---

## 最终设计

### 1. 总体原则

这一轮调整遵循 3 条原则：

1. **核心行为不变**
   `transition` 仍然是纯同步计算；`createMachine` 仍然直接返回可运行实例。
2. **优先对齐词汇和数据形态**
   先解决配置和快照的迁移成本，不急于对齐 actor 生命周期。
3. **直接切换，不做兼容层**
   旧命名不保留别名，统一使用新词汇，减少 API 长期混搭。

### 2. 对外 API 命名变更

本轮直接进行以下重命名：

#### 配置层

1. `onEnter` -> `entry`
2. `onExit` -> `exit`
3. `reduce` -> `assign`

#### 快照与参数层

1. `MachineSnapshot.state` -> `value`
2. `MachineTransitionArgs.state` -> `value`
3. `MachineHookArgs.state` -> `value`

#### 实例方法层

1. `getState()` -> `getValue()`

不变项：

1. `createMachine(...)`
2. `getContext()`
3. `getSnapshot()`
4. `send(event)`
5. `can(event)`
6. `matches(value)`
7. `subscribe(listener)`

### 3. 新的 snapshot 形态

旧形态：

```ts
{
  state: 'loading',
  context: { ... }
}
```

新形态：

```ts
{
  value: 'loading',
  context: { ... }
}
```

设计决策如下：

1. 只保留 `value`，不再保留 `state` 兼容字段。
2. `getSnapshot()` 返回值统一使用 `{ value, context }`。
3. hook 参数和 transition 参数也统一使用 `value` 字段。

这样做的原因是：

1. 与 XState 当前 snapshot 心智更接近。
2. 避免 `{ state, value }` 双字段并存带来的长期歧义。

### 4. `assign` 的语义

`reduce` 如果只是机械重命名为 `assign`，但仍要求返回完整 `context`，会形成
“词汇对齐、语义没对齐”的问题。因此本轮建议同时做轻量语义调整。

#### 新语义

`assign` 只负责返回“要更新的上下文字段对象”，内部统一做浅合并：

```ts
const assignedContext = transitionConfig.assign
  ? transitionConfig.assign(args)
  : {}

const nextContext = {
  ...snapshot.context,
  ...assignedContext,
}
```

因此允许写法如下：

```ts
assign: ({ context, event }) => ({
  retryCount: context.retryCount + 1,
  message: event.payload ?? null,
})
```

#### 边界约束

本轮只支持：

1. `assign: (args) => Partial<TContext> | TContext`

本轮不支持：

1. 对嵌套对象做深层 patch
2. `assign({ field: ({ context }) => ... })` 这种对象式 assigner
3. 多段 action 组合

这样可以让语义更接近 XState，同时保持实现简单。

### 5. 运行时执行顺序

虽然词汇变化较大，但运行时顺序保持不变：

1. 调用 `transition(config, snapshot, event)` 计算下一步。
2. 若状态值发生变化，先执行旧状态的 `exit`。
3. 提交新的 snapshot。
4. 若状态值发生变化，再执行新状态的 `entry`。
5. 最后通知订阅者。

注意点：

1. `guard` 仍然同步执行。
2. `assign` 仍然同步执行。
3. `entry` / `exit` 仍然同步执行，不做 `await`。
4. 订阅者始终拿到已提交后的稳定 snapshot。

### 6. 文件改动范围

本轮改动主要集中在以下文件：

```txt
src/modules/stateMachine/
  types.ts
  transition.ts
  createMachine.ts
  index.ts
  README.md
  examples/
    state-machine-basic-example.md
    state-machine-dialog-example.md
    state-machine-wizard-example.md

test/stateMachine/
  transition.test.ts
  createMachine.test.ts

test/types/
  stateMachine.test-d.ts
```

各文件改动重点如下：

1. `types.ts`
   - 替换核心类型字段和配置命名
   - 调整 `assign` 返回类型为 `Partial<TContext> | TContext`
2. `transition.ts`
   - 把 `state` 读取改为 `value`
   - 把 `reduce` 调用改为 `assign`
   - 引入浅合并逻辑
3. `createMachine.ts`
   - `getState()` 改为 `getValue()`
   - hook 字段切换为 `entry` / `exit`
   - 内部快照访问切换为 `value`
4. `index.ts`
   - 导出更新后的类型和方法名
5. README / examples
   - 全量替换为新词汇，避免旧新混用

### 7. 测试设计

#### 运行时测试

需要同步更新现有测试命名，并补一条新的关键测试：

1. 初始化快照使用 `{ value, context }`
2. `entry` / `exit` 的执行顺序仍然正确
3. `getValue()` 返回当前值
4. `assign` 返回 partial context 时，会与旧 context 浅合并
5. `guard = false` 时不触发副作用，不更新 snapshot

重点新增断言示例：

```ts
expect(nextSnapshot).toEqual({
  value: 'success',
  context: {
    retryCount: 0,
    message: 'done',
  },
})
```

以及：

```ts
assign: () => ({
  message: 'done',
})
```

执行后必须保留旧的 `retryCount`。

#### 类型测试

需要覆盖：

1. `getValue()` 返回合法状态值类型
2. `matches(value)` 只接受合法值
3. `assign` 返回 `Partial<TContext>` 可以通过
4. 非法 `target` 仍然报错
5. `snapshot.value` 类型正确

### 8. README 与示例文档

README 和 examples 的目标是让使用者看到的第一眼 API 就更像 XState 风格。

需要统一替换：

1. `state` -> `value`
2. `onEnter` / `onExit` -> `entry` / `exit`
3. `reduce` -> `assign`
4. `getState()` -> `getValue()`

文档中还应补一句明确说明：

> 当前模块采用更接近 XState 的配置词汇与 snapshot 形态，但仍保持轻量同步
> 核心，并未引入 actor 运行时模型。

### 9. 与异步的关系

本轮不改变异步边界。

当前状态机仍然：

1. 支持外部异步完成后手动 `send(event)`
2. 不内建 `invoke`
3. 不处理取消与竞态
4. 不 `await` `entry` / `exit`

也就是说，本轮重点是“迁移友好命名”，不是“异步能力升级”。

### 10. 风险与控制

#### 风险 1：语义更像 XState，但仍有人误以为支持 actor 模型

控制方式：

1. README 中明确写出“只对齐词汇，不对齐 actor 运行时”。
2. 不引入 `createActor`、`start()` 等名字。

#### 风险 2：`assign` 改为浅合并后，使用者误以为支持深层 patch

控制方式：

1. README 中明确强调“仅浅合并”。
2. 示例避免展示嵌套对象 patch。

#### 风险 3：一次性重命名过多，导致测试和文档遗漏

控制方式：

1. 运行时测试、类型测试、README、examples 一并更新。
2. 在最终验证中通过 `pnpm qa` 覆盖类型检查、lint 和测试。

---

## 成功标准

满足以下条件即可视为本轮设计达成：

1. `stateMachine` 模块的核心词汇完成切换：
   `value`、`entry`、`exit`、`assign`、`getValue()`
2. 不保留旧命名兼容字段或兼容方法。
3. `assign` 支持返回 `Partial<TContext>`，并按浅合并更新 context。
4. 运行时顺序与轻量同步核心保持不变。
5. README、examples、运行时测试、类型测试全部与新命名保持一致。
6. 用户阅读 API 时能明显感受到更接近 XState，但不会误以为已经实现
   actor 运行时模型。
