import { isBrowser } from '../../env'
import { AbstractStorage } from '../base'
import type {
  StorageInfo,
  StorageKey,
  StorageOptions,
  StorageSchema,
} from '../types'

const WEB_STORAGE_LIMIT = 5 << 20

/**
 * Web 端 sessionStorage 的封装。
 * @param options - Storage 配置项。
 * @returns 无返回值。
 * @public
 */
export class WebSessionStorage<
  Schema extends StorageSchema = StorageSchema,
> extends AbstractStorage<Schema> {
  private cache = new Map<string, unknown>()
  private enableCache: boolean

  constructor(options?: StorageOptions) {
    super(options)
    this.enableCache = options?.enableCache ?? true
    this.setupSessionListeners()
  }

  /**
   * 绑定 sessionStorage 事件监听。
   * @returns 无返回值。
   */
  private setupSessionListeners(): void {
    if (!isBrowser()) {
      return
    }

    window.addEventListener('beforeunload', () => {
      if (this.enableCache) {
        this.cache.clear()
      }
    })

    window.addEventListener('storage', (event) => {
      if (event.storageArea !== sessionStorage || !this.enableCache) {
        return
      }

      const fullKey = event.key
      if (!fullKey || !this.isScopedKey(fullKey)) {
        return
      }

      if (event.newValue === null) {
        this.cache.delete(fullKey)
        return
      }

      const parsed = this.parse(event.newValue)
      if (parsed !== null) {
        this.cache.set(fullKey, parsed)
      }
    })
  }

  /**
   * 获取存储信息。
   * @returns 存储信息摘要。
   */
  getStorageInfoSync(): StorageInfo {
    return this.buildStorageInfoFromStorage(sessionStorage, WEB_STORAGE_LIMIT)
  }

  /**
   * 获取当前命名空间下的 key 列表。
   * @returns key 列表。
   */
  getKeys(): StorageKey<Schema>[] {
    return this.getScopedKeysFromStorage(sessionStorage)
  }

  /**
   * 同步清空存储。
   * @returns 无返回值。
   */
  clearStorageSync(): void {
    if (this.enableCache) {
      this.cache.clear()
    }

    this.clearPrefixedStorageKeys(sessionStorage)
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

    sessionStorage.removeItem(fullKey)
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

    try {
      sessionStorage.setItem(fullKey, this.stringify(value))
    } catch {
      this.handleQuotaExceeded(fullKey, value)
    }
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

    const item = sessionStorage.getItem(fullKey)
    if (item == null || item === 'undefined') {
      return null
    }

    const parsed = this.parse<Schema[Key]>(item)
    if (this.enableCache && parsed !== null) {
      this.cache.set(fullKey, parsed)
    }

    return parsed
  }

  /**
   * 处理存储空间不足时的重试逻辑。
   * @param fullKey - 完整存储键。
   * @param value - 待写入的值。
   * @returns 无返回值。
   */
  private handleQuotaExceeded(fullKey: string, value: unknown): void {
    if (this.enableCache) {
      this.cache.clear()
    }

    sessionStorage.setItem(fullKey, this.stringify(value))

    if (this.enableCache) {
      this.cache.set(fullKey, value)
    }
  }
}
