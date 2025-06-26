import { beforeEach, describe, expect, test } from 'vitest'
import { WebLocalStorage, WebSessionStorage } from '../src/modules/storage'

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
    globalStorage.removeStorage('toBeRemove')
    expect(await globalStorage.getStorage('toBeRemove')).toBe(null)
  })

  test('cache', () => {
    const storage = new WebLocalStorage({ enableCache: true })
    storage.setStorageSync('cached', 'value')
    expect(storage.getStorageSync('cached')).toBe('value')
    localStorage.removeItem('cached') // 模拟外部修改
    expect(storage.getStorageSync('cached')).toBe('value') // 预期从缓存获取
  })

  test('should handle JSON parse errors gracefully', () => {
    // 直接在localStorage中设置无效的JSON
    localStorage.setItem('invalid_json', 'invalid json string')

    // 应该返回null而不是抛出异常
    expect(globalStorage.getStorageSync('invalid_json')).toBe(null)
  })

  test('should handle undefined and null values correctly', () => {
    globalStorage.setStorageSync('undefined_test', undefined)
    globalStorage.setStorageSync('null_test', null)

    expect(globalStorage.getStorageSync('undefined_test')).toBe(null)
    expect(globalStorage.getStorageSync('null_test')).toBe(null)
  })
})

describe('localStorage with prefix', () => {
  let prefixStorage: WebLocalStorage<string>

  beforeEach(() => {
    localStorage.clear()
    prefixStorage = new WebLocalStorage({ prefix: 'app_' })
  })

  test('should add prefix to keys', () => {
    prefixStorage.setStorageSync('user', 'john')
    prefixStorage.setStorageSync('token', 'abc123')

    // 检查实际存储的key带有前缀
    expect(localStorage.getItem('app_user')).toBe('"john"')
    expect(localStorage.getItem('app_token')).toBe('"abc123"')

    // 检查通过storage获取时不需要前缀
    expect(prefixStorage.getStorageSync('user')).toBe('john')
    expect(prefixStorage.getStorageSync('token')).toBe('abc123')
  })

  test('should filter keys by prefix in getStorageInfo', async () => {
    // 添加带前缀的数据
    prefixStorage.setStorageSync('user', 'john')
    prefixStorage.setStorageSync('config', { theme: 'dark' })

    // 添加不带前缀的数据
    localStorage.setItem('other_data', 'value')

    const info = await prefixStorage.getStorageInfo()
    expect(info.keys).toEqual(['user', 'config'])
    expect(info.keys).not.toContain('other_data')
  })

  test('should remove items with prefix', () => {
    prefixStorage.setStorageSync('temp', 'temporary')
    expect(prefixStorage.getStorageSync('temp')).toBe('temporary')

    prefixStorage.removeStorageSync('temp')
    expect(prefixStorage.getStorageSync('temp')).toBe(null)
    expect(localStorage.getItem('app_temp')).toBe(null)
  })

  test('should work with cache and prefix', () => {
    const cachedPrefixStorage = new WebLocalStorage({
      prefix: 'cache_',
      enableCache: true,
    })

    cachedPrefixStorage.setStorageSync('data', 'cached_value')
    expect(cachedPrefixStorage.getStorageSync('data')).toBe('cached_value')

    // 直接删除localStorage中的数据，但缓存中应该还有
    localStorage.removeItem('cache_data')
    expect(cachedPrefixStorage.getStorageSync('data')).toBe('cached_value')
  })

  test('should handle empty prefix', () => {
    const noPrefixStorage = new WebLocalStorage({ prefix: '' })
    noPrefixStorage.setStorageSync('test', 'value')

    expect(localStorage.getItem('test')).toBe('"value"')
    expect(noPrefixStorage.getStorageSync('test')).toBe('value')
  })

  test('should handle undefined prefix', () => {
    const undefinedPrefixStorage = new WebLocalStorage({})
    undefinedPrefixStorage.setStorageSync('test', 'value')

    expect(localStorage.getItem('test')).toBe('"value"')
    expect(undefinedPrefixStorage.getStorageSync('test')).toBe('value')
  })

  test('should calculate correct size with prefix', async () => {
    prefixStorage.setStorageSync('key1', 'value1')
    prefixStorage.setStorageSync('key2', 'value2')

    // 添加其他前缀的数据
    localStorage.setItem('other_key', 'other_value')

    const info = await prefixStorage.getStorageInfo()
    // 应该只计算带有当前前缀的数据大小
    expect(info.currentSize).toBeGreaterThan(0)
    expect(info.keys).toEqual(['key1', 'key2'])
  })
})

class SessionStorageMock {
  store: { [k: string]: string }
  length: number

  constructor() {
    this.store = {}
    this.length = 0
  }

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

const globalSessionStorage = new WebSessionStorage({
  enableCache: true,
})
const prefixSessionStorage = new WebSessionStorage({
  prefix: 'test_',
  enableCache: true,
})

global.sessionStorage = new SessionStorageMock()

describe('sessionStorage', () => {
  beforeEach(() => {
    globalSessionStorage.clearStorageSync()
    prefixSessionStorage.clearStorageSync()
  })

  test('should return null when storage not exist', () => {
    expect(globalSessionStorage.getStorageSync('un_exist')).toBe(null)
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
      globalSessionStorage.setStorageSync(key, value)
      expect(globalSessionStorage.getStorageSync(key)).toEqual(value)
    }
    await globalSessionStorage.clearStorage()
    expect(await globalSessionStorage.getStorage('string')).toBe(null)
  })

  test('getStorageInfo', async () => {
    let res
    res = await globalSessionStorage.getStorageInfo()
    expect(res.keys).toEqual([])
    expect(res.limitSize).toEqual(5 << 20)
    expect(res.currentSize).toEqual(0)

    await globalSessionStorage.setStorage('test', '1234')
    await globalSessionStorage.setStorage('test2', null)
    res = await globalSessionStorage.getStorageInfo()

    expect(res.keys).toEqual(['test', 'test2'])
    expect(res.limitSize).toEqual(5 << 20)
    expect(res.currentSize).toEqual(38)
  })

  test('removeStorage', async () => {
    globalSessionStorage.removeStorage('122')
    globalSessionStorage.setStorageSync('toBeRemove', 'test')
    expect(await globalSessionStorage.getStorage('toBeRemove')).toEqual('test')
    globalSessionStorage.removeStorage('toBeRemove')
    expect(await globalSessionStorage.getStorage('toBeRemove')).toBe(null)
  })

  test('should work with prefix', () => {
    prefixSessionStorage.setStorageSync('data', 'test_value')
    expect(sessionStorage.getItem('test_data')).toBe('"test_value"')
    expect(prefixSessionStorage.getStorageSync('data')).toBe('test_value')
  })

  test('should handle cache correctly', () => {
    const cachedSessionStorage = new WebSessionStorage({
      prefix: 'cache_',
      enableCache: true,
    })

    cachedSessionStorage.setStorageSync('data', 'cached_value')
    expect(cachedSessionStorage.getStorageSync('data')).toBe('cached_value')

    // 直接从sessionStorage删除，但缓存中还有
    sessionStorage.removeItem('cache_data')
    expect(cachedSessionStorage.getStorageSync('data')).toBe('cached_value')
  })

  test('should sync to localStorage', () => {
    globalSessionStorage.setStorageSync('sync_test', 'sync_value')
    globalSessionStorage.syncToLocalStorage(['sync_test'])
    expect(localStorage.getItem('sync_test')).toBe('"sync_value"')
  })

  test('should restore from localStorage', () => {
    localStorage.setItem('restore_test', '"restore_value"')
    globalSessionStorage.restoreFromLocalStorage(['restore_test'])
    expect(globalSessionStorage.getStorageSync('restore_test')).toBe(
      'restore_value',
    )
  })

  test('should create and restore snapshot', () => {
    const state = { user: 'test', page: 1 }
    globalSessionStorage.createSnapshot('test_snapshot', state)

    const restored = globalSessionStorage.restoreSnapshot('test_snapshot')
    expect(restored).toMatchObject(state)
    expect(restored).toHaveProperty('timestamp')
  })

  test('should clean expired snapshots', () => {
    // 创建一个过期的快照
    const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000 // 25小时前
    globalSessionStorage.setStorageSync('snapshot_old', {
      data: 'old',
      timestamp: oldTimestamp,
    })

    // 创建一个未过期的快照
    globalSessionStorage.createSnapshot('new', { data: 'new' })

    globalSessionStorage.cleanExpiredSnapshots(24 * 60 * 60 * 1000) // 24小时

    expect(globalSessionStorage.getStorageSync('snapshot_old')).toBe(null)
    expect(globalSessionStorage.getStorageSync('snapshot_new')).not.toBe(null)
  })

  // test('should handle quota exceeded', () => {
  //   const mockSessionStorage = {
  //     setItem: vi.fn().mockImplementation(() => {
  //       throw new Error('QuotaExceededError')
  //     }),
  //     getItem: vi.fn().mockReturnValue(null),
  //     removeItem: vi.fn(),
  //     clear: vi.fn(),
  //     length: 0,
  //     key: vi.fn()
  //   }

  //   global.sessionStorage = mockSessionStorage as any

  //   expect(() => {
  //     globalSessionStorage.setStorageSync('test', 'value')
  //   }).toThrow()
  // })
})
