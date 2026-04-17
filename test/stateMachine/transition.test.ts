import { transition } from '@/modules/stateMachine/transition'
import type {
  MachineConfig,
  MachineSnapshot,
} from '@/modules/stateMachine/types'
import { describe, expect, test } from 'vitest'

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

const config: MachineConfig<RequestState, RequestContext, RequestEvent> = {
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
          reduce: ({ context }) => ({
            ...context,
            message: 'done',
          }),
        },
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
}

describe('transition', () => {
  test('returns ignored result when event is not configured', () => {
    const snapshot: MachineSnapshot<RequestState, RequestContext> = {
      state: 'idle',
      context: {
        retryCount: 0,
        message: null,
      },
    }

    const result = transition(config, snapshot, { type: 'RESOLVE' })

    expect(result.status).toBe('ignored')
    expect(result.snapshot).toEqual(snapshot)
    expect(result.stateChanged).toBe(false)
  })

  test('returns blocked result when guard returns false', () => {
    const snapshot: MachineSnapshot<RequestState, RequestContext> = {
      state: 'loading',
      context: {
        retryCount: 0,
        message: null,
      },
    }

    const result = transition(config, snapshot, { type: 'REJECT' })

    expect(result.status).toBe('blocked')
    expect(result.snapshot).toEqual(snapshot)
    expect(result.changed).toBe(false)
  })

  test('returns next snapshot when reduce updates context', () => {
    const snapshot: MachineSnapshot<RequestState, RequestContext> = {
      state: 'error',
      context: {
        retryCount: 1,
        message: 'boom',
      },
    }

    const result = transition(config, snapshot, { type: 'RETRY' })

    expect(result.status).toBe('matched')
    expect(result.stateChanged).toBe(true)
    expect(result.snapshot).toEqual({
      state: 'loading',
      context: {
        retryCount: 2,
        message: null,
      },
    })
  })
})
