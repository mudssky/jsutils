/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  First,
  Last,
  Length,
  PopArray,
  ShiftArray,
  TupleToObject,
} from '@mudssky/jsutils'
import { assertType, test } from 'vitest'
let n!: never
test('test First', () => {
  assertType<First<[3, 2, 1]>>(3)
  assertType<First<[() => 123, { a: string }]>>(() => 123)
  assertType<First<[]>>(n)
  assertType<First<[undefined]>>(undefined)

  // @ts-expect-error not Array
  assertType<First<'notArray'>>(n)
  // @ts-expect-error arrayLike
  assertType<First<{ 0: 'arrayLike' }>>(n)
})

test('test Last', () => {
  assertType<Last<[3, 2, 1]>>(1)
  assertType<Last<[() => 123, { a: string }]>>({ a: '' })
  assertType<Last<[]>>(n)
  assertType<Last<[undefined]>>(undefined)

  // @ts-expect-error not Array
  assertType<Last<'notArray'>>
  // @ts-expect-error arrayLike
  assertType<Last<{ 0: 'arrayLike' }>>
})
test('test PopArray', () => {
  assertType<PopArray<[3, 2, 1]>>([3, 2])
  assertType<PopArray<[]>>([])
})
test('test ShiftArray', () => {
  assertType<ShiftArray<[3, 2, 1]>>([2, 1])
  assertType<ShiftArray<[]>>([])
})

test('test TupleToObject', () => {
  const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const
  const tupleNumber = [1, 2, 3, 4] as const
  const sym1 = Symbol(1)
  const sym2 = Symbol(2)
  const tupleSymbol = [sym1, sym2] as const
  const tupleMix = [1, '2', 3, '4', sym1] as const

  assertType<TupleToObject<typeof tuple>>({
    tesla: 'tesla',
    'model 3': 'model 3',
    'model X': 'model X',
    'model Y': 'model Y',
  })

  assertType<TupleToObject<typeof tupleNumber>>({ 1: 1, 2: 2, 3: 3, 4: 4 })
  assertType<TupleToObject<typeof tupleSymbol>>({ [sym1]: sym1, [sym2]: sym2 })
  assertType<TupleToObject<typeof tupleMix>>({
    1: 1,
    '2': '2',
    3: 3,
    '4': '4',
    [sym1]: sym1,
  })
})

test('test LENGTH', () => {
  const tesla = ['tesla', 'model 3', 'model X', 'model Y'] as const
  const spaceX = [
    'FALCON 9',
    'FALCON HEAVY',
    'DRAGON',
    'STARSHIP',
    'HUMAN SPACEFLIGHT',
  ] as const

  assertType<Length<typeof tesla>>(4)
  assertType<Length<typeof spaceX>>(5)

  // @ts-expect-error not tuple
  assertType<Length<5>>
  // @ts-expect-error not tuple
  assertType<Length<'hello world'>>
})
