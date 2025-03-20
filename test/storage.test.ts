import { WebLocalStorage } from '@mudssky/jsutils'
import { beforeEach, describe, expect, test } from 'vitest'

class LocalStorageMock {
  store: { [k: string]: string }
  length: number

  constructor() {
    this.store = {}
    this.length = 0
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Storage/key
   * @returns
   */
  key = (idx: number): string => {
    const keys = Object.keys(this.store)
    return keys[idx]
  }

  clear() {
    this.store = {}
    this.syncLength()
  }
  syncLength() {
    this.length = Object.keys(this.store).length
  }
  getItem(key: string) {
    return this.store[key] || null
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value)
    this.syncLength()
  }

  removeItem(key: string) {
    delete this.store[key]
    this.syncLength()
  }
}

const globalStorage = new WebLocalStorage({
  // enableCache: true,
})
global.localStorage = new LocalStorageMock()

describe('localStorage', () => {
  beforeEach(() => {
    globalStorage.clearStorageSync()
  })
  test('should return null when storage not exist', () => {
    expect(globalStorage.getStorageSync('un_exist')).toBe(null)
  })

  test('should support basic type', async () => {
    const testCases = [
      ['string', 'test'],
      ['number', 123456],
      ['undefined', null], //json中没有undefined
      ['null', null],
      ['boolean', true],
      ['object', { a: 1 }],
    ] as const
    for (const [key, value] of testCases) {
      globalStorage.setStorageSync(key, value)
      expect(globalStorage.getStorageSync(key)).toEqual(value)
    }
    await globalStorage.clearStorage()
    expect(await globalStorage.getStorage('string')).toBe(null)
  })

  test('getStorageInfo', async () => {
    let res
    res = await globalStorage.getStorageInfo()
    expect(res.keys).toEqual([])
    expect(res.limitSize).toEqual(5 << 20)
    expect(res.currentSize).toEqual(0)

    await globalStorage.setStorage('test', '1234')
    await globalStorage.setStorage('test2', null)
    res = await globalStorage.getStorageInfo()

    expect(res.keys).toEqual(['test', 'test2'])
    expect(res.limitSize).toEqual(5 << 20)
    // 因为key是字符串 test value是json字符串,还要包含双引号 "1234"
    expect(res.currentSize).toEqual(38)
  })

  test('removeStorage', async () => {
    globalStorage.removeStorage('122')
    globalStorage.setStorageSync('toBeRemove', 'test')
    expect(await globalStorage.getStorage('toBeRemove')).toEqual('test')
    expect(globalStorage.Keys()).toEqual(['toBeRemove'])
    globalStorage.removeStorage('toBeRemove')
    expect(await globalStorage.getStorage('toBeRemove')).toBe(null)
    expect(globalStorage.Keys()).toEqual([])
  })

  test('缓存功能测试', async () => {
    const storage = new WebLocalStorage({ enableCache: true })
    storage.setStorageSync('cached', 'value')
    expect(storage.getStorageSync('cached')).toBe('value')
    localStorage.removeItem('cached') // 模拟外部修改
    expect(storage.getStorageSync('cached')).toBe('value') // 预期从缓存获取
  })
})
