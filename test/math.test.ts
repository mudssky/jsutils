import { describe, expect, test } from 'vitest'
import { ArgumentError, randomInt } from '@mudssky/jsutil'

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
