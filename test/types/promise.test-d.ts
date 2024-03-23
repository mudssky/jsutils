/* eslint-disable @typescript-eslint/no-explicit-any */
import { Awaited, PromiseType } from '@mudssky/jsutils'
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
  assertType<Awaited<X>>('123')
  assertType<Awaited<Y>>({ field: 1 })

  assertType<Awaited<Z>>('123')
  assertType<Awaited<Z>>(123)

  assertType<Awaited<Z1>>('123')
  assertType<Awaited<Z1>>(true)

  assertType<Awaited<T>>(123)
})
