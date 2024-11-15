import { describe, expect, test } from 'vitest'
// 直接把根目录作为一个npm包引入
import {
  CompareFunction,
  createQuery,
  getSortDirection,
  range,
} from '@mudssky/jsutils'

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
