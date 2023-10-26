import { singletonProxy } from '@mudssky/jsutil'
import { describe, expect, test } from 'vitest'

describe('singletonProxy', () => {
  test('should return same instance ', () => {
    const singleDate = singletonProxy(Date)
    const date1 = new singleDate()
    const date2 = new singleDate()
    expect(date1).toBe(date2)
  })
})
