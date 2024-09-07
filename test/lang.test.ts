import { getTag, isEmpty } from '@mudssky/jsutils'
import { describe, expect, test } from 'vitest'

describe('isEMpty', () => {
  // 测试 undefined 和 null
  test('should return true for undefined', () => {
    expect(isEmpty(undefined)).toBe(true)
  })

  test('should return true for null', () => {
    expect(isEmpty(null)).toBe(true)
  })

  // 测试空字符串
  test('should return true for empty string', () => {
    expect(isEmpty('')).toBe(true)
  })

  // 测试非空字符串
  test('should return false for non-empty string', () => {
    expect(isEmpty('Hello')).toBe(false)
  })

  // 测试空数组
  test('should return true for empty array', () => {
    expect(isEmpty([])).toBe(true)
  })

  // 测试非空数组
  test('should return false for non-empty array', () => {
    expect(isEmpty([1, 2, 3])).toBe(false)
  })

  // 测试空对象
  test('should return true for empty object', () => {
    expect(isEmpty({})).toBe(true)
  })

  // 测试非空对象
  test('should return false for non-empty object', () => {
    expect(isEmpty({ key: 'value' })).toBe(false)
  })

  // 测试空 Map
  test('should return true for empty Map', () => {
    expect(isEmpty(new Map())).toBe(true)
  })

  // 测试非空 Map
  test('should return false for non-empty Map', () => {
    const map = new Map()
    map.set('key', 'value')
    expect(isEmpty(map)).toBe(false)
  })

  // 测试空 Set
  test('should return true for empty Set', () => {
    expect(isEmpty(new Set())).toBe(true)
  })

  // 测试非空 Set
  test('should return false for non-empty Set', () => {
    const set = new Set()
    set.add(1)
    expect(isEmpty(set)).toBe(false)
  })
})

describe('getTag function', () => {
  // 测试 undefined 和 null
  test('should return "[object Undefined]" for undefined', () => {
    expect(getTag(undefined)).toBe('[object Undefined]')
  })

  test('should return "[object Null]" for null', () => {
    expect(getTag(null)).toBe('[object Null]')
  })

  // 测试基本数据类型
  test('should return "[object String]" for string', () => {
    expect(getTag('Hello')).toBe('[object String]')
  })

  test('should return "[object Number]" for number', () => {
    expect(getTag(123)).toBe('[object Number]')
  })

  test('should return "[object Boolean]" for boolean', () => {
    expect(getTag(true)).toBe('[object Boolean]')
  })

  test('should return "[object Symbol]" for symbol', () => {
    expect(getTag(Symbol('sym'))).toBe('[object Symbol]')
  })

  test('should return "[object BigInt]" for BigInt', () => {
    expect(getTag(BigInt(10))).toBe('[object BigInt]')
  })

  // 测试对象、数组和函数
  test('should return "[object Object]" for object', () => {
    expect(getTag({})).toBe('[object Object]')
  })

  test('should return "[object Array]" for array', () => {
    expect(getTag([])).toBe('[object Array]')
  })

  test('should return "[object Function]" for function', () => {
    const func = () => {}
    expect(getTag(func)).toBe('[object Function]')
  })

  // 测试其他内置对象类型
  test('should return "[object Date]" for Date', () => {
    expect(getTag(new Date())).toBe('[object Date]')
  })

  test('should return "[object RegExp]" for RegExp', () => {
    expect(getTag(/test/)).toBe('[object RegExp]')
  })

  test('should return "[object Map]" for Map', () => {
    expect(getTag(new Map())).toBe('[object Map]')
  })

  test('should return "[object Set]" for Set', () => {
    expect(getTag(new Set())).toBe('[object Set]')
  })

  test('should return "[object WeakMap]" for WeakMap', () => {
    expect(getTag(new WeakMap())).toBe('[object WeakMap]')
  })

  test('should return "[object WeakSet]" for WeakSet', () => {
    expect(getTag(new WeakSet())).toBe('[object WeakSet]')
  })
})
