import {
  ArgumentError,
  getRandomItemFromArray,
  randomInt,
} from '@mudssky/jsutils'
import { describe, expect, test } from 'vitest'

describe('randomInt', () => {
  test('should be in  range ', () => {
    const resSet = new Set()
    for (let index = 0; index < 100; index++) {
      const res = randomInt(100)
      resSet.add(res)
      expect(res < 100 && res >= 0).toBe(true)
    }
    expect(resSet.size > 20).toBe(true)
  })

  test('should input bigger endInt ', () => {
    expect(() => randomInt(100, 10)).toThrowError(ArgumentError)
  })
})

describe('getRandomItemFromArray', () => {
  test('should return a random item from a non-empty array', () => {
    const result = getRandomItemFromArray([1, 2, 3, 4, 5])
    expect([1, 2, 3, 4, 5]).toContain(result)
  })

  test('should throw an error if the array is empty', () => {
    expect(() => getRandomItemFromArray([])).toThrow(ArgumentError)
  })

  test('should return undefined for a single item array', () => {
    const result = getRandomItemFromArray([10])
    expect(result).toEqual(10)
  })
})
