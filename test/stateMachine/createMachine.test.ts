import type { MachineConfig } from '@mudssky/jsutils'
import { createMachine } from '@mudssky/jsutils'
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
          assign: () => ({
            message: 'done',
          }),
        },
        FAIL: {
          target: 'error',
          guard: ({ event }) => Boolean(event.payload),
          assign: ({ context, event }) => ({
            retryCount: context.retryCount + 1,
            message: event.payload ?? null,
          }),
        },
      },
      exit: ({ value, event }) => {
        sequence.push(`exit:${value}:${event.type}`)
      },
    },
    success: {
      entry: ({ value, context }) => {
        sequence.push(`entry:${value}:${context.message}`)
      },
    },
    error: {
      on: {
        RESET: {
          target: 'idle',
          assign: () => ({
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

    expect(machine.getValue()).toBe('idle')
    expect(machine.getContext()).toEqual({
      retryCount: 0,
      message: null,
    })
    expect(machine.getSnapshot()).toEqual({
      value: 'idle',
      context: {
        retryCount: 0,
        message: null,
      },
    })
  })

  test('runs exit, commit, entry, subscribe in order', () => {
    const sequence: string[] = []
    const machine = createMachine(createConfig(sequence))

    machine.send({ type: 'START' })
    sequence.length = 0

    machine.subscribe((snapshot) => {
      sequence.push(`subscribe:${snapshot.value}:${snapshot.context.message}`)
    })

    const nextSnapshot = machine.send({ type: 'RESOLVE' })

    expect(nextSnapshot).toEqual({
      value: 'success',
      context: {
        retryCount: 0,
        message: 'done',
      },
    })
    expect(sequence).toEqual([
      'exit:loading:RESOLVE',
      'entry:success:done',
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
      value: 'loading',
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
