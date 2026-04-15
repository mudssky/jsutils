import type {
  StorageInfo,
  StorageKey,
  StorageLike,
  StorageOptions,
  StorageSchema,
} from './types'

/**
 * Storage 抽象基类。
 * @param options - Storage 配置项。
 * @returns 无返回值。
 * @public
 */
export abstract class AbstractStorage<
  Schema extends StorageSchema = StorageSchema,
> {
  protected prefix: string

  constructor(options?: StorageOptions) {
    this.prefix = options?.prefix ?? ''
  }

  /**
   * 获取带前缀的完整 key。
   * @param key - 原始存储键。
   * @returns 带前缀的完整 key。
   */
  protected getFullKey<Key extends StorageKey<Schema>>(key: Key): string {
    return this.prefix ? `${this.prefix}${key}` : key
  }

  /**
   * 从完整 key 中移除前缀。
   * @param fullKey - 完整存储键。
   * @returns 移除前缀后的 key。
   */
  protected removePrefix(fullKey: string): string {
    if (this.prefix && fullKey.startsWith(this.prefix)) {
      return fullKey.slice(this.prefix.length)
    }

    return fullKey
  }

  /**
   * 判断 key 是否属于当前命名空间。
   * @param fullKey - 完整存储键。
   * @returns 是否属于当前命名空间。
   */
  protected isScopedKey(fullKey: string): boolean {
    return !this.prefix || fullKey.startsWith(this.prefix)
  }

  /**
   * 获取当前命名空间下的完整 key 列表。
   * @param storage - 存储适配器。
   * @returns 完整 key 列表。
   */
  protected getScopedFullKeysFromStorage(storage: StorageLike): string[] {
    const keys: string[] = []

    for (let i = 0; i < storage.length; i++) {
      const fullKey = storage.key(i)
      if (fullKey && this.isScopedKey(fullKey)) {
        keys.push(fullKey)
      }
    }

    return keys
  }

  /**
   * 获取当前命名空间下的逻辑 key 列表。
   * @param storage - 存储适配器。
   * @returns 逻辑 key 列表。
   */
  protected getScopedKeysFromStorage(
    storage: StorageLike,
  ): StorageKey<Schema>[] {
    return this.getScopedFullKeysFromStorage(storage).map((fullKey) => {
      return this.removePrefix(fullKey) as StorageKey<Schema>
    })
  }

  /**
   * 按完整 key 列表构建存储信息。
   * @param fullKeys - 完整 key 列表。
   * @param getSerializedValue - 获取序列化值的回调。
   * @param limitSize - 存储上限。
   * @returns 存储信息摘要。
   */
  protected buildStorageInfo(
    fullKeys: string[],
    getSerializedValue: (fullKey: string) => string,
    limitSize: number,
  ): StorageInfo {
    let currentSize = 0

    for (const fullKey of fullKeys) {
      currentSize += (fullKey.length + getSerializedValue(fullKey).length) * 2
    }

    return {
      keys: fullKeys.map((fullKey) => this.removePrefix(fullKey)),
      currentSize,
      limitSize,
    }
  }

  /**
   * 基于 Web Storage 构建存储信息。
   * @param storage - Web Storage 适配器。
   * @param limitSize - 存储上限。
   * @returns 存储信息摘要。
   */
  protected buildStorageInfoFromStorage(
    storage: StorageLike,
    limitSize: number,
  ): StorageInfo {
    const fullKeys = this.getScopedFullKeysFromStorage(storage)

    return this.buildStorageInfo(
      fullKeys,
      (fullKey) => storage.getItem(fullKey) ?? '',
      limitSize,
    )
  }

  /**
   * 按当前实例的命名空间清理存储区键值。
   * @param storage - 要清理的存储适配器。
   * @returns 无返回值。
   */
  protected clearPrefixedStorageKeys(storage: StorageLike): void {
    if (!this.prefix) {
      storage.clear()
      return
    }

    const keysToRemove = this.getScopedFullKeysFromStorage(storage)
    for (const key of keysToRemove) {
      storage.removeItem(key)
    }
  }

  /**
   * 将值序列化为字符串。
   * @param value - 待序列化的值。
   * @returns 序列化后的字符串。
   */
  protected stringify(value: unknown): string {
    return JSON.stringify(value) ?? 'undefined'
  }

  /**
   * 将字符串反序列化为值。
   * @param value - 待反序列化的字符串。
   * @returns 反序列化后的值，失败时返回 null。
   */
  protected parse<T>(value: string): T | null {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  /**
   * 异步读取存储值。
   * @param key - 存储键。
   * @returns 对应的存储值，不存在时返回 null。
   */
  async getStorage<Key extends StorageKey<Schema>>(
    key: Key,
  ): Promise<Schema[Key] | null> {
    return this.getStorageSync(key)
  }

  /**
   * 异步写入存储值。
   * @param key - 存储键。
   * @param value - 待写入的值。
   * @returns 无返回值。
   */
  async setStorage<Key extends StorageKey<Schema>>(
    key: Key,
    value: Schema[Key],
  ): Promise<void> {
    this.setStorageSync(key, value)
  }

  /**
   * 异步移除存储值。
   * @param key - 存储键。
   * @returns 无返回值。
   */
  async removeStorage<Key extends StorageKey<Schema>>(key: Key): Promise<void> {
    this.removeStorageSync(key)
  }

  /**
   * 异步清空存储。
   * @param 无参数
   * @returns 无返回值。
   */
  async clearStorage(): Promise<void> {
    this.clearStorageSync()
  }

  /**
   * 异步获取存储信息。
   * @param 无参数
   * @returns 存储信息摘要。
   */
  async getStorageInfo(): Promise<StorageInfo> {
    return this.getStorageInfoSync()
  }

  /**
   * 获取当前命名空间下的 key 列表。
   * @param 无参数
   * @returns key 列表。
   */
  abstract getKeys(): StorageKey<Schema>[]
  /**
   * 同步读取存储值。
   * @param key - 存储键。
   * @returns 对应的存储值，不存在时返回 null。
   */
  abstract getStorageSync<Key extends StorageKey<Schema>>(
    key: Key,
  ): Schema[Key] | null
  /**
   * 同步写入存储值。
   * @param key - 存储键。
   * @param value - 待写入的值。
   * @returns 无返回值。
   */
  abstract setStorageSync<Key extends StorageKey<Schema>>(
    key: Key,
    value: Schema[Key],
  ): void
  /**
   * 同步移除存储值。
   * @param key - 存储键。
   * @returns 无返回值。
   */
  abstract removeStorageSync<Key extends StorageKey<Schema>>(key: Key): void
  /**
   * 同步清空存储。
   * @param 无参数
   * @returns 无返回值。
   */
  abstract clearStorageSync(): void
  /**
   * 同步获取存储信息。
   * @param 无参数
   * @returns 存储信息摘要。
   */
  abstract getStorageInfoSync(): StorageInfo
}
