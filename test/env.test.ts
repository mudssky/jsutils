import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getEnvironmentInfo,
  isBrowser,
  isDocumentAvailable,
  isLocalStorageAvailable,
  isNode,
  isSessionStorageAvailable,
  isWebWorker,
  runInBrowser,
  runWithDocument,
} from '../src/modules/env'

const browserGlobalKeys = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
] as const

type BrowserGlobalKey = (typeof browserGlobalKeys)[number]

const originalBrowserDescriptors = new Map<
  BrowserGlobalKey,
  PropertyDescriptor | undefined
>()

const createStorageMock = (): Storage =>
  ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  }) as Storage

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

describe('Environment Detection', () => {
  describe('isBrowser', () => {
    it('should return false in Node.js environment', () => {
      expect(isBrowser()).toBe(false)
    })
  })

  describe('isNode', () => {
    it('should return true in Node.js environment', () => {
      expect(isNode()).toBe(true)
    })
  })

  describe('isWebWorker', () => {
    it('should return false in Node.js environment', () => {
      expect(isWebWorker()).toBe(false)
    })
  })

  describe('isDocumentAvailable', () => {
    it('should return false in Node.js environment', () => {
      expect(isDocumentAvailable()).toBe(false)
    })
  })

  describe('isLocalStorageAvailable', () => {
    it('should return false in Node.js environment', () => {
      expect(isLocalStorageAvailable()).toBe(false)
    })
  })

  describe('isSessionStorageAvailable', () => {
    it('should return false in Node.js environment', () => {
      expect(isSessionStorageAvailable()).toBe(false)
    })
  })

  describe('getEnvironmentInfo', () => {
    it('should return correct environment info in Node.js', () => {
      const info = getEnvironmentInfo()
      expect(info.isBrowser).toBe(false)
      expect(info.isNode).toBe(true)
      expect(info.isWebWorker).toBe(false)
      expect(info.isDocumentAvailable).toBe(false)
      expect(info.isLocalStorageAvailable).toBe(false)
      expect(info.isSessionStorageAvailable).toBe(false)
      expect(info.userAgent).toBeUndefined()
      expect(info.platform).toBeDefined()
    })
  })

  describe('runInBrowser', () => {
    it('should not execute callback in Node.js environment', () => {
      const callback = vi.fn(() => 'browser result')
      const fallback = vi.fn(() => 'fallback result')

      const result = runInBrowser(callback, fallback)

      expect(callback).not.toHaveBeenCalled()
      expect(fallback).toHaveBeenCalled()
      expect(result).toBe('fallback result')
    })

    it('should return undefined when no fallback provided', () => {
      const callback = vi.fn(() => 'browser result')

      const result = runInBrowser(callback)

      expect(callback).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  describe('runWithDocument', () => {
    it('should not execute callback in Node.js environment', () => {
      const callback = vi.fn(() => 'document result')
      const fallback = vi.fn(() => 'fallback result')

      const result = runWithDocument(callback, fallback)

      expect(callback).not.toHaveBeenCalled()
      expect(fallback).toHaveBeenCalled()
      expect(result).toBe('fallback result')
    })

    it('should return undefined when no fallback provided', () => {
      const callback = vi.fn(() => 'document result')

      const result = runWithDocument(callback)

      expect(callback).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  // 测试错误处理情况
  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // 在Node.js环境中，localStorage不存在，应该返回false
      expect(isLocalStorageAvailable()).toBe(false)
    })

    it('should handle sessionStorage errors gracefully', () => {
      // 在Node.js环境中，sessionStorage不存在，应该返回false
      expect(isSessionStorageAvailable()).toBe(false)
    })
  })

  describe('browser branches', () => {
    beforeEach(() => {
      for (const key of browserGlobalKeys) {
        originalBrowserDescriptors.set(
          key,
          Object.getOwnPropertyDescriptor(globalThis, key),
        )
      }

      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {},
      })
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {},
      })
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
          platform: 'unit-test-platform',
          userAgent: 'UnitTestBrowser/1.0',
        },
      })
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: createStorageMock(),
      })
      Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: createStorageMock(),
      })
    })

    afterEach(() => {
      restoreBrowserGlobals()
      vi.restoreAllMocks()
    })

    it('should return true for isBrowser when window exists', () => {
      expect(isBrowser()).toBe(true)
    })

    it('should return true for isDocumentAvailable when document exists', () => {
      expect(isDocumentAvailable()).toBe(true)
    })

    it('should return browser fields from getEnvironmentInfo', () => {
      const info = getEnvironmentInfo()

      expect(info.isBrowser).toBe(true)
      expect(info.isDocumentAvailable).toBe(true)
      expect(info.isLocalStorageAvailable).toBe(true)
      expect(info.isSessionStorageAvailable).toBe(true)
      expect(info.userAgent).toBeDefined()
      expect(info.platform).toBeDefined()
    })

    it('should execute callback in runInBrowser when window exists', () => {
      const callback = vi.fn(() => 'browser result')

      const result = runInBrowser(callback)

      expect(callback).toHaveBeenCalledOnce()
      expect(result).toBe('browser result')
    })

    it('should execute callback in runWithDocument when document exists', () => {
      const callback = vi.fn(() => 'document result')

      const result = runWithDocument(callback)

      expect(callback).toHaveBeenCalledOnce()
      expect(result).toBe('document result')
    })

    it('should return false when localStorage.setItem throws', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
          ...createStorageMock(),
          setItem: vi.fn(() => {
            throw new Error('quota exceeded')
          }),
        } as Storage,
      })

      expect(isLocalStorageAvailable()).toBe(false)
    })

    it('should return false when sessionStorage.setItem throws', () => {
      Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: {
          ...createStorageMock(),
          setItem: vi.fn(() => {
            throw new Error('quota exceeded')
          }),
        } as Storage,
      })

      expect(isSessionStorageAvailable()).toBe(false)
    })
  })
})
