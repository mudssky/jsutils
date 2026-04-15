/**
 * Storage schema 类型。
 * @public
 */
export type StorageSchema = Record<string, unknown>

/**
 * 从 schema 中提取可用的存储键类型。
 * @public
 */
export type StorageKey<Schema extends StorageSchema> = keyof Schema & string

/**
 * 通用键值存储适配接口。
 * @public
 */
export interface StorageLike {
  length: number
  key(index: number): string | null
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}

/**
 * 存储信息摘要。
 * @public
 */
export interface StorageInfo {
  keys: string[]
  currentSize: number
  limitSize: number
}

/**
 * Storage 通用配置。
 * @public
 */
export interface StorageOptions {
  /**
   * 全局 key 前缀。
   */
  prefix?: string
  /**
   * 是否启用缓存。
   */
  enableCache?: boolean
}

/**
 * 小程序存储桥接接口。
 * @public
 */
export interface NativeStorageBridge {
  /**
   * 同步读取存储值。
   * @param key - 存储键。
   * @returns 对应的存储值。
   */
  getStorageSync(key: string): unknown
  /**
   * 同步写入存储值。
   * @param key - 存储键。
   * @param data - 待写入的值。
   * @returns 无返回值。
   */
  setStorageSync(key: string, data: unknown): void
  /**
   * 同步清空存储。
   * @returns 无返回值。
   */
  clearStorageSync(): void
  /**
   * 同步移除存储键。
   * @param key - 存储键。
   * @returns 无返回值。
   */
  removeStorageSync(key: string): void
  /**
   * 获取存储信息。
   * @returns 存储信息摘要。
   */
  getStorageInfoSync(): StorageInfo
}
