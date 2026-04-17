# 状态机模块设计

**日期：** 2026-04-17  
**状态：** 已确认  
**主题：** 为 `jsutils` 增加轻量状态机模块、模块级 README 与示例文档

---

## 背景

当前仓库已经覆盖了集合、对象、字符串、函数控制、日志、存储、DOM
辅助等通用能力，但还缺少一类“流程约束型”工具：

1. 用一组有限状态表达业务流程，而不是散落在各处的 `if/else`。
2. 在状态跳转前执行 guard，避免非法操作进入错误阶段。
3. 在状态切换时执行轻量副作用，保持流程行为和业务代码对齐。
4. 能方便接入前端组件或 store，但不依赖特定框架。

这类能力在前端里很常见，例如：

1. `idle -> loading -> success / error` 的请求流。
2. `closed -> opening -> open -> closing` 的弹窗流。
3. `step1 -> step2 -> confirm -> done` 的多步骤流程。

同时，用户已明确两项设计约束：

1. 首版优先做“带同步副作用钩子”的轻量状态机，不做重型工作流框架。
2. 模块需要单独目录，并提供模块级 `README.md` 与若干示例文档。

---

## 目标

1. 提供一个与现有 `createXxx` 风格一致的 `createMachine(config)` API。
2. 支持状态跳转、上下文更新、guard 校验、`onEnter` / `onExit`
   同步副作用。
3. 让模块既能用于组件内局部流程，也能作为前端状态管理的流程引擎。
4. 通过独立目录、模块 README 和 examples 降低理解成本。
5. 为后续扩展 async effect 或更高级流程能力预留空间，但不在首版实现。

## 非目标

1. 本轮不实现并行状态、嵌套状态、历史状态恢复。
2. 本轮不实现异步任务取消、延迟事件、事件队列调度。
3. 本轮不把状态机做成完整状态管理框架，也不直接耦合 React/Vue。
4. 本轮不引入可视化 DSL、图编辑器或框架专属 hooks。

---

## 方案对比

### 方案 1：实例式状态机（采用）

形态为 `createMachine(config)`，对外返回一个 machine 实例，使用者通过
`machine.send(event)`、`machine.getSnapshot()`、`machine.subscribe()`
等方法操作。

优点：

1. 与仓库现有 `createPolling`、`createLogger` 等创建实例再调用的方法风格一致。
2. 对业务使用者友好，适合直接接入组件和 store。
3. 能较自然地容纳订阅、快照和副作用钩子。

缺点：

1. 实现层需要额外处理内部状态提交、订阅通知和副作用顺序。

### 方案 2：纯函数式状态转移内核

形态为 `transition(machineConfig, snapshot, event)`，只负责根据输入计算下一步。

优点：

1. 纯函数可测试性极高。
2. 没有内部可变状态，概念非常干净。

缺点：

1. 业务方需要自己管理当前快照、订阅与副作用，开箱体验较弱。
2. 更像底层算法，不像可直接使用的 util。

### 方案 3：状态机 + actor/effect runner

在方案 1 基础上进一步内建异步任务、取消、并发策略和事件队列。

优点：

1. 能覆盖更复杂的流程编排场景。

缺点：

1. 超出当前仓库“轻量、可组合”的定位。
2. 很容易演变为小型框架，增加学习成本和维护负担。

**最终选择：** 采用方案 1，对外提供实例式 API；内部借鉴方案 2，
使用纯函数内核负责状态转移计算。

---

## 最终设计

### 1. 模块定位

该模块定位为“轻量状态机 + 同步副作用钩子”。

它负责：

1. 描述有限状态及状态间的合法事件。
2. 在事件触发前执行 guard 校验。
3. 在状态切换时更新 context。
4. 在进入或离开状态时执行同步副作用。
5. 对外提供稳定快照与订阅能力。

它不负责：

1. 充当前端全局状态仓库。
2. 管理服务端缓存、表单字段全集或任意业务数据聚合。
3. 调度复杂异步任务生命周期。

换句话说，状态机是“流程约束层”，不是“状态存储层”。

### 2. 目录组织

首版模块目录建议如下：

```txt
src/modules/stateMachine/
  index.ts
  createMachine.ts
  transition.ts
  types.ts
  README.md
```

各文件职责如下：

1. `index.ts`
   作为统一出口，对外导出 `createMachine`、必要类型及少量辅助函数。
2. `createMachine.ts`
   负责实例层能力，包括 `send`、`subscribe`、`can`、`matches`、
   `getState`、`getContext`、`getSnapshot`。
3. `transition.ts`
   负责纯函数状态转移计算，不保存内部状态。
4. `types.ts`
   放置状态、事件、上下文、配置、快照、listener 等类型定义。
5. `README.md`
   贴近代码维护模块文档，降低后续文档漂移风险。

### 3. 首版公开 API

首版公开 API 收口为以下能力：

1. `createMachine(config)`
2. `machine.getState()`
3. `machine.getContext()`
4. `machine.getSnapshot()`
5. `machine.send(event)`
6. `machine.can(event)`
7. `machine.matches(state)`
8. `machine.subscribe(listener)`

首版配置项收口为：

1. `initial`
2. `context`
3. `states`
4. `states[state].on`
5. `states[state].onEnter`
6. `states[state].onExit`
7. `transition.target`
8. `transition.guard`
9. `transition.reduce`

首版暂不开放：

1. 全局级 `onTransition`
2. 并行状态
3. 嵌套状态
4. entry/exit 异步取消
5. 延迟事件
6. 内建事件队列
7. 通配事件 `*`
8. 历史状态恢复

### 4. 推荐 API 形态

推荐的使用形态如下：

```ts
const machine = createMachine({
  initial: 'idle',
  context: { retryCount: 0 },
  states: {
    idle: {
      on: {
        START: { target: 'loading' },
      },
    },
    loading: {
      onEnter: ({ context }) => {
        console.log('enter loading', context)
      },
      on: {
        RESOLVE: { target: 'success' },
        REJECT: {
          target: 'error',
          guard: ({ event }) => !!event.payload,
        },
      },
    },
    success: {},
    error: {
      on: {
        RETRY: {
          target: 'loading',
          reduce: ({ context }) => ({
            ...context,
            retryCount: context.retryCount + 1,
          }),
        },
      },
    },
  },
})
```

这类 API 同时满足三件事：

1. 配置层表达状态图，阅读成本低。
2. 实例层以 `send(event)` 驱动流程，调用侧自然。
3. 未来即使增加更多能力，也能保持外层 API 基本稳定。

### 5. 运行语义与执行顺序

`send(event)` 的执行顺序需要在首版明确固定，避免歧义。推荐顺序如下：

1. 读取当前 `state` 和 `context`。
2. 查找当前状态下是否定义了该 `event` 的 transition。
3. 若未定义 transition，则直接结束，本次事件不产生变更。
4. 若存在 `guard`，先基于当前快照执行 `guard`。
5. 若 `guard` 返回 `false`，则中止，不更新状态、不触发副作用。
6. 若存在 `reduce`，基于当前快照和事件计算新的 `context`。
7. 当目标状态与当前状态不同，先执行当前状态的 `onExit`。
8. 提交新的 `state` 与 `context` 快照。
9. 当目标状态与当前状态不同，再执行目标状态的 `onEnter`。
10. 最后通知所有 `subscribe` 监听者。

以上顺序的设计目的如下：

1. `guard` 始终基于旧快照判断，语义稳定。
2. `reduce` 先于 `onEnter`，使进入钩子拿到最新上下文。
3. `subscribe` 永远拿到已提交后的稳定快照。
4. `onExit` / `onEnter` 只在真正发生状态变化时触发，避免噪音。

附加约束如下：

1. `guard` 应视为纯函数，不建议做副作用。
2. `reduce` 应视为纯函数，只负责计算新的上下文。
3. `onEnter` / `onExit` 是推荐承载同步副作用的位置。
4. 首版仅保证同步执行语义，不在模块内部调度异步流程。

### 6. 与前端状态管理的结合方式

该模块设计为“无框架核心”，既可用于组件内局部流程，也可嵌入 store。

推荐的结合方式有三类：

#### 组件内局部状态

适用于弹窗、步骤流、播放器控制、局部请求流程。

做法：

1. 在组件内部持有 machine 实例。
2. 通过 `subscribe` 把快照同步到 React/Vue 的响应式系统。
3. 视图通过 `matches(state)` 或快照直接分支渲染。

#### 嵌入全局 store

适用于登录流程、上传流程、订单提交流程等会被多个组件共享的状态。

做法：

1. 将 machine 作为 store action 层或 service 层的一部分。
2. 在 action 中调用 `machine.send(event)`。
3. 再把新的 snapshot 同步回 Zustand / Pinia / Redux store。

#### 只让 store 保存 snapshot

适用于强调可序列化、可调试和持久化的场景。

做法：

1. 状态机负责“计算下一步”。
2. store 只保存 `{ state, context }` 这样的 snapshot。
3. 每次 action 先交给状态机处理，再把结果写回 store。

明确边界：

1. 状态机不替代 Redux/Zustand/Pinia。
2. store 负责数据存储与订阅；状态机负责流程合法性与阶段切换。
3. 不建议把整个业务 store 全量塞进 machine context。

### 7. README 与示例文档

模块级 `README.md` 应至少包含以下内容：

1. 模块定位：说明它是轻量状态机，而不是完整状态管理框架。
2. 快速开始：给出最小可运行示例。
3. 核心概念：解释 `state`、`event`、`context`、`guard`、`reduce`、
   `onEnter`、`onExit`。
4. 实例 API：说明 `getState`、`getContext`、`getSnapshot`、`send`、
   `can`、`matches`、`subscribe` 的职责。
5. 与前端结合：说明如何配合 React/Vue 组件及各类 store。
6. 设计边界：明确首版不支持的能力，避免误用。
7. 扩展方向：说明未来若补 async effect 或事件队列，应如何保持兼容。

为了帮助用户快速理解，首版至少提供以下示例文档：

```txt
src/modules/stateMachine/examples/
  state-machine-basic-example.md
  state-machine-dialog-example.md
  state-machine-wizard-example.md
```

各示例职责如下：

1. `state-machine-basic-example.md`
   用 `idle -> loading -> success / error` 演示基础请求流。
2. `state-machine-dialog-example.md`
   用 `closed -> opening -> open -> closing` 演示 UI 过程控制和 `can(event)`。
3. `state-machine-wizard-example.md`
   用多步骤流程演示带 context 的校验、回退与条件跳转。

示例文档要求：

1. 示例代码必须与最终公开 API 一致，避免文档与实现脱节。
2. 示例优先保持框架无关，用伪组件或通用函数说明接入方式。
3. 若需要说明前端框架接法，应放在 README 的“结合方式”小节中，
   而不是把 examples 绑死到某一框架。

### 8. 测试设计

运行时测试建议单独收口到 `test/stateMachine/` 目录，方便后续继续补充
状态流、边界条件与副作用顺序用例。

建议目录如下：

```txt
test/stateMachine/
  createMachine.test.ts
  transition.test.ts
```

类型测试仍保持仓库既有约定，放在：

```txt
test/types/stateMachine.test-d.ts
```

#### 运行时测试覆盖点

1. 初始化状态与上下文是否正确。
2. 未定义事件时是否保持原快照不变。
3. `guard = false` 时是否不跳转、不触发副作用。
4. `reduce` 是否正确产出新上下文。
5. `onExit -> state commit -> onEnter -> subscribe` 顺序是否正确。
6. 自循环或目标状态与当前状态相同时，是否按既定规则处理钩子。
7. `can(event)` 的结果是否与真实 `send(event)` 行为保持一致。
8. `subscribe` 是否能收到最新 snapshot，且取消订阅后不再触发。

#### 类型测试覆盖点

1. `initial` 必须是已定义状态。
2. `target` 必须指向存在的状态。
3. `matches(state)` 只能接收合法状态。
4. `send(event)` 的事件类型应能从配置中推导。
5. `context` 与 `reduce` 的输入输出类型应保持一致。

### 9. 风险与控制

#### 风险 1：首版范围失控，快速滑向小型框架

控制方式：

1. 明确收口为同步状态机。
2. 暂不引入 async effect、事件队列和嵌套状态。
3. 先用真实使用反馈决定后续能力，而不是预支复杂度。

#### 风险 2：状态机与 store 职责混淆

控制方式：

1. 在 README 中明确“流程约束层”定位。
2. 提供与 store 结合示例，但不让状态机承担 store 职责。

#### 风险 3：文档与实现漂移

控制方式：

1. 模块 README 与代码放在同一目录，降低维护距离。
2. examples 使用真实 API 书写，不保留设计稿式伪接口。

#### 风险 4：副作用顺序不稳定导致使用者误判行为

控制方式：

1. 在设计中明确执行顺序。
2. 在测试中针对顺序写显式断言。

---

## 成功标准

满足以下条件即可视为首版设计达成：

1. 能清晰表达有限状态流，并通过 `send(event)` 驱动跳转。
2. 能在跳转前执行 `guard`，阻止非法状态变化。
3. 能在跳转时通过 `reduce` 更新上下文。
4. 能在状态切换时通过 `onEnter` / `onExit` 执行同步副作用。
5. 能通过 `subscribe` 与前端组件或 store 顺畅结合。
6. 模块拥有独立目录、模块级 README 和至少三份 examples。
7. 运行时测试位于 `test/stateMachine/`，类型测试保持现有仓库约定。
8. 类型提示足够可靠，避免出现明显非法的状态和事件组合。
