// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { WebSessionStorage } from '../../src/modules/storage'
import { bindFormAutoSave } from '../../src/modules/storage-extras'

const browserGlobalKeys = ['window', 'document'] as const

type BrowserGlobalKey = (typeof browserGlobalKeys)[number]

const originalBrowserDescriptors = new Map<
  BrowserGlobalKey,
  PropertyDescriptor | undefined
>()

const restoreBrowserGlobals = () => {
  for (const key of browserGlobalKeys) {
    const descriptor = originalBrowserDescriptors.get(key)

    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor)
      continue
    }

    Reflect.deleteProperty(globalThis, key)
  }

  originalBrowserDescriptors.clear()
}

describe('storage dom branches', () => {
  beforeEach(() => {
    originalBrowserDescriptors.clear()
    for (const key of browserGlobalKeys) {
      originalBrowserDescriptors.set(
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
      )
    }

    if (typeof document !== 'undefined') {
      document.body.innerHTML = ''
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
    vi.useFakeTimers()
  })

  afterEach(() => {
    restoreBrowserGlobals()
    vi.useRealTimers()
    vi.restoreAllMocks()
    if (typeof document !== 'undefined') {
      document.body.innerHTML = ''
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
  })

  test('bindFormAutoSave should return DOCUMENT_UNAVAILABLE outside browser setup', () => {
    Reflect.deleteProperty(globalThis, 'window')
    Reflect.deleteProperty(globalThis, 'document')

    const storage = new WebSessionStorage<
      Record<`form_${string}`, Record<string, FormDataEntryValue>>
    >({
      enableCache: true,
    })

    const result = bindFormAutoSave(storage, 'profile')

    expect(result.ok).toBe(false)
    expect(result.code).toBe('DOCUMENT_UNAVAILABLE')
    expect(typeof result.dispose).toBe('function')
  })

  test('bindFormAutoSave should return FORM_NOT_FOUND when form is missing', () => {
    const storage = new WebSessionStorage<
      Record<`form_${string}`, Record<string, FormDataEntryValue>>
    >({
      enableCache: true,
    })

    const result = bindFormAutoSave(storage, 'missing-form')

    expect(result.ok).toBe(false)
    expect(result.code).toBe('FORM_NOT_FOUND')
    expect(typeof result.dispose).toBe('function')
  })

  test('bindFormAutoSave should persist form data and remove listeners on dispose', () => {
    document.body.innerHTML = `
      <form id="profile-form">
        <input name="name" value="mudssky">
        <input name="role" value="maintainer">
      </form>
    `

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const storage = new WebSessionStorage<
      Record<`form_${string}`, Record<string, FormDataEntryValue>>
    >({
      enableCache: true,
    })

    const result = bindFormAutoSave(storage, 'profile-form', 50)

    expect(result.ok).toBe(true)
    vi.advanceTimersByTime(50)

    expect(storage.getStorageSync('form_profile-form')).toEqual({
      name: 'mudssky',
      role: 'maintainer',
    })
    ;(document.querySelector('[name="name"]') as HTMLInputElement).value =
      'next'

    result.dispose()
    vi.advanceTimersByTime(50)

    expect(storage.getStorageSync('form_profile-form')).toEqual({
      name: 'mudssky',
      role: 'maintainer',
    })
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function),
    )
  })
})
