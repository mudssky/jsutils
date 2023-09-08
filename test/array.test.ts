import { range } from '../dist/types/modules/array'
import { describe, expect, test } from 'vitest'

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

  test('test invalid param', () => {
    expect(() => range(0.5, 5)).toThrowError('unsupport decimal number')
    expect(() => range(0, 5, 0)).toThrowError('step can not be zero')
  })
})
