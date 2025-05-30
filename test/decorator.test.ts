/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { debounceMethod } from '../src/modules/decorator'

describe('debounceMethod decorator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  test('should debounce a class method', () => {
    const mockFn = vi.fn()

    class TestClass {
      @debounceMethod(100)
      testMethod(...args: any[]) {
        mockFn(...args)
      }
    }

    const instance = new TestClass()

    instance.testMethod(1)
    instance.testMethod(2)
    instance.testMethod(3)

    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith(3)
  })

  test('should work with leading: true option', () => {
    const mockFn = vi.fn()

    class TestClass {
      @debounceMethod(100, { leading: true, trailing: false })
      testMethod(...args: any[]) {
        mockFn(...args)
      }
    }

    const instance = new TestClass()

    instance.testMethod(1)
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith(1)

    instance.testMethod(2) // This call should be ignored as it's within the wait time
    expect(mockFn).toHaveBeenCalledTimes(1) // Still 1 because leading already fired

    vi.advanceTimersByTime(100)
    instance.testMethod(3) // This should fire immediately as the previous debounce period ended
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenNthCalledWith(2, 3)
  })

  test('should work with trailing: true option (default)', () => {
    const mockFn = vi.fn()

    class TestClass {
      @debounceMethod(100, { trailing: true, leading: false })
      testMethod(...args: any[]) {
        mockFn(...args)
      }
    }

    const instance = new TestClass()

    instance.testMethod(1)
    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith(1)

    instance.testMethod(2)
    instance.testMethod(3)
    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenNthCalledWith(2, 3)
  })

  test('should work with leading: true and trailing: true options', () => {
    const mockFn = vi.fn()

    class TestClass {
      @debounceMethod(100, { leading: true, trailing: true })
      testMethod(...args: any[]) {
        mockFn(...args)
      }
    }

    const instance = new TestClass()

    // First call: leading edge
    instance.testMethod(1)
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith(1)

    // Second call: within debounce period, should trigger trailing edge
    instance.testMethod(2)
    expect(mockFn).toHaveBeenCalledTimes(1) // Not yet called for trailing

    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenNthCalledWith(2, 2) // Trailing call with last arguments

    // Third call: after debounce period, new leading edge
    instance.testMethod(3)
    expect(mockFn).toHaveBeenCalledTimes(3)
    expect(mockFn).toHaveBeenNthCalledWith(3, 3)

    // Fourth call: within debounce period, should trigger trailing edge
    instance.testMethod(4)
    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(4)
    expect(mockFn).toHaveBeenNthCalledWith(4, 4)
  })

  test.skip('cancel method should work (Stage 3 decorators do not directly expose this)', () => {
    const mockFn = vi.fn()

    class TestClass {
      @debounceMethod(100)
      testMethod(...args: any[]) {
        mockFn(...args)
      }
    }

    const instance = new TestClass()
    // Type assertion to access cancel, as it's added by the debounce function
    const debouncedTestMethod = instance.testMethod as unknown as {
      cancel: () => void
    }

    instance.testMethod(1)
    expect(mockFn).not.toHaveBeenCalled()

    debouncedTestMethod.cancel()

    vi.advanceTimersByTime(100)
    expect(mockFn).not.toHaveBeenCalled() // Should not be called because it was cancelled
  })

  test.skip('flush method should work (Stage 3 decorators do not directly expose this)', () => {
    const mockFn = vi.fn()

    class TestClass {
      @debounceMethod(100)
      testMethod(...args: any[]) {
        mockFn(...args)
        return args[0] // Return something to check flush's return value
      }
    }

    const instance = new TestClass()
    const debouncedTestMethod = instance.testMethod as unknown as {
      flush: () => any
    }

    instance.testMethod(1)
    expect(mockFn).not.toHaveBeenCalled()

    const result = debouncedTestMethod.flush()
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith(1)
    expect(result).toBe(1)

    // Call flush again when there's nothing to flush
    const result2 = debouncedTestMethod.flush()
    expect(mockFn).toHaveBeenCalledTimes(1) // Still 1, as it was already flushed
    expect(result2).toBe(1) // Should return the result of the last invocation
  })

  test.skip('pending method should work (Stage 3 decorators do not directly expose this)', () => {
    const mockFn = vi.fn()

    class TestClass {
      @debounceMethod(100)
      testMethod(...args: any[]) {
        mockFn(...args)
      }
    }

    const instance = new TestClass()
    const debouncedTestMethod = instance.testMethod as unknown as {
      pending: () => boolean
    }

    expect(debouncedTestMethod.pending()).toBe(false)
    instance.testMethod(1)
    expect(debouncedTestMethod.pending()).toBe(true)

    vi.advanceTimersByTime(100)
    expect(debouncedTestMethod.pending()).toBe(false)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  test('should throw error if not decorating a method', () => {
    expect(() => {
      class TestClass {
        // @ts-expect-error: Testing invalid usage
        @debounceMethod(100)
        public notAMethod: string = 'test'
      }
      new TestClass()
    }).toThrow(TypeError)
    // Note: The actual error might be thrown during class instantiation or when the property is accessed,
    // depending on how decorators are transpiled and applied. Vitest might not catch errors thrown
    // directly during class definition time in this manner for property decorators.
    // A more robust test might involve checking the descriptor modification.
  })
})
