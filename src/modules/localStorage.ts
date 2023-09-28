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
  abstract getStorageInfoSync(): StorageInfo
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
      const value = localStorage.getItem(key) ?? ''
      keys.push(key)
      currentSize += (key.length + value.length) * 2 //因为JavaScript中字符串使用UTF-16编码，每个字符占用2个字节
    }
    return {
      keys,
      currentSize,
      limitSize,
    }
  }
  getAllLocalStorageKeys() {
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
    const item = localStorage.getItem(key) ?? ''
    return this.parse(item)
  }
  // removeStorage(key: string): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     let res
  //     try {
  //       this.removeStorageSync(key)
  //     } catch (e) {
  //       reject(e)
  //     }
  //     resolve(res)
  //   })
  // }
  // getStorage(key: T): Promise<unknown> {
  //   return new Promise((resolve, reject) => {
  //     let res
  //     try {
  //       this.getStorageSync(key)
  //     } catch (e) {
  //       reject(e)
  //     }
  //     resolve(res)
  //   })
  // }
  // setStorage(key: T, value: unknown): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       this.setStorageSync(key, value)
  //     } catch (e) {
  //       reject(e)
  //     }
  //     resolve()
  //   })
  // }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Taro: any
class TaroStorage<T extends string = string> extends AbstractStorage {
  getStorageInfoSync(): StorageInfo {
    throw new Error('Method not implemented.')
  }
  getStorageInfo(): Promise<StorageInfo> {
    throw new Error('Method not implemented.')
  }
  clearStorage(key: T): Promise<void> {
    return Taro.clearStorage(key)
  }
  clearStorageSync(key: T) {
    Taro.clearStorageSync(key)
  }
  removeStorageSync(key: T): void {
    Taro.removeStorageSync(key)
  }
  removeStorage(key: T): Promise<void> {
    return Taro.removeStorage(key)
  }
  getStorage(key: T): Promise<unknown> {
    return Taro.getStorage(key)
  }
  setStorage(key: T, value: unknown): Promise<void> {
    return Taro.setStorage(key, value)
  }
  getStorageSync(key: T): unknown {
    return Taro.getStorageSync(key)
  }
  setStorageSync(key: T, value: unknown): void {
    Taro.setStorageSync(key, value)
  }
}

export { AbstractStorage, TaroStorage, WebLocalStorage }
