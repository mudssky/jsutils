# State Machine 基础请求流示例

```ts
import { createMachine } from '@mudssky/jsutils'

type State = 'idle' | 'loading' | 'success' | 'error'
type Context = {
  retryCount: number
  message: string | null
}
type Event =
  | { type: 'START' }
  | { type: 'RESOLVE' }
  | { type: 'REJECT'; payload?: string }
  | { type: 'RETRY' }

const requestMachine = createMachine<State, Context, Event>({
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
        RESOLVE: {
          target: 'success',
          assign: () => ({
            message: 'done',
          }),
        },
        REJECT: {
          target: 'error',
          guard: ({ event }) => Boolean(event.payload),
          assign: ({ context, event }) => ({
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
          assign: () => ({
            message: null,
          }),
        },
      },
    },
  },
})

requestMachine.send({ type: 'START' })
requestMachine.send({ type: 'REJECT', payload: 'network error' })
console.log(requestMachine.getSnapshot())
```

这个例子适合表达最常见的请求阶段流转，同时演示：

- `guard` 如何阻止无效失败事件
- `assign` 如何同步更新重试计数和错误消息
- `getSnapshot()` 如何统一拿到最终状态和上下文
