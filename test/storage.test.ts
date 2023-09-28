import { range } from '@mudssky/jsutil'
import { describe, expect, test } from 'vitest'

describe('localStorage', () => {
  test('should return null when storage not exist', () => {
    expect(range(0)).toEqual([])
  })
})
