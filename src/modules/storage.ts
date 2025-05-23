interface StorageInfo {
  keys: string[]
  currentSize: number
  limitSize: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cacheInfo?: any
}
/**
 * Storage抽象类，提供小程序和web平台统一的接口实现。
 */
abstract class AbstractStorage<T extends string = string> {
  abstract getStorageSync(key: T): unknown
  abstract getStorage(key: T): Promise<unknown>
  abstract setStorageSync(key: T, value: unknown): void
  abstract setStorage(key: T, value: unknown): Promise<void>
  abstract removeStorageSync(key: T): void
  abstract removeStorage(key: T): Promise<void>
  abstract clearStorage(key: T): Promise<void>
  /**
   * 获取存储相关信息
   */
  abstract getStorageInfoSync(): StorageInfo

  /**
   * 获取存储相关信息异步
   */
  abstract getStorageInfo(): Promise<StorageInfo>
  stringify(value: unknown) {
    return JSON.stringify(value)
  }
  parse(value: string) {
    return JSON.parse(value)
  }
}
/**
 * web端 localStorage的封装
 */
class WebLocalStorage<T extends string = string> extends AbstractStorage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache = new Map<T, any>()
  private enableCache: boolean
  constructor(options?: { enableCache?: boolean }) {
    super()
    const { enableCache = false } = options || {}
    this.enableCache = enableCache
  }
  getStorageInfoSync(): StorageInfo {
    const keys = []
    let currentSize = 0
    const limitSize = 5 << 20 //假设浏览器localStorage的大小为5mb
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) as string
      // 这个情况不好测试，需要执行getStorageInfoSync函数的同时删掉localStorage的键值
      /* c8 ignore next 1 */
      const value = localStorage.getItem(key) ?? ''
      keys.push(key)
      currentSize += (key.length + value.length) * 2 //因为JavaScript中字符串使用UTF-16编码，每个字符占用2个字节
    }
    const cacheInfo = this.cache.entries()

    return {
      keys,
      currentSize,
      limitSize,
      cacheInfo,
    }
  }
  Keys() {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i) as string)
    }
    return keys
  }
  async getStorageInfo() {
    return this.getStorageInfoSync()
  }

  async clearStorage() {
    this.clearStorageSync()
  }
  /**
   * 清理localStorage，并清理缓存
   */
  clearStorageSync() {
    if (this.enableCache) {
      this.cache.clear()
    }
    localStorage.clear()
  }
  removeStorageSync(key: T): void {
    if (this.cache) {
      this.cache.delete(key)
    }
    localStorage.removeItem(key)
  }
  async removeStorage(key: T) {
    this.removeStorageSync(key)
  }
  async setStorage(key: T, value: unknown) {
    this.setStorageSync(key, value)
  }
  async getStorage(key: T) {
    return this.getStorageSync(key)
  }

  setStorageSync(key: T, value: unknown): void {
    if (this.enableCache) {
      this.cache.set(key, value)
    }
    localStorage.setItem(key, this.stringify(value))
  }
  getStorageSync(key: T) {
    if (this.enableCache && this.cache.has(key)) {
      return this.cache.get(key)
    }
    const item = localStorage.getItem(key)
    // 如果setItem设置undefined，结果会返回undefined的字符串
    if (item == null || item == 'undefined') return null
    return this.parse(item)
  }
}

/**
 * 对Taro的Storage API进行封装，主要是为了提供ts类型提示。
 * @example
 * import { TaroStorage } from '@mudssky/jsutils'

import {
  clearStorageSync,
  getStorageInfoSync,
  getStorageSync,
  removeStorageSync,
  setStorageSync,
} from '@tarojs/taro'

export type StorageKey = 'USERINFO'

export const GlobalStorage = new TaroStorage<StorageKey>({
  getStorageSync,
  setStorageSync,
  clearStorageSync,
  removeStorageSync,
  getStorageInfoSync,
})

 */
class TaroStorage<T extends string = string> extends AbstractStorage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(public Taro: any) {
    super()
  }
  getStorageInfoSync(): StorageInfo {
    return this.Taro.getStorageInfoSync()
  }

  async getStorageInfo() {
    return this.getStorageInfoSync()
  }

  async clearStorage() {
    this.clearStorageSync()
  }
  clearStorageSync() {
    this.Taro.clearStorageSync()
  }
  removeStorageSync(key: T): void {
    this.Taro.removeStorageSync(key)
  }
  async removeStorage(key: T) {
    this.removeStorageSync(key)
  }
  async getStorage(key: T) {
    return this.getStorageSync(key)
  }
  async setStorage(key: T, data: unknown) {
    this.setStorageSync(key, data)
  }
  getStorageSync(key: T): unknown {
    return this.Taro.getStorageSync(key)
  }
  setStorageSync(key: T, data: unknown): void {
    this.Taro.setStorageSync(key, data)
  }
}

/**
 * 对uniapp的Storage API进行封装，主要是为了提供ts类型提示。
 * @example
 * import { UniStorage } from '@mudssky/jsutils'

export type GlobalStorageKey = 'userId'

export const GlobalStorage = new UniStorage<GlobalStorageKey>({
  getStorageSync: uni.getStorageSync,
  setStorageSync: uni.setStorageSync,
  clearStorageSync: uni.clearStorageSync,
  removeStorageSync: uni.removeStorageSync,
  getStorageInfoSync: uni.getStorageInfoSync,
})

 */
class UniStorage<T extends string = string> extends AbstractStorage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(public Uni: any) {
    super()
  }
  getStorageInfoSync(): StorageInfo {
    return this.Uni.getStorageInfoSync()
  }
  async getStorageInfo() {
    return this.getStorageInfoSync()
  }
  async clearStorage() {
    this.clearStorageSync()
  }
  clearStorageSync() {
    this.Uni.clearStorageSync()
  }

  removeStorageSync(key: T): void {
    this.Uni.removeStorageSync(key)
  }

  async removeStorage(key: T) {
    this.removeStorageSync(key)
  }

  async getStorage(key: T) {
    return this.getStorageSync(key)
  }
  async setStorage(key: T, data: unknown) {
    this.setStorageSync(key, data)
  }
  getStorageSync(key: T): unknown {
    return this.Uni.getStorageSync(key)
  }
  setStorageSync(key: T, data: unknown): void {
    this.Uni.setStorageSync(key, data)
  }
}

export { AbstractStorage, TaroStorage, UniStorage, WebLocalStorage }
