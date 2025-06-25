import { describe, expect, it, vi } from 'vitest'
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
})
