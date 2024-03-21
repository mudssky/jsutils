import { describe, expect, test } from 'vitest'
// 直接把根目录作为一个npm包引入
import { createQuery, range } from '@mudssky/jsutils'

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
