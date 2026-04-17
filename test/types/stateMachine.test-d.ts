/* eslint-disable @typescript-eslint/no-unused-vars */
import type { MachineConfig, MachineSnapshot } from '@mudssky/jsutils'
import { createMachine } from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

type State = 'idle' | 'loading' | 'success'
type Context = {
  count: number
}
type Event = { type: 'START' } | { type: 'RESOLVE'; payload: number }

const config: MachineConfig<State, Context, Event> = {
  initial: 'idle',
  context: {
    count: 0,
  },
  states: {
    idle: {
      on: {
        START: {
          target: 'loading',
        },
      },
    },
    loading: {
      on: {
        RESOLVE: {
          target: 'success',
          reduce: ({ context, event }) => ({
            count: context.count + event.payload,
          }),
        },
      },
    },
    success: {},
  },
}

const machine = createMachine(config)

test('state machine public api types', () => {
  assertType<State>(machine.getState())
  assertType<Context>(machine.getContext())
  assertType<MachineSnapshot<State, Context>>(machine.getSnapshot())
  assertType<boolean>(machine.can({ type: 'START' }))
  assertType<boolean>(machine.matches('idle'))
  assertType<MachineSnapshot<State, Context>>(
    machine.send({ type: 'RESOLVE', payload: 1 }),
  )
  assertType<() => void>(
    machine.subscribe((snapshot) => {
      assertType<MachineSnapshot<State, Context>>(snapshot)
    }),
  )
})

const invalidInitial: MachineConfig<State, Context, Event> = {
  // @ts-expect-error invalid initial state
  initial: 'missing',
  context: {
    count: 0,
  },
  states: {
    idle: {},
    loading: {},
    success: {},
  },
}

const invalidTarget: MachineConfig<State, Context, Event> = {
  initial: 'idle',
  context: {
    count: 0,
  },
  states: {
    idle: {
      on: {
        START: {
          // @ts-expect-error invalid target state
          target: 'missing',
        },
      },
    },
    loading: {},
    success: {},
  },
}

// @ts-expect-error invalid state for matches
machine.matches('error')
