/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Alike,
  AllCombinations,
  DeepReadonly,
  Equal,
  Expect,
  ExpectFalse,
  ExpectTrue,
  If,
  IsAny,
  IsUnion,
  NotEqual,
} from '@mudssky/jsutils'
import { assertType, test } from 'vitest'

test('test util', () => {
  /*Expect */
  // expectTypeOf(true as const).toMatchTypeOf<Expect<true>>()
  assertType<Expect<true>>(true)
  // @ts-expect-error  not satisfy the constraint
  assertType<Expect<false>>(true)

  /* ExpectFalse*/
  assertType<ExpectFalse<false>>(false)
  // @ts-expect-error not satisfy the constraint
  assertType<ExpectFalse<true>>(false)

  /* ExpectFalse*/
  assertType<ExpectFalse<false>>(false)
  // @ts-expect-error not satisfy the constraint
  assertType<ExpectFalse<true>>(false)

  /* ExpectTrue*/
  assertType<ExpectTrue<true>>(true)
  // @ts-expect-error not satisfy the constraint
  assertType<ExpectTrue<false>>(true)

  /* Equal*/
  assertType<Equal<true, true>>(true)
  assertType<Equal<true, false>>(false)
  assertType<Equal<123, 123>>(true)
  assertType<Equal<'123', 123>>(false)
  assertType<Equal<'123', string>>(false)
  assertType<Equal<{ a: number }, { a: number }>>(true)
  assertType<Equal<{ a: number }, { b: number }>>(false)
  assertType<Equal<any, '123'>>(false)
  assertType<Equal<any, unknown>>(false)

  /* Not Equal */
  assertType<NotEqual<false, true>>(true)
  assertType<NotEqual<true, true>>(false)

  /* IsAny */
  assertType<IsAny<any>>(true)
  assertType<IsAny<1>>(false)

  /* Alike */
  assertType<Alike<{ a: 1 } & { b: 2 }, { a: 1; b: 2 }>>(true)
  assertType<Equal<{ a: 1 } & { b: 2 }, { a: 1; b: 2 }>>(false)

  /* If */
  assertType<If<true, 'a', 'b'>>('a')
  assertType<If<false, 'a', 'b'>>('b')
  // @ts-expect-error not boolean
  assertType<If<null, 'a', 'b'>>
})

test('test DeepReadonly', () => {
  assertType<Equal<DeepReadonly<{ a: number }>, { readonly a: number }>>(true)
  assertType<
    Equal<
      DeepReadonly<{
        a: number
        b: {
          c: number
        }
      }>,
      {
        readonly a: number
        readonly b: {
          readonly c: number
        }
      }
    >
  >(true)
})
test('test IsUnion', () => {
  assertType<Equal<IsUnion<{ a: number }>, false>>(true)
  assertType<Equal<IsUnion<'a' | 'b' | 'c'>, true>>(true)
  assertType<Equal<IsUnion<'a'>, false>>(true)
  assertType<Equal<IsUnion<unknown>, false>>(true)
  assertType<Equal<IsUnion<any>, false>>(true)
})

test('test AllCombinations', () => {
  assertType<Equal<AllCombinations<'a'>, 'a'>>(true)
  assertType<Equal<AllCombinations<'a' | 'b'>, 'a' | 'b' | 'ab' | 'ba'>>(true)
  assertType<
    Equal<
      AllCombinations<'a' | 'b' | 'c'>,
      | 'a'
      | 'b'
      | 'c'
      | 'ab'
      | 'ac'
      | 'ba'
      | 'bc'
      | 'ca'
      | 'cb'
      | 'abc'
      | 'acb'
      | 'bac'
      | 'bca'
      | 'cab'
      | 'cba'
    >
  >(true)
})
