interface StorageInfo {
  keys: string[]
  currentSize: number
  limitSize: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cacheInfo?: any
}

interface StorageOptions {
  /**
   * 全局key前缀
   */
  prefix?: string
  /**
   * 是否启用缓存
   */
  enableCache?: boolean
}
/**
 * Storage抽象类，提供小程序和web平台统一的接口实现。
 */
abstract class AbstractStorage<T extends string = string> {
  protected prefix: string

  constructor(options?: StorageOptions) {
    this.prefix = options?.prefix || ''
  }

  /**
   * 获取带前缀的完整key
   */
  protected getFullKey(key: T): string {
    return this.prefix ? `${this.prefix}${key}` : key
  }

  /**
   * 从完整key中移除前缀
   */
  protected removePrefix(fullKey: string): string {
    if (this.prefix && fullKey.startsWith(this.prefix)) {
      return fullKey.slice(this.prefix.length)
    }
    return fullKey
  }

  abstract getStorageSync(key: T): unknown
  abstract getStorage(key: T): Promise<unknown>
  abstract setStorageSync(key: T, value: unknown): void
  abstract setStorage(key: T, value: unknown): Promise<void>
  abstract removeStorageSync(key: T): void
  abstract removeStorage(key: T): Promise<void>
  abstract clearStorage(): Promise<void>
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
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
}
/**
 * web端 localStorage的封装
 */
class WebLocalStorage<T extends string = string> extends AbstractStorage<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache = new Map<string, any>()
  private enableCache: boolean

  constructor(options?: StorageOptions) {
    super(options)
    const { enableCache = false } = options || {}
    this.enableCache = enableCache
  }
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
  getStorageInfoSync(): StorageInfo {
    const keys = []
    let currentSize = 0
    const limitSize = 5 << 20 //假设浏览器localStorage的大小为5mb
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i) as string
      // 只统计带有当前前缀的key
      if (!this.prefix || fullKey.startsWith(this.prefix)) {
        // 这个情况不好测试，需要执行getStorageInfoSync函数的同时删掉localStorage的键值
        /* c8 ignore next 1 */
        const value = localStorage.getItem(fullKey) ?? ''
        keys.push(this.removePrefix(fullKey))
        currentSize += (fullKey.length + value.length) * 2 //因为JavaScript中字符串使用UTF-16编码，每个字符占用2个字节
      }
    }
    const cacheInfo = this.cache.entries()

    return {
      keys,
      currentSize,
      limitSize,
      cacheInfo,
    }
  }
  /**
   * @deprecated 使用 getKeys() 替代
   */
  Keys() {
    return this.getKeys()
  }

  getKeys() {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i) as string
      if (!this.prefix || fullKey.startsWith(this.prefix)) {
        keys.push(this.removePrefix(fullKey))
      }
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
    const fullKey = this.getFullKey(key)
    if (this.enableCache) {
      this.cache.delete(fullKey)
    }
    localStorage.removeItem(fullKey)
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
    const fullKey = this.getFullKey(key)
    if (this.enableCache) {
      this.cache.set(fullKey, value)
    }
    localStorage.setItem(fullKey, this.stringify(value))
  }
  getStorageSync(key: T) {
    const fullKey = this.getFullKey(key)
    if (this.enableCache && this.cache.has(fullKey)) {
      return this.cache.get(fullKey)
    }
    const item = localStorage.getItem(fullKey)
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
