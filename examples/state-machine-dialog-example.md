# State Machine 对话框流程示例

```ts
import { createMachine } from '@mudssky/jsutils'

type State = 'closed' | 'opening' | 'open' | 'closing'
type Context = {
  lastReason: string | null
}
type Event =
  | { type: 'OPEN' }
  | { type: 'OPENED' }
  | { type: 'CLOSE'; payload?: string }
  | { type: 'CLOSED' }

const dialogMachine = createMachine<State, Context, Event>({
  initial: 'closed',
  context: {
    lastReason: null,
  },
  states: {
    closed: {
      on: {
        OPEN: { target: 'opening' },
      },
    },
    opening: {
      on: {
        OPENED: { target: 'open' },
      },
    },
    open: {
      on: {
        CLOSE: {
          target: 'closing',
          reduce: ({ context, event }) => ({
            ...context,
            lastReason: event.payload ?? 'manual close',
          }),
        },
      },
    },
    closing: {
      on: {
        CLOSED: { target: 'closed' },
      },
    },
  },
})

if (dialogMachine.can({ type: 'OPEN' })) {
  dialogMachine.send({ type: 'OPEN' })
}
```

这个例子更偏 UI 场景，适合把按钮是否可点、当前动画阶段、关闭原因等逻辑
集中放在一个流程模型里。
