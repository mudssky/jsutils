# State Machine 多步骤流程示例

```ts
import { createMachine } from '@mudssky/jsutils'

type State = 'step1' | 'step2' | 'confirm' | 'done'
type Context = {
  name: string
  email: string
}
type Event =
  | { type: 'NEXT_FROM_STEP1'; payload: { name: string } }
  | { type: 'NEXT_FROM_STEP2'; payload: { email: string } }
  | { type: 'BACK' }
  | { type: 'SUBMIT' }

const wizardMachine = createMachine<State, Context, Event>({
  initial: 'step1',
  context: {
    name: '',
    email: '',
  },
  states: {
    step1: {
      on: {
        NEXT_FROM_STEP1: {
          target: 'step2',
          guard: ({ event }) => event.payload.name.trim().length > 0,
          assign: ({ event }) => ({
            name: event.payload.name,
          }),
        },
      },
    },
    step2: {
      on: {
        NEXT_FROM_STEP2: {
          target: 'confirm',
          guard: ({ event }) => event.payload.email.includes('@'),
          assign: ({ event }) => ({
            email: event.payload.email,
          }),
        },
        BACK: { target: 'step1' },
      },
    },
    confirm: {
      on: {
        BACK: { target: 'step2' },
        SUBMIT: { target: 'done' },
      },
    },
    done: {},
  },
})

wizardMachine.send({
  type: 'NEXT_FROM_STEP1',
  payload: { name: 'mudssky' },
})
wizardMachine.send({
  type: 'NEXT_FROM_STEP2',
  payload: { email: 'mudssky@example.com' },
})
wizardMachine.send({ type: 'SUBMIT' })
console.log(wizardMachine.getSnapshot().value)
console.log(wizardMachine.getSnapshot().context)
```

这个例子适合把多步骤校验、回退和最终确认放到同一个状态图里，避免把步骤流
散落在多个组件条件判断中。
