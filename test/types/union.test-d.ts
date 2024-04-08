import { Equal, IsUnion, UnionToTuple } from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

test('test UnionToTuple', () => {
  assertType<Equal<UnionToTuple<'a' | 'b' | 'c'>, ['a', 'b', 'c']>>(true)
})

test('test IsUnion', () => {
  assertType<Equal<IsUnion<{ a: number }>, false>>(true)
  assertType<Equal<IsUnion<'a' | 'b' | 'c'>, true>>(true)
  assertType<Equal<IsUnion<'a'>, false>>(true)
  assertType<Equal<IsUnion<unknown>, false>>(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assertType<Equal<IsUnion<any>, false>>(true)
})
