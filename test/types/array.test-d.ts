/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  BuildArray,
  Chunk,
  Concat,
  Equal,
  First,
  Includes,
  Last,
  Length,
  PopArray,
  Push,
  RemoveArrItem,
  ReverseArr,
  ShiftArray,
  TupleToNestedObject,
  TupleToObject,
  Unshift,
  Zip,
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
const tuple = [1] as const

test('test Concat', () => {
  ;(assertType<Concat<[], []>>([]),
    assertType<Concat<[], [1]>>([1]),
    assertType<Concat<typeof tuple, typeof tuple>>([1, 1]),
    assertType<Concat<[1, 2], [3, 4]>>([1, 2, 3, 4]),
    assertType<Concat<['1', 2, '3'], [false, boolean, '4']>>([
      '1',
      2,
      '3',
      false,
      true,
      '4',
    ]))

  // @ts-expect-error not tuple
  assertType<Concat<null, undefined>>
})

test('test Includes', () => {
  assertType<
    Equal<Includes<['Kars', 'Esidisi', 'Wamuu', 'Santana'], 'Kars'>, true>
  >(true)
  assertType<
    Equal<Includes<['Kars', 'Esidisi', 'Wamuu', 'Santana'], 'Dio'>, false>
  >(true)
  assertType<Equal<Includes<[1, 2, 3, 5, 6, 7], 7>, true>>(true)
  assertType<Equal<Includes<[1, 2, 3, 5, 6, 7], 4>, false>>(true)
  assertType<Equal<Includes<[1, 2, 3], 2>, true>>(true)
  assertType<Equal<Includes<[1, 2, 3], 1>, true>>(true)
  // 用{}会被eslint报错，所以这里换成object
  assertType<Equal<Includes<[object], { a: 'A' }>, false>>(true)
  assertType<Equal<Includes<[boolean, 2, 3, 5, 6, 7], false>, false>>(true)
  assertType<Equal<Includes<[true, 2, 3, 5, 6, 7], boolean>, false>>(true)
  assertType<Equal<Includes<[false, 2, 3, 5, 6, 7], false>, true>>(true)
  assertType<Equal<Includes<[{ a: 'A' }], { readonly a: 'A' }>, false>>(true)
  assertType<Equal<Includes<[{ readonly a: 'A' }], { a: 'A' }>, false>>(true)
  assertType<Equal<Includes<[1], 1 | 2>, false>>(true)
  assertType<Equal<Includes<[1 | 2], 1>, false>>(true)
  assertType<Equal<Includes<[null], undefined>, false>>(true)
  assertType<Equal<Includes<[undefined], null>, false>>(true)
})

test('test Push', () => {
  assertType<Equal<Push<[], 1>, [1]>>(true)
  assertType<Equal<Push<[1, 2], '3'>, [1, 2, '3']>>(true)
  assertType<Equal<Push<['1', 2, '3'], boolean>, ['1', 2, '3', boolean]>>(true)
})

test('test Unshift', () => {
  assertType<Equal<Unshift<[], 1>, [1]>>(true)
  assertType<Equal<Unshift<[1, 2], '3'>, ['3', 1, 2]>>(true)
  assertType<Equal<Unshift<['1', 2, '3'], boolean>, [boolean, '1', 2, '3']>>(
    true,
  )
})

test('test zip', () => {
  assertType<
    Equal<Zip<[1, 2, 3], ['a', 'b', 'c']>, [[1, 'a'], [2, 'b'], [3, 'c']]>
  >(true)
})

test('test ReverseArr', () => {
  assertType<ReverseArr<[3, 2, 1]>>([1, 2, 3])
})

test('test RemoveItem', () => {
  assertType<RemoveArrItem<[3, 2, 1, 3, 3, 3], 3>>([2, 1])
})

test('test BuildArray', () => {
  assertType<BuildArray<3, 3>>([3, 3, 3])
  assertType<BuildArray<3, 'a'>>(['a', 'a', 'a'])
  assertType<BuildArray<0, 3>>([])
})

test('test Chunk', () => {
  assertType<Equal<Chunk<[1, 2, 3, 4, 5], 3>, [[1, 2, 3], [4, 5]]>>(true)
  assertType<Equal<Chunk<[1, 2, 3, 4, 5], 2>, [[1, 2], [3, 4], [5]]>>(true)
  assertType<Equal<Chunk<[1, 2, 3, 4, 5], 1>, [[1], [2], [3], [4], [5]]>>(true)
  assertType<Equal<Chunk<[1, 2, 3, 4, 5], 5>, [[1, 2, 3, 4, 5]]>>(true)
  assertType<Equal<Chunk<[1, 2, 3, 4, 5], 6>, [[1, 2, 3, 4, 5]]>>(true)
})

test('test TupleToNestedObject', () => {
  assertType<
    Equal<
      TupleToNestedObject<['a', 'b', 'c'], number>,
      {
        a: {
          b: {
            c: number
          }
        }
      }
    >
  >(true)
})
