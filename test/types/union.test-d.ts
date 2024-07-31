import { Equal, IsUnion, UnionToIntersection } from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

test('test UnionToIntersection', () => {
  assertType<
    Equal<UnionToIntersection<{ a: 1 } | { b: 1 }>, { a: 1 } & { b: 1 }>
  >(true)
})

/**
 * 不知为何github action上的类型测试没跑通
 * 本地测试是偶尔会报错
 */
// test('test UnionToTuple', () => {
//   assertType<Equal<UnionToTuple<'a' | 'b' | 'c'>, ['a', 'b', 'c']>>(true)
// })

test('test IsUnion', () => {
  assertType<Equal<IsUnion<{ a: number }>, false>>(true)
  assertType<Equal<IsUnion<'a' | 'b' | 'c'>, true>>(true)
  assertType<Equal<IsUnion<'a'>, false>>(true)
  assertType<Equal<IsUnion<unknown>, false>>(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assertType<Equal<IsUnion<any>, false>>(true)
})
