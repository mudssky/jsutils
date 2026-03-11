// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { WebSessionStorage } from '../../src/modules/storage'

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

  test('autoSaveForm should no-op outside browser-compatible setup', () => {
    Reflect.deleteProperty(globalThis, 'window')
    Reflect.deleteProperty(globalThis, 'document')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = new WebSessionStorage({
      enableCache: true,
    })

    const disposer = storage.autoSaveForm('profile')

    expect(typeof disposer).toBe('function')
    expect(warnSpy).toHaveBeenCalledWith(
      'autoSaveForm is only available in browser environment',
    )
    expect(() => disposer()).not.toThrow()
  })

  test('autoSaveForm should warn and return disposer when form is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = new WebSessionStorage({
      enableCache: true,
    })

    const disposer = storage.autoSaveForm('missing-form')

    expect(typeof disposer).toBe('function')
    expect(warnSpy).toHaveBeenCalledWith(
      "Form with id 'missing-form' not found",
    )
    expect(() => disposer()).not.toThrow()
  })

  test('autoSaveForm should persist form data and remove listeners on disposer', () => {
    document.body.innerHTML = `
      <form id="profile-form">
        <input name="name" value="mudssky">
        <input name="role" value="maintainer">
      </form>
    `

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const storage = new WebSessionStorage({
      enableCache: true,
    })

    const disposer = storage.autoSaveForm('profile-form', 50)

    vi.advanceTimersByTime(50)

    expect(storage.getStorageSync('form_profile-form')).toEqual({
      name: 'mudssky',
      role: 'maintainer',
    })
    ;(document.querySelector('[name="name"]') as HTMLInputElement).value =
      'next'

    disposer()
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
