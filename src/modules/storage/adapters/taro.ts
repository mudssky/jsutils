import { AbstractStorage } from '../base'
import type {
  NativeStorageBridge,
  StorageInfo,
  StorageKey,
  StorageOptions,
  StorageSchema,
} from '../types'

/**
 * 对 Taro 的 Storage API 进行封装，提供统一的类型化存储接口。
 * @param Taro - Taro Storage 桥接对象。
 * @param options - Storage 配置项。
 * @returns 无返回值。
 * @public
 */
export class TaroStorage<
  Schema extends StorageSchema = StorageSchema,
> extends AbstractStorage<Schema> {
  constructor(
    public Taro: NativeStorageBridge,
    options?: StorageOptions,
  ) {
    super(options)
  }

  /**
   * 获取当前命名空间下的 key 列表。
   * @returns key 列表。
   */
  getKeys(): StorageKey<Schema>[] {
    const { keys = [] } = this.Taro.getStorageInfoSync()

    return keys
      .filter((fullKey) => this.isScopedKey(fullKey))
      .map((fullKey) => this.removePrefix(fullKey) as StorageKey<Schema>)
  }

  /**
   * 同步获取存储信息。
   * @returns 存储信息摘要。
   */
  getStorageInfoSync(): StorageInfo {
    const nativeInfo = this.Taro.getStorageInfoSync()
    const fullKeys = (nativeInfo.keys ?? []).filter((fullKey) => {
      return this.isScopedKey(fullKey)
    })

    return this.buildStorageInfo(
      fullKeys,
      (fullKey) => this.stringify(this.Taro.getStorageSync(fullKey)),
      nativeInfo.limitSize,
    )
  }

  /**
   * 同步清空存储。
   * @returns 无返回值。
   */
  clearStorageSync(): void {
    if (!this.prefix) {
      this.Taro.clearStorageSync()
      return
    }

    for (const key of this.getKeys()) {
      this.removeStorageSync(key)
    }
  }

  /**
   * 同步移除存储值。
   * @param key - 存储键。
   * @returns 无返回值。
   */
  removeStorageSync<Key extends StorageKey<Schema>>(key: Key): void {
    this.Taro.removeStorageSync(this.getFullKey(key))
  }

  /**
   * 同步读取存储值。
   * @param key - 存储键。
   * @returns 对应的存储值，不存在时返回 null。
   */
  getStorageSync<Key extends StorageKey<Schema>>(key: Key): Schema[Key] | null {
    const value = this.Taro.getStorageSync(this.getFullKey(key))

    if (value == null || value === 'undefined') {
      return null
    }

    return value as Schema[Key]
  }

  /**
   * 同步写入存储值。
   * @param key - 存储键。
   * @param data - 待写入的值。
   * @returns 无返回值。
   */
  setStorageSync<Key extends StorageKey<Schema>>(
    key: Key,
    data: Schema[Key],
  ): void {
    this.Taro.setStorageSync(this.getFullKey(key), data)
  }
}
