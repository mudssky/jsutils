interface StorageInfo {
  keys: string[]
  currentSize: number
  limitSize: number
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
  getStorageInfoSync(): StorageInfo {
    const keys = []
    let currentSize = 0
    const limitSize = 5 << 20 //假设浏览器localStorage的大小为5mb
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) as string
      // 这个情况不好测试，需要执行getStorageInfoSync函数的同时删掉localStorage的键值
      /* c8 ignore next 1 */
      const value = localStorage.getItem(key) ?? ''
      console.log({ key, value })
      keys.push(key)
      currentSize += (key.length + value.length) * 2 //因为JavaScript中字符串使用UTF-16编码，每个字符占用2个字节
    }
    return {
      keys,
      currentSize,
      limitSize,
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
  clearStorageSync() {
    localStorage.clear()
  }
  removeStorageSync(key: T): void {
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
    localStorage.setItem(key, this.stringify(value))
  }
  getStorageSync(key: T) {
    const item = localStorage.getItem(key)
    // 如果setItem设置undefined，结果会返回undefined的字符串
    if (item == null || item == 'undefined') return null
    return this.parse(item)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Taro: any
/* c8 ignore start */
class TaroStorage<T extends string = string> extends AbstractStorage {
  getStorageInfoSync(): StorageInfo {
    return Taro.getStorageInfoSync()
  }

  async getStorageInfo() {
    return this.getStorageInfoSync()
  }

  async clearStorage() {
    this.clearStorageSync()
  }
  clearStorageSync() {
    Taro.clearStorageSync()
  }
  removeStorageSync(key: T): void {
    Taro.removeStorageSync(key)
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
    return Taro.getStorageSync(key)
  }
  setStorageSync(key: T, data: unknown): void {
    Taro.setStorageSync({ key, data })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const uni: any

class UniStorage<T extends string = string> extends AbstractStorage {
  getStorageInfoSync(): StorageInfo {
    return uni.getStorageInfoSync()
  }
  async getStorageInfo() {
    return this.getStorageInfoSync()
  }
  async clearStorage() {
    this.clearStorageSync()
  }
  clearStorageSync() {
    uni.clearStorageSync()
  }

  removeStorageSync(key: T): void {
    uni.removeStorageSync(key)
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
    return uni.getStorageSync(key)
  }
  setStorageSync(key: T, data: unknown): void {
    uni.setStorageSync({ key, data })
  }
}
/* c8 ignore stop */
export { AbstractStorage, TaroStorage, UniStorage, WebLocalStorage }
