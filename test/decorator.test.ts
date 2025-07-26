/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearPerformanceData,
  debounceMethod,
  getPerformanceReport,
  performanceBenchmark,
  performanceCompare,
  performanceMonitor,
} from '../src/modules/decorator'

describe('debounceMethod decorator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should debounce a class method', () => {
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

  it('should work with leading: true option', () => {
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

  it('should work with trailing: true option (default)', () => {
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

  it('should work with leading: true and trailing: true options', () => {
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

  it.skip('cancel method should work (Stage 3 decorators do not directly expose this)', () => {
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

  it.skip('flush method should work (Stage 3 decorators do not directly expose this)', () => {
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

  it.skip('pending method should work (Stage 3 decorators do not directly expose this)', () => {
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

  it('should throw error if not decorating a method', () => {
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

describe('Performance Decorators', () => {
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    clearPerformanceData()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    clearPerformanceData()
  })

  describe('performanceMonitor', () => {
    it('should monitor method performance', async () => {
      class TestClass {
        @performanceMonitor()
        simpleMethod() {
          let sum = 0
          for (let i = 0; i < 1000; i++) {
            sum += i
          }
          return sum
        }
      }

      const instance = new TestClass()
      const result = await instance.simpleMethod()

      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThan(0)
    })

    it('should log results when enabled', async () => {
      class TestClass {
        @performanceMonitor({ logResult: true })
        loggedMethod(multiplier: number) {
          return Array.from({ length: 100 }, (_, i) => i * multiplier)
        }
      }

      const instance = new TestClass()
      await instance.loggedMethod(2)

      expect(consoleSpy).toHaveBeenCalled()
      const logCall = consoleSpy.mock.calls.find((call: any[]) =>
        call[0].includes('性能监控'),
      )
      expect(logCall).toBeDefined()
    })

    it('should handle async methods', async () => {
      class TestClass {
        @performanceMonitor()
        async asyncMethod() {
          return Promise.resolve('done')
        }
      }

      const instance = new TestClass()
      const result = await instance.asyncMethod()

      expect(result).toBe('done')
    })

    it('should handle methods that throw errors', async () => {
      class TestClass {
        @performanceMonitor()
        errorMethod() {
          throw new Error('Test error')
        }
      }

      const instance = new TestClass()

      await expect(instance.errorMethod()).rejects.toThrow('Test error')
    })
  })

  describe('performanceBenchmark', () => {
    it('should benchmark method performance', async () => {
      class TestClass {
        @performanceBenchmark({ timeLimit: 100 })
        benchmarkMethod() {
          return Math.sqrt(Math.random() * 1000)
        }
      }

      const instance = new TestClass()
      const result = await instance.benchmarkMethod()

      expect(typeof result).toBe('number')
    })

    it('should log benchmark results when enabled', async () => {
      class TestClass {
        @performanceBenchmark({ iterations: 10, logResult: true })
        loggedBenchmark() {
          let sum = 0
          for (let i = 0; i < 50; i++) {
            sum += i
          }
          return sum
        }
      }

      const instance = new TestClass()
      await instance.loggedBenchmark()

      expect(consoleSpy).toHaveBeenCalled()
      const logCall = consoleSpy.mock.calls.find((call: any[]) =>
        call[0].includes('性能监控'),
      )
      expect(logCall).toBeDefined()
    })
  })

  describe('performanceCompare', () => {
    it('should collect performance data for comparison', async () => {
      class TestClass {
        @performanceCompare('compareGroup')
        mapMethod() {
          return [1, 2, 3, 4, 5].map((x) => x * 2)
        }

        @performanceCompare('compareGroup')
        forEachMethod() {
          const result: number[] = []
          ;[1, 2, 3, 4, 5].forEach((x) => result.push(x * 2))
          return result
        }
      }

      const instance = new TestClass()
      const result1 = await instance.mapMethod()
      const result2 = await instance.forEachMethod()

      expect(result1).toEqual([2, 4, 6, 8, 10])
      expect(result2).toEqual([2, 4, 6, 8, 10])

      const report = getPerformanceReport('compareGroup')
      expect(report).toContain('mapMethod')
      expect(report).toContain('forEachMethod')
    })
  })

  describe('getPerformanceReport', () => {
    it('should return empty report when no data', () => {
      const report = getPerformanceReport('nonexistent')
      expect(report).toContain('没有找到组')
    })

    it('should return formatted report with data', async () => {
      class TestClass {
        @performanceCompare('testGroup')
        testMethod() {
          return Array.from({ length: 100 }, (_, i) => i * 2)
        }
      }

      const instance = new TestClass()
      await instance.testMethod()

      const report = getPerformanceReport('testGroup')
      expect(report).toContain('性能测试报告')
      expect(report).toContain('testMethod')
    })
  })

  describe('clearPerformanceData', () => {
    it('should clear all performance data', async () => {
      class TestClass {
        @performanceCompare('testGroup')
        testMethod() {
          return 42
        }
      }

      const instance = new TestClass()
      await instance.testMethod()

      // 确认有数据
      let report = getPerformanceReport('testGroup')
      expect(report).toContain('testMethod')

      // 清除数据
      clearPerformanceData('testGroup')

      // 确认数据已清除
      report = getPerformanceReport('testGroup')
      expect(report).toContain('没有找到组')
    })
  })
})
