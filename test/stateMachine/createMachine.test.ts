import { createMachine } from '@/modules/stateMachine/createMachine'
import type { MachineConfig } from '@/modules/stateMachine/types'
import { describe, expect, test, vi } from 'vitest'

type FlowState = 'idle' | 'loading' | 'success' | 'error'
type FlowContext = {
  retryCount: number
  message: string | null
}
type FlowEvent =
  | { type: 'START' }
  | { type: 'RESOLVE' }
  | { type: 'FAIL'; payload?: string }
  | { type: 'RESET' }

const createConfig = (
  sequence: string[] = [],
): MachineConfig<FlowState, FlowContext, FlowEvent> => ({
  initial: 'idle',
  context: {
    retryCount: 0,
    message: null,
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
          reduce: ({ context }) => ({
            ...context,
            message: 'done',
          }),
        },
        FAIL: {
          target: 'error',
          guard: ({ event }) => Boolean(event.payload),
          reduce: ({ context, event }) => ({
            ...context,
            retryCount: context.retryCount + 1,
            message: event.payload ?? null,
          }),
        },
      },
      onExit: ({ state, event }) => {
        sequence.push(`exit:${state}:${event.type}`)
      },
    },
    success: {
      onEnter: ({ state, context }) => {
        sequence.push(`enter:${state}:${context.message}`)
      },
    },
    error: {
      on: {
        RESET: {
          target: 'idle',
          reduce: ({ context }) => ({
            ...context,
            message: null,
          }),
        },
      },
    },
  },
})

describe('createMachine', () => {
  test('initializes with the configured snapshot', () => {
    const machine = createMachine(createConfig())

    expect(machine.getState()).toBe('idle')
    expect(machine.getContext()).toEqual({
      retryCount: 0,
      message: null,
    })
    expect(machine.getSnapshot()).toEqual({
      state: 'idle',
      context: {
        retryCount: 0,
        message: null,
      },
    })
  })

  test('runs exit, commit, enter, subscribe in order', () => {
    const sequence: string[] = []
    const machine = createMachine(createConfig(sequence))

    machine.send({ type: 'START' })
    sequence.length = 0

    machine.subscribe((snapshot) => {
      sequence.push(`subscribe:${snapshot.state}:${snapshot.context.message}`)
    })

    const nextSnapshot = machine.send({ type: 'RESOLVE' })

    expect(nextSnapshot).toEqual({
      state: 'success',
      context: {
        retryCount: 0,
        message: 'done',
      },
    })
    expect(sequence).toEqual([
      'exit:loading:RESOLVE',
      'enter:success:done',
      'subscribe:success:done',
    ])
  })

  test('does not notify listeners when guard blocks the event', () => {
    const machine = createMachine(createConfig())
    const listener = vi.fn()

    machine.send({ type: 'START' })
    machine.subscribe(listener)

    const nextSnapshot = machine.send({ type: 'FAIL' })

    expect(nextSnapshot).toEqual({
      state: 'loading',
      context: {
        retryCount: 0,
        message: null,
      },
    })
    expect(listener).not.toHaveBeenCalled()
  })

  test('supports can, matches and unsubscribe', () => {
    const machine = createMachine(createConfig())
    const listener = vi.fn()
    const unsubscribe = machine.subscribe(listener)

    expect(machine.matches('idle')).toBe(true)
    expect(machine.can({ type: 'START' })).toBe(true)
    expect(machine.can({ type: 'RESOLVE' })).toBe(false)

    machine.send({ type: 'START' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    machine.send({ type: 'RESOLVE' })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
