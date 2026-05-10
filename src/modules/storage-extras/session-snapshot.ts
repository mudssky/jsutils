import type { StorageKey, StorageSchema, WebSessionStorage } from '../storage'

/**
 * Session 快照 schema 辅助类型。
 * @public
 */
export type SessionSnapshotSchema<TState extends Record<string, unknown>> =
  Record<`snapshot_${string}`, TState & { timestamp: number }>

/**
 * 创建 session 快照。
 * @param storage - Session storage 实例。
 * @param snapshotId - 快照 id。
 * @param state - 待保存的状态对象。
 * @returns 无返回值。
 * @public
 */
export function createSessionSnapshot<
  TState extends Record<string, unknown>,
  Schema extends StorageSchema & SessionSnapshotSchema<TState>,
>(storage: WebSessionStorage<Schema>, snapshotId: string, state: TState): void {
  storage.setStorageSync(
    `snapshot_${snapshotId}` as StorageKey<Schema>,
    {
      ...state,
      timestamp: Date.now(),
    } as Schema[StorageKey<Schema>],
  )
}

/**
 * 恢复 session 快照。
 * @param storage - Session storage 实例。
 * @param snapshotId - 快照 id。
 * @returns 快照数据，不存在时返回 null。
 * @public
 */
export function restoreSessionSnapshot<
  TState extends Record<string, unknown>,
  Schema extends StorageSchema & SessionSnapshotSchema<TState>,
>(
  storage: WebSessionStorage<Schema>,
  snapshotId: string,
): Schema[StorageKey<Schema>] | null {
  return storage.getStorageSync(`snapshot_${snapshotId}` as StorageKey<Schema>)
}

/**
 * 清理过期的 session 快照。
 * @param storage - Session storage 实例。
 * @param maxAge - 快照最大保留时长，单位毫秒。
 * @returns 无返回值。
 * @public
 */
export function cleanExpiredSessionSnapshots<
  TState extends Record<string, unknown>,
  Schema extends StorageSchema & SessionSnapshotSchema<TState>,
>(
  storage: WebSessionStorage<Schema>,
  maxAge: number = 24 * 60 * 60 * 1000,
): void {
  const now = Date.now()

  for (const key of storage.getKeys()) {
    if (!key.startsWith('snapshot_')) {
      continue
    }

    const snapshot = storage.getStorageSync(key)
    if (snapshot && typeof snapshot === 'object' && 'timestamp' in snapshot) {
      const timestamp = (snapshot as { timestamp: number }).timestamp
      if (now - timestamp > maxAge) {
        storage.removeStorageSync(key)
      }
    }
  }
}
