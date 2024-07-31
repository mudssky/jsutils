/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeepAwaited, PromiseType } from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

test('test PromiseType', async () => {
  const testFn: () => Promise<string> = async () => {
    return 'dad'
  }
  // expectTypeOf(testFn).toMatchTypeOf<{ name: string }>()
  assertType<PromiseType<ReturnType<typeof testFn>>>(await testFn())
})

type X = Promise<string>
type Y = Promise<{ field: number }>
type Z = Promise<Promise<string | number>>
type Z1 = Promise<Promise<Promise<string | boolean>>>
type T = { then: (onfulfilled: (arg: number) => any) => any }

test('test Awaited', async () => {
  assertType<DeepAwaited<X>>('123')
  assertType<DeepAwaited<Y>>({ field: 1 })

  assertType<DeepAwaited<Z>>('123')
  assertType<DeepAwaited<Z>>(123)

  assertType<DeepAwaited<Z1>>('123')
  assertType<DeepAwaited<Z1>>(true)

  assertType<DeepAwaited<T>>(123)
})
