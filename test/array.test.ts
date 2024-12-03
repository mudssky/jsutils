import { assert, describe, expect, test } from 'vitest'
// 直接把根目录作为一个npm包引入
import * as _ from '@mudssky/jsutils'
import {
  alphabetical,
  CompareFunction,
  createQuery,
  getSortDirection,
  range,
} from '@mudssky/jsutils'

const NULL = null as unknown as unknown[]

describe('range', () => {
  test('returns an empty array for zero range', () => {
    expect(range(0)).toEqual([])
  })

  test('returns an array of consecutive integers with default step', () => {
    expect(range(1, 5)).toEqual([1, 2, 3, 4])
  })

  test('returns an array of consecutive integers with specified step', () => {
    expect(range(1, 7, 2)).toEqual([1, 3, 5])
  })

  test('returns an array of consecutive integers with negative step', () => {
    expect(range(5, 1, -1)).toEqual([5, 4, 3, 2])
  })

  test('returns an empty array if end is less than start with positive step', () => {
    expect(range(5, 1)).toEqual([])
  })

  test('returns an empty array if end is greater than start with negative step', () => {
    expect(range(1, 5, -1)).toEqual([])
  })
  // range(0.5, 5)

  test('test invalid param', () => {
    expect(() => range(0.5, 5)).toThrowError('unsupport decimal number')
    expect(() => range(0, 5, 0)).toThrowError('step can not be zero')
  })
})

describe('query', () => {
  const data = [
    { name: 'apple', category: 'fruit', price: 10 },
    { name: 'banana', category: 'fruit', price: 5 },
    { name: 'carrot', category: 'vegetable', price: 3 },
    { name: 'orange', category: 'fruit', price: 8 },
  ]
  test('basic func', () => {
    const result = createQuery(data)
      .where((item) => {
        return item.category === 'fruit' && item.price > 5
      })
      .sortBy('price')
      .groupBy('name')
      .execute()
    expect(result).toEqual({
      orange: [{ name: 'orange', category: 'fruit', price: 8 }],
      apple: [{ name: 'apple', category: 'fruit', price: 10 }],
    })
  })
})

describe('getSortDirection', () => {
  test('should return "none" for an empty array', () => {
    const result = getSortDirection([])
    expect(result).toBe('none')
  })

  test('should return "none" for an array with one element', () => {
    const result = getSortDirection([1])
    expect(result).toBe('none')
  })

  test('should return "asc" for an array that is already sorted in ascending order', () => {
    const result = getSortDirection([1, 2, 3, 4])
    expect(result).toBe('asc')
  })

  test('should return "desc" for an array that is already sorted in descending order', () => {
    const result = getSortDirection([4, 3, 2, 1])
    expect(result).toBe('desc')
  })

  test('should return "asc" for an array that is not sorted but can be sorted in ascending order', () => {
    const result = getSortDirection([1, 3, 2, 4])
    expect(result).toBe('asc')
  })

  test('should return "desc" for an array that is not sorted but can be sorted in descending order', () => {
    const result = getSortDirection([4, 2, 3, 1])
    expect(result).toBe('desc')
  })

  // test('should return "none" for an array with mixed elements', () => {
  //   const result = getSortDirection([1, 3, 2, 4, 2])
  //   expect(result).toBe('none')
  // })

  test('should use the provided compare function to determine sort direction', () => {
    const customCompareFn: CompareFunction<number> = (a, b) => b - a
    const result = getSortDirection([4, 3, 2, 1], customCompareFn)
    expect(result).toBe('asc')
  })

  test('should handle custom objects with a compare function', () => {
    const data = [
      { name: 'apple', price: 10 },
      { name: 'banana', price: 5 },
      { name: 'carrot', price: 3 },
      { name: 'orange', price: 2 },
    ]

    const customCompareFn: CompareFunction<{ name: string; price: number }> = (
      a,
      b,
    ) => a.price - b.price
    const result = getSortDirection(data, customCompareFn)
    expect(result).toBe('desc')
  })
})

describe('alphabetical function', () => {
  test('uses getter', () => {
    const list = [{ name: 'Leo' }, { name: 'AJ' }, { name: 'Cynthia' }]
    const result = alphabetical(list, (i) => i.name)
    assert.equal(result[0].name, 'AJ')
    assert.equal(result[1].name, 'Cynthia')
    assert.equal(result[2].name, 'Leo')
  })
  test('uses descending order', () => {
    const list = [{ name: 'Leo' }, { name: 'AJ' }, { name: 'Cynthia' }]
    const result = alphabetical(list, (i) => i.name, 'desc')
    assert.equal(result[0].name, 'Leo')
    assert.equal(result[1].name, 'Cynthia')
    assert.equal(result[2].name, 'AJ')
  })
  test('gracefully handles null input list', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = alphabetical(null as any as string[], (x) => x)
    assert.deepEqual(result, [])
  })
})

describe('boil function', () => {
  test('compares and keeps item based on condition', () => {
    const list = [
      { game: 'a', score: 100 },
      { game: 'b', score: 200 },
      { game: 'c', score: 300 },
      { game: 'd', score: 400 },
      { game: 'e', score: 500 },
    ]
    const result = _.boil(list, (a, b) => (a.score > b.score ? a : b))
    assert.equal(result!.game, 'e')
    assert.equal(result!.score, 500)
  })
  test('does not fail when provided array is empty', () => {
    const result = _.boil([], () => true)
    assert.isNull(result)
  })
  test('does not fail when provided array is null', () => {
    const result = _.boil(null as unknown as readonly boolean[], () => true)
    assert.isNull(result)
  })
  test('does not fail when provided array is funky shaped', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = _.boil({} as any, () => true)
    assert.isNull(result)
  })
})

describe('chunk function', () => {
  test('returns an array of arrays', () => {
    const list = [1, 1, 1, 1, 1, 1, 1, 1]
    const result = _.chunk(list)
    const [a, b, c] = result
    assert.deepEqual(a, [1, 1])
    assert.deepEqual(b, [1, 1])
    assert.deepEqual(c, [1, 1])
  })
  test('returns remainder in final cluster', () => {
    const list = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2]
    const result = _.chunk(list, 3)
    const [a, b, c, d] = result
    assert.deepEqual(a, [1, 1, 1])
    assert.deepEqual(b, [1, 1, 1])
    assert.deepEqual(c, [1, 1, 1])
    assert.deepEqual(d, [2, 2])
  })
})

describe('countBy function', () => {
  const people = [
    { name: 'ray', group: 'X' },
    { name: 'sara', group: 'X' },
    { name: 'bo', group: 'Y' },
    { name: 'mary', group: 'Y' },
  ]
  test('returns correctly counted items object', () => {
    const result = _.countBy(people, (p) => p.group)
    assert.deepEqual(result, {
      X: 2,
      Y: 2,
    })
  })
  test('does not error on bad input', () => {
    _.countBy(null as unknown as number[], (x) => x)
    _.countBy(undefined as unknown as number[], (x) => x)
  })
})

describe('diff function', () => {
  test('handles null root', () => {
    const result = _.diff(NULL, ['a'])
    assert.deepEqual(result, ['a'])
  })
  test('handles null other', () => {
    const result = _.diff(['a'], NULL)
    assert.deepEqual(result, ['a'])
  })
  test('handles null inputs', () => {
    const result = _.diff(NULL, NULL)
    assert.deepEqual(result, [])
  })
  test('handles empty array root', () => {
    const result = _.diff([], ['a'])
    assert.deepEqual(result, [])
  })
  test('handles empty array other', () => {
    const result = _.diff(['a'], [])
    assert.deepEqual(result, ['a'])
  })
  test('returns all items from root that dont exist in other', () => {
    const result = _.diff(['a', 'b', 'c'], ['c', 'd', 'e'])
    assert.deepEqual(result, ['a', 'b'])
  })
  test('uses identity function', () => {
    const identity = ({ letter }: { letter: string }) => letter
    const letter = (l: string) => ({ letter: l })
    const result = _.diff(
      [letter('a'), letter('b'), letter('c')],
      [letter('c'), letter('d'), letter('e')],
      identity,
    )
    assert.deepEqual(result, [letter('a'), letter('b')])
  })
})

describe('first function', () => {
  test('returns first item in list', () => {
    const list = [
      { game: 'a', score: 100 },
      { game: 'b', score: 200 },
    ]
    const result = _.first(list)
    assert.equal(result!.game, 'a')
    assert.equal(result!.score, 100)
  })
  test('returns default value without error when list is empty', () => {
    const list = [] as string[]
    const result = _.first(list, 'yolo')
    assert.equal(result, 'yolo')
  })
  test('gracefully handles null input list', () => {
    const result = _.first(NULL)
    assert.equal(result, null)
  })
})

describe('last function', () => {
  test('returns last item in list', () => {
    const list = [
      { game: 'a', score: 100 },
      { game: 'b', score: 200 },
    ]
    const result = _.last(list)
    assert.equal(result!.game, 'b')
    assert.equal(result!.score, 200)
  })
  test('returns default value without error when list is empty', () => {
    const list = [] as string[]
    const result = _.last(list, 'yolo')
    assert.equal(result, 'yolo')
  })
  test('gracefully handles null input list', () => {
    const result = _.last(NULL)
    assert.equal(result, null)
  })
})

describe('fork function', () => {
  test('returns two empty arrays for null input', () => {
    const [a, b] = _.fork(NULL, (x) => !!x)
    assert.deepEqual(a, [])
    assert.deepEqual(b, [])
  })
  test('returns two empty arrays for one empty array input', () => {
    const [a, b] = _.fork([], (x) => !!x)
    assert.deepEqual(a, [])
    assert.deepEqual(b, [])
  })
  test('returns correctly forked list', () => {
    const input = [
      { name: 'ray', group: 'X' },
      { name: 'sara', group: 'X' },
      { name: 'bo', group: 'Y' },
      { name: 'mary', group: 'Y' },
    ]
    const [xs, ys] = _.fork(input, (x) => x.group === 'X')
    assert.lengthOf(xs, 2)
    assert.lengthOf(ys, 2)
    const [r, s] = xs
    assert.equal(r.name, 'ray')
    assert.equal(s.name, 'sara')
    const [b, m] = ys
    assert.equal(b.name, 'bo')
    assert.equal(m.name, 'mary')
  })
})

describe('hasIntersects function', () => {
  test('returns true if list a & b have items in common', () => {
    const listA = ['a', 'b']
    const listB = [1, 2, 'b', 'x']
    const result = _.hasIntersects(listA, listB)
    assert.isTrue(result)
  })
  test('returns false if list a & b have no items in common', () => {
    const listA = ['a', 'b', 'c']
    const listB = ['x', 'y']
    const result = _.hasIntersects(listA, listB)
    assert.isFalse(result)
  })
  test('returns true using custom identity', () => {
    const listA = [{ value: 23 }, { value: 12 }]
    const listB = [{ value: 12 }]
    const result = _.hasIntersects(listA, listB, (x) => x.value)
    assert.isTrue(result)
  })
  test('returns false without failing if either list is null', () => {
    assert.isFalse(_.hasIntersects(null as unknown as never, []))
    assert.isFalse(_.hasIntersects([], null as unknown as never))
  })
})

describe('max function', () => {
  test('returns the max value from list of number', () => {
    const list = [5, 5, 10, 2]
    const result = _.max(list)
    assert.equal(result, 10)
  })
  test('returns the max value from list of objects', () => {
    const list = [
      { game: 'a', score: 100 },
      { game: 'b', score: 200 },
      { game: 'c', score: 300 },
      { game: 'd', score: 400 },
      { game: 'e', score: 500 },
    ]
    const result = _.max(list, (x) => x.score)
    assert.equal(result!.game, 'e')
    assert.equal(result!.score, 500)
  })
})

describe('min function', () => {
  test('returns the min value from list of number', () => {
    const list = [5, 5, 10, 2]
    const result = _.min(list)
    assert.equal(result, 2)
  })
  test('returns the min value from list of objects', () => {
    const list = [
      { game: 'a', score: 100 },
      { game: 'b', score: 200 },
      { game: 'c', score: 300 },
      { game: 'd', score: 400 },
      { game: 'e', score: 500 },
    ]
    const result = _.min(list, (x) => x.score)
    assert.equal(result!.game, 'a')
    assert.equal(result!.score, 100)
  })
})

describe('toggle function', () => {
  test('should handle null input list', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = _.toggle(null as unknown as any[], 'a')
    assert.deepEqual(result, ['a'])
  })
  test('should handle null input list and null item', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = _.toggle(null as unknown as any[], null)
    assert.deepEqual(result, [])
  })
  test('should handle null item', () => {
    const result = _.toggle(['a'], null)
    assert.deepEqual(result, ['a'])
  })
  test('should add item when it does not exist using default matcher', () => {
    const result = _.toggle(['a'], 'b')
    assert.deepEqual(result, ['a', 'b'])
  })
  test('should remove item when it does exist using default matcher', () => {
    const result = _.toggle(['a', 'b'], 'b')
    assert.deepEqual(result, ['a'])
  })
  test('should remove item when it does exist using custom matcher', () => {
    const result = _.toggle(
      [{ value: 'a' }, { value: 'b' }],
      { value: 'b' },
      (v) => v.value,
    )
    assert.deepEqual(result, [{ value: 'a' }])
  })
  test('should add item when it does not exist using custom matcher', () => {
    const result = _.toggle([{ value: 'a' }], { value: 'b' }, (v) => v.value)
    assert.deepEqual(result, [{ value: 'a' }, { value: 'b' }])
  })
  test('should prepend item when strategy is set', () => {
    const result = _.toggle(['a'], 'b', null, { strategy: 'prepend' })
    assert.deepEqual(result, ['b', 'a'])
  })
})

describe('sum function', () => {
  test('adds list of number correctly', () => {
    const list = [5, 5, 10, 2]
    const result = _.sum(list)
    assert.equal(result, 22)
  })
  test('adds list of objects correctly using getter fn', () => {
    const list = [{ value: 5 }, { value: 5 }, { value: 10 }, { value: 2 }]
    const result = _.sum(list, (x) => x.value)
    assert.equal(result, 22)
  })
  test('gracefully handles null input list', () => {
    const result = _.sum(null as unknown as readonly number[])
    assert.equal(result, 0)
  })
})

describe('zipObject function', () => {
  test('zips to an object correctly', () => {
    const result = _.zipObject(['a', 'b'], [1, 2])
    assert.deepEqual(result, { a: 1, b: 2 })
  })

  test('zips to an object with custom map function', () => {
    const result = _.zipObject(['a', 'b'], (k, i) => k + i)
    assert.deepEqual(result, { a: 'a0', b: 'b1' })
  })

  test('zips to an object with only one value', () => {
    const result = _.zipObject(['a', 'b'], 1)
    assert.deepEqual(result, { a: 1, b: 1 })
  })

  test('returns an empty object if bad parameters are passed', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = _.zipObject()
    assert.deepEqual(result, {})
  })
})

describe('zip function', () => {
  test('zips an array correctly', () => {
    const result = _.zip(['a', 'b'], [1, 2], [true, false])
    assert.deepEqual(result, [
      ['a', 1, true],
      ['b', 2, false],
    ])
  })

  test('returns an empty array if nothing is passed', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = _.zip()
    assert.deepEqual(result, [])
  })
})

describe('unique function', () => {
  test('correctly removed duplicate items', () => {
    const list = [1, 1, 2]
    const result = _.unique(list)
    assert.deepEqual(result, [1, 2])
  })
  test('uses key fn to correctly remove duplicate items', () => {
    const list = [
      { id: 'a', word: 'hello' },
      { id: 'a', word: 'hello' },
      { id: 'b', word: 'oh' },
      { id: 'b', word: 'oh' },
      { id: 'c', word: 'yolo' },
    ]
    const result = _.unique(list, (x) => x.id)
    const [a, b, c] = result
    assert.equal(a.id, 'a')
    assert.equal(a.word, 'hello')
    assert.equal(b.id, 'b')
    assert.equal(b.word, 'oh')
    assert.equal(c.id, 'c')
    assert.equal(c.word, 'yolo')
  })
})
