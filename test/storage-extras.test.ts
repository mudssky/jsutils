// @vitest-environment happy-dom
import { beforeEach, describe, expect, test } from 'vitest'
import { WebSessionStorage } from '../src/modules/storage'
import {
  cleanExpiredSessionSnapshots,
  createSessionSnapshot,
  restoreSessionFromLocalStorage,
  restoreSessionSnapshot,
  syncSessionToLocalStorage,
} from '../src/modules/storage-extras'

type SnapshotSchema = Record<
  `snapshot_${string}`,
  { data: string; timestamp: number }
>

describe('storage extras', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  test('snapshot helpers replace removed instance methods', () => {
    const storage = new WebSessionStorage<SnapshotSchema>({
      enableCache: true,
    })

    expect(
      (storage as unknown as Record<string, unknown>).createSnapshot,
    ).toBeUndefined()

    createSessionSnapshot(storage, 'page', { data: 'draft' })

    expect(restoreSessionSnapshot(storage, 'page')).toMatchObject({
      data: 'draft',
    })
  })

  test('cleanExpiredSessionSnapshots should remove expired snapshot data', () => {
    const storage = new WebSessionStorage<SnapshotSchema>({
      enableCache: true,
    })

    storage.setStorageSync('snapshot_old', {
      data: 'old',
      timestamp: Date.now() - 25 * 60 * 60 * 1000,
    })
    createSessionSnapshot(storage, 'new', { data: 'fresh' })

    cleanExpiredSessionSnapshots(storage, 24 * 60 * 60 * 1000)

    expect(storage.getStorageSync('snapshot_old')).toBe(null)
    expect(storage.getStorageSync('snapshot_new')).not.toBe(null)
  })

  test('session sync helpers move data between session and local storage', () => {
    const storage = new WebSessionStorage<{ theme: string }>({
      enableCache: true,
    })

    storage.setStorageSync('theme', 'dark')
    syncSessionToLocalStorage(storage, ['theme'])

    sessionStorage.clear()
    restoreSessionFromLocalStorage(storage, ['theme'])

    expect(storage.getStorageSync('theme')).toBe('dark')
  })

  test('restoreSessionFromLocalStorage should restore all prefixed keys when keys are omitted', () => {
    const storage = new WebSessionStorage<{
      name: string
      theme: string
    }>({
      prefix: 'restore_',
      enableCache: true,
    })

    localStorage.setItem('restore_name', '"mudssky"')
    localStorage.setItem('restore_theme', '"light"')

    restoreSessionFromLocalStorage(storage)

    expect(storage.getStorageSync('name')).toBe('mudssky')
    expect(storage.getStorageSync('theme')).toBe('light')
  })

  test('restoreSessionFromLocalStorage should ignore non-prefixed keys when keys are omitted', () => {
    const storage = new WebSessionStorage<{
      name: string
    }>({
      prefix: 'restore_',
      enableCache: true,
    })

    localStorage.setItem('restore_name', '"mudssky"')
    localStorage.setItem('other_name', '"ignored"')

    restoreSessionFromLocalStorage(storage)

    expect(storage.getStorageSync('name')).toBe('mudssky')
  })
})
