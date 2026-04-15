import type { StorageKey, StorageSchema, WebSessionStorage } from '../storage'

type SessionStorageInternals<Schema extends StorageSchema> =
  WebSessionStorage<Schema> & {
    getFullKey<Key extends StorageKey<Schema>>(key: Key): string
    removePrefix(fullKey: string): string
    isScopedKey(fullKey: string): boolean
  }

/**
 * 获取 session storage 的内部方法。
 * @param storage - Session storage 实例。
 * @returns 带内部能力的 storage 实例。
 */
function getStorageInternals<Schema extends StorageSchema>(
  storage: WebSessionStorage<Schema>,
): SessionStorageInternals<Schema> {
  return storage as SessionStorageInternals<Schema>
}

/**
 * 解析序列化的存储值。
 * @param value - 序列化字符串。
 * @returns 解析后的值，失败时返回 null。
 */
function parseStoredValue<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

/**
 * 将 sessionStorage 数据同步到 localStorage。
 * @param storage - Session storage 实例。
 * @param keys - 需要同步的键列表，缺省时同步当前命名空间全部键。
 * @returns 无返回值。
 * @public
 */
export function syncSessionToLocalStorage<
  Schema extends StorageSchema,
  Key extends StorageKey<Schema>,
>(storage: WebSessionStorage<Schema>, keys?: Key[]): void {
  const internals = getStorageInternals(storage)
  const keysToSync = (keys ?? storage.getKeys()) as Key[]

  for (const key of keysToSync) {
    const value = storage.getStorageSync(key)
    if (value !== null) {
      localStorage.setItem(internals.getFullKey(key), JSON.stringify(value))
    }
  }
}

/**
 * 从 localStorage 恢复数据到 sessionStorage。
 * @param storage - Session storage 实例。
 * @param keys - 需要恢复的键列表，缺省时恢复当前命名空间全部键。
 * @returns 无返回值。
 * @public
 */
export function restoreSessionFromLocalStorage<
  Schema extends StorageSchema,
  Key extends StorageKey<Schema>,
>(storage: WebSessionStorage<Schema>, keys?: Key[]): void {
  const internals = getStorageInternals(storage)
  const keysToRestore =
    keys ??
    Array.from({ length: localStorage.length }, (_, index) => {
      return localStorage.key(index)
    })
      .filter((fullKey): fullKey is string => {
        return Boolean(fullKey && internals.isScopedKey(fullKey))
      })
      .map((fullKey) => internals.removePrefix(fullKey) as Key)

  for (const key of keysToRestore) {
    const value = localStorage.getItem(internals.getFullKey(key))
    if (value == null || value === 'undefined') {
      continue
    }

    const parsed = parseStoredValue<Schema[Key]>(value)
    if (parsed !== null || value === 'null') {
      storage.setStorageSync(key, parsed as Schema[Key])
    }
  }
}
