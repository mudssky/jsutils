import { AbstractStorage } from '../base'
import type {
  StorageInfo,
  StorageKey,
  StorageOptions,
  StorageSchema,
} from '../types'

const WEB_STORAGE_LIMIT = 5 << 20

/**
 * Web 端 localStorage 的封装。
 * @param options - Storage 配置项。
 * @returns 无返回值。
 * @public
 */
export class WebLocalStorage<
  Schema extends StorageSchema = StorageSchema,
> extends AbstractStorage<Schema> {
  private cache = new Map<string, unknown>()
  private enableCache: boolean

  constructor(options?: StorageOptions) {
    super(options)
    this.enableCache = options?.enableCache ?? false
  }

  /**
   * 获取存储信息。
   * @param 无参数
   * @returns 存储信息摘要。
   */
  getStorageInfoSync(): StorageInfo {
    return this.buildStorageInfoFromStorage(localStorage, WEB_STORAGE_LIMIT)
  }

  /**
   * 获取当前命名空间下的 key 列表。
   * @param 无参数
   * @returns key 列表。
   */
  getKeys(): StorageKey<Schema>[] {
    return this.getScopedKeysFromStorage(localStorage)
  }

  /**
   * 兼容旧版的 key 列表方法。
   * @param 无参数
   * @returns key 列表。
   * @deprecated 使用 getKeys() 替代。
   */
  Keys(): StorageKey<Schema>[] {
    return this.getKeys()
  }

  /**
   * 同步清空存储。
   * @param 无参数
   * @returns 无返回值。
   */
  clearStorageSync(): void {
    if (this.enableCache) {
      this.cache.clear()
    }

    this.clearPrefixedStorageKeys(localStorage)
  }

  /**
   * 同步移除存储值。
   * @param key - 存储键。
   * @returns 无返回值。
   */
  removeStorageSync<Key extends StorageKey<Schema>>(key: Key): void {
    const fullKey = this.getFullKey(key)

    if (this.enableCache) {
      this.cache.delete(fullKey)
    }

    localStorage.removeItem(fullKey)
  }

  /**
   * 同步写入存储值。
   * @param key - 存储键。
   * @param value - 待写入的值。
   * @returns 无返回值。
   */
  setStorageSync<Key extends StorageKey<Schema>>(
    key: Key,
    value: Schema[Key],
  ): void {
    const fullKey = this.getFullKey(key)

    if (this.enableCache) {
      this.cache.set(fullKey, value)
    }

    localStorage.setItem(fullKey, this.stringify(value))
  }

  /**
   * 同步读取存储值。
   * @param key - 存储键。
   * @returns 对应的存储值，不存在时返回 null。
   */
  getStorageSync<Key extends StorageKey<Schema>>(key: Key): Schema[Key] | null {
    const fullKey = this.getFullKey(key)

    if (this.enableCache && this.cache.has(fullKey)) {
      return this.cache.get(fullKey) as Schema[Key]
    }

    const item = localStorage.getItem(fullKey)
    if (item == null || item === 'undefined') {
      return null
    }

    const parsed = this.parse<Schema[Key]>(item)
    if (this.enableCache && parsed !== null) {
      this.cache.set(fullKey, parsed)
    }

    return parsed
  }
}
