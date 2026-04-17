# State Machine

## 模块定位

`stateMachine` 是一个轻量的流程约束工具，适合在前端中表达有限状态流，
但它不是完整状态管理框架，也不直接依赖 React 或 Vue。

它适合这类场景：

- 请求流程：`idle -> loading -> success / error`
- UI 流程：`closed -> opening -> open -> closing`
- 多步骤流程：`step1 -> step2 -> confirm -> done`

## 快速开始

```ts
import { createMachine } from '@mudssky/jsutils'

type RequestState = 'idle' | 'loading' | 'success' | 'error'
type RequestContext = {
  retryCount: number
  message: string | null
}
type RequestEvent =
  | { type: 'START' }
  | { type: 'RESOLVE' }
  | { type: 'REJECT'; payload?: string }
  | { type: 'RETRY' }

const machine = createMachine<RequestState, RequestContext, RequestEvent>({
  initial: 'idle',
  context: {
    retryCount: 0,
    message: null,
  },
  states: {
    idle: {
      on: {
        START: { target: 'loading' },
      },
    },
    loading: {
      on: {
        RESOLVE: { target: 'success' },
        REJECT: {
          target: 'error',
          guard: ({ event }) => Boolean(event.payload),
          reduce: ({ context, event }) => ({
            ...context,
            retryCount: context.retryCount + 1,
            message: event.payload ?? null,
          }),
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
            message: null,
          }),
        },
      },
    },
  },
})

machine.send({ type: 'START' })
machine.send({ type: 'RESOLVE' })
console.log(machine.getSnapshot())
```

## 核心概念

- `state`：当前流程阶段。
- `event`：触发状态变化的事件对象，至少包含 `type`。
- `context`：和流程紧密相关的小块业务数据。
- `guard`：跳转前的同步校验，返回 `false` 时阻止状态变化。
- `reduce`：跳转时计算新的 `context`。
- `onEnter` / `onExit`：真正发生状态切换时执行的同步副作用。

## 实例 API

- `getState()`：获取当前状态。
- `getContext()`：获取当前上下文。
- `getSnapshot()`：一次性获取 `{ state, context }`。
- `send(event)`：发送事件并返回提交后的快照。
- `can(event)`：判断当前状态下该事件是否可进入有效转移。
- `matches(state)`：判断当前是否处于指定状态。
- `subscribe(listener)`：订阅快照变更，返回取消订阅函数。

## 与前端状态管理结合

- 组件内局部流程：用 `subscribe()` 把 snapshot 同步到组件状态。
- 全局 store：在 action 中调用 `send(event)`，再把 snapshot 写回 store。
- 可序列化 store：只在 store 中保存 `{ state, context }`，让状态机负责流转规则。

不建议把整个业务 store 都放进 machine context。状态机更适合做“流程约束层”，
而不是“状态存储层”。

## 设计边界

当前版本刻意保持轻量，不包含这些能力：

- 并行状态
- 嵌套状态
- 历史状态恢复
- 延迟事件
- 内建事件队列
- 异步 effect 取消

## 示例

- [基础请求流](../../../examples/state-machine-basic-example.md)
- [对话框流程](../../../examples/state-machine-dialog-example.md)
- [多步骤流程](../../../examples/state-machine-wizard-example.md)
