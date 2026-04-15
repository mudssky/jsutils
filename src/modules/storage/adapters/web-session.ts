import { isBrowser, isDocumentAvailable } from '../../env'
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
   * @param 无参数
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
   * @param 无参数
   * @returns 存储信息摘要。
   */
  getStorageInfoSync(): StorageInfo {
    return this.buildStorageInfoFromStorage(sessionStorage, WEB_STORAGE_LIMIT)
  }

  /**
   * 获取当前命名空间下的 key 列表。
   * @param 无参数
   * @returns key 列表。
   */
  getKeys(): StorageKey<Schema>[] {
    return this.getScopedKeysFromStorage(sessionStorage)
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

  /**
   * 将 sessionStorage 数据同步到 localStorage。
   * @param keys - 需要同步的键列表，缺省时同步当前命名空间全部键。
   * @returns 无返回值。
   */
  syncToLocalStorage(keys?: StorageKey<Schema>[]): void {
    const keysToSync = keys ?? this.getKeys()

    for (const key of keysToSync) {
      const value = this.getStorageSync(key)
      if (value !== null) {
        localStorage.setItem(this.getFullKey(key), this.stringify(value))
      }
    }
  }

  /**
   * 从 localStorage 恢复数据到 sessionStorage。
   * @param keys - 需要恢复的键列表，缺省时恢复当前命名空间全部键。
   * @returns 无返回值。
   */
  restoreFromLocalStorage(keys?: StorageKey<Schema>[]): void {
    const keysToRestore = keys ?? this.getScopedKeysFromStorage(localStorage)

    for (const key of keysToRestore) {
      const value = localStorage.getItem(this.getFullKey(key))
      if (value == null || value === 'undefined') {
        continue
      }

      const parsed = this.parse<Schema[typeof key]>(value)
      if (parsed !== null || value === 'null') {
        this.setStorageSync(key, parsed as Schema[typeof key])
      }
    }
  }

  /**
   * 自动保存表单数据。
   * @param formId - 表单元素 id。
   * @param interval - 自动保存间隔，单位毫秒。
   * @returns 取消监听的函数。
   */
  autoSaveForm(formId: string, interval: number = 5000): () => void {
    if (!isBrowser() || !isDocumentAvailable()) {
      // eslint-disable-next-line no-console
      console.warn('autoSaveForm is only available in browser environment')
      return () => {}
    }

    const form = document.getElementById(formId) as HTMLFormElement | null
    if (!form) {
      // eslint-disable-next-line no-console
      console.warn(`Form with id '${formId}' not found`)
      return () => {}
    }

    /**
     * 保存表单数据到 sessionStorage。
     * @param 无参数
     * @returns 无返回值。
     */
    const saveFormData = () => {
      const formData = new FormData(form)
      const data = Object.fromEntries(formData.entries())

      this.setStorageSync(
        `form_${formId}` as StorageKey<Schema>,
        data as Schema[StorageKey<Schema>],
      )
    }

    const timer = setInterval(saveFormData, interval)
    const handleBeforeUnload = () => saveFormData()
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(timer)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }

  /**
   * 创建页面状态快照。
   * @param snapshotId - 快照 id。
   * @param state - 状态对象。
   * @returns 无返回值。
   */
  createSnapshot(snapshotId: string, state: Record<string, unknown>): void {
    this.setStorageSync(
      `snapshot_${snapshotId}` as StorageKey<Schema>,
      {
        ...state,
        timestamp: Date.now(),
      } as Schema[StorageKey<Schema>],
    )
  }

  /**
   * 恢复页面状态快照。
   * @param snapshotId - 快照 id。
   * @returns 快照内容，不存在时返回 null。
   */
  restoreSnapshot(snapshotId: string): unknown {
    return this.getStorageSync(`snapshot_${snapshotId}` as StorageKey<Schema>)
  }

  /**
   * 清理过期快照数据。
   * @param maxAge - 快照最大保留时长，单位毫秒。
   * @returns 无返回值。
   */
  cleanExpiredSnapshots(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now()

    for (const key of this.getKeys()) {
      if (!key.startsWith('snapshot_')) {
        continue
      }

      const data = this.getStorageSync(key)
      if (data && typeof data === 'object' && 'timestamp' in data) {
        const timestamp = (data as { timestamp: number }).timestamp
        if (now - timestamp > maxAge) {
          this.removeStorageSync(key)
        }
      }
    }
  }
}
