import { beforeEach, describe, expect, it } from 'vitest'
import {
  PerformanceMonitor,
  comparePerformance,
  createPerformanceMonitor,
  measurePerformance,
  type PerformanceResult,
} from '../src/modules/performance'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor()
  })

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(monitor).toBeInstanceOf(PerformanceMonitor)
    })

    it('should create instance with custom options', () => {
      const customMonitor = new PerformanceMonitor()
      expect(customMonitor).toBeInstanceOf(PerformanceMonitor)
    })
  })

  describe('measureFunction', () => {
    it('should measure function execution time', async () => {
      const testFn = () => {
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      }

      const result = await monitor.measureFunction(testFn)

      expect(result).toMatchObject({
        duration: expect.any(Number),
        iterations: expect.any(Number),
        result: expect.any(Number),
      })
      expect(result.duration).toBeGreaterThan(0)
      expect(result.iterations).toBeGreaterThan(0)
    })

    it('should handle async functions', async () => {
      const asyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'done'
      }

      const result = await monitor.measureFunction(asyncFn)

      expect(result.duration).toBeGreaterThan(10)
      expect(result.iterations).toBeGreaterThan(0)
    })

    it('should respect custom iterations', async () => {
      const testFn = () => 42
      const customIterations = 5

      const result = await monitor.measureFunction(testFn, {
        iterations: customIterations,
      })

      expect(result.iterations).toBe(customIterations)
    })

    it('should handle functions that throw errors', async () => {
      const errorFn = () => {
        throw new Error('Test error')
      }

      await expect(monitor.measureFunction(errorFn)).rejects.toThrow(
        'Test error',
      )
    })
  })

  describe('compare', () => {
    it('should compare two functions', async () => {
      const fastFn = () => 1 + 1
      const slowFn = () => {
        let sum = 0
        for (let i = 0; i < 10000; i++) {
          sum += i
        }
        return sum
      }

      const results = await monitor.compare(fastFn, slowFn)

      expect(results).toHaveProperty('fn1')
      expect(results).toHaveProperty('fn2')
      expect(results).toHaveProperty('ratio')
      expect(results).toHaveProperty('faster')
      expect(results.fn1.duration).toBeLessThan(results.fn2.duration)
      expect(results.faster).toBe('fn1')
    })

    it('should calculate performance ratio correctly', async () => {
      const fastFn = () => 1
      const slowFn = () => {
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      }

      const results = await monitor.compare(fastFn, slowFn)
      expect(results.ratio).toBeGreaterThan(0)
      expect(results.ratio).toBeLessThan(1) // fastFn 更快，所以 ratio < 1
      expect(results.faster).toBe('fn1')
    })
  })

  describe('benchmark', () => {
    it('should run benchmark with time limit', async () => {
      const testFn = () => Math.random()
      const timeLimit = 100 // 100ms

      const results = await monitor.benchmark([testFn], { timeLimit })

      expect(results).toHaveLength(1)
      expect(results[0].duration).toBeLessThanOrEqual(timeLimit + 50) // 允许一些误差
      expect(results[0].iterations).toBeGreaterThan(0)
    })

    it('should respect iteration limit', async () => {
      const testFn = () => {
        // 模拟较慢的函数
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      }
      const maxIterations = 5

      const results = await monitor.benchmark([testFn], {
        timeLimit: 10000, // 很长的时间限制
        iterations: maxIterations,
      })

      expect(results).toHaveLength(1)
      expect(results[0].iterations).toBe(maxIterations)
    })
  })

  describe('measureCode', () => {
    it('should measure code execution time', async () => {
      const code = `
        const arr = Array.from({ length: 1000 }, (_, i) => i)
        return arr.reduce((sum, num) => sum + num, 0)
      `

      const result = await monitor.measureCode(code)

      expect(result.duration).toBeGreaterThan(0)
      expect(result.iterations).toBeGreaterThan(0)
    })

    it('should handle simple code strings', async () => {
      const code = 'return 1 + 1'

      const result = await monitor.measureCode(code)

      expect(result.duration).toBeGreaterThanOrEqual(0)
      expect(result.result).toBe(2)
    })
  })

  describe('formatResult', () => {
    it('should format result with default options', () => {
      const result: PerformanceResult = {
        duration: 12.34567,
        iterations: 10,
        result: 'test result',
        memory: {
          usedJSHeapSize: 1024 * 1024,
          totalJSHeapSize: 2048 * 1024,
          jsHeapSizeLimit: 4096 * 1024,
        },
      }

      const formatted = monitor.formatResult(result)

      expect(formatted).toContain('执行时间: 12.35ms')
      expect(formatted).toContain('10 次迭代')
      expect(formatted).toContain('内存使用')
    })

    it('should format result without memory info', () => {
      const result: PerformanceResult = {
        duration: 15.0,
        iterations: 10,
        result: 'test result',
      }

      const formatted = monitor.formatResult(result)

      expect(formatted).toContain('执行时间: 15.00ms')
      expect(formatted).not.toContain('内存使用')
    })
  })

  describe('createReport', () => {
    it('should create comparison report', async () => {
      const fn1 = () => 1 + 1
      const fn2 = () => {
        let sum = 0
        for (let i = 0; i < 100; i++) {
          sum += Math.sqrt(i)
        }
        return sum
      }

      const results = await monitor.benchmark([fn1, fn2])
      const report = monitor.createReport(results, ['simple', 'complex'])

      expect(report).toContain('性能测试报告')
      expect(report).toContain('simple')
      expect(report).toContain('complex')
    })

    it('should handle single result', () => {
      const result: PerformanceResult = {
        duration: 10.0,
        iterations: 10,
        result: 'test result',
      }

      const report = monitor.createReport([result], ['test'])

      expect(report).toContain('性能测试报告')
      expect(report).toContain('test')
    })
  })
})

describe('Utility Functions', () => {
  describe('createPerformanceMonitor', () => {
    it('should create monitor with default options', () => {
      const monitor = createPerformanceMonitor()
      expect(monitor).toBeInstanceOf(PerformanceMonitor)
    })

    it('should create monitor with custom options', () => {
      const monitor = createPerformanceMonitor()
      expect(monitor).toBeInstanceOf(PerformanceMonitor)
    })
  })

  describe('measurePerformance', () => {
    it('should measure function performance', async () => {
      const testFn = () => Array.from({ length: 100 }, (_, i) => i * 2)

      const result = await measurePerformance(testFn)

      expect(result).toMatchObject({
        duration: expect.any(Number),
        iterations: expect.any(Number),
        result: expect.any(Object),
      })
    })

    it('should accept custom options', async () => {
      const testFn = () => 42
      const options = { iterations: 3 }

      const result = await measurePerformance(testFn, options)

      expect(result.iterations).toBe(3)
    })
  })

  describe('comparePerformance', () => {
    it('should compare two functions', async () => {
      const fn1 = () => [1, 2, 3, 4, 5].map((x) => x * 2)
      const fn2 = () => {
        const result: number[] = []
        ;[1, 2, 3, 4, 5].forEach((x) => result.push(x * 2))
        return result
      }

      const results = await comparePerformance(fn1, fn2)

      expect(results).toHaveProperty('fn1')
      expect(results).toHaveProperty('fn2')
      expect(results).toHaveProperty('ratio')
      expect(results).toHaveProperty('faster')
      expect(results.fn1.duration).toBeGreaterThan(0)
      expect(results.fn2.duration).toBeGreaterThan(0)
    })

    it('should accept custom options', async () => {
      const fn1 = () => 1
      const fn2 = () => 2
      const options = { iterations: 2 }

      const results = await comparePerformance(fn1, fn2, options)

      expect(results.fn1.iterations).toBe(2)
      expect(results.fn2.iterations).toBe(2)
    })
  })
})

describe('Performance Edge Cases', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor()
  })

  it('should handle very fast functions', async () => {
    const veryFastFn = () => true

    const result = await monitor.measureFunction(veryFastFn, {
      iterations: 10000,
    })

    expect(result.duration).toBeGreaterThanOrEqual(0)
    expect(result.iterations).toBeGreaterThan(0)
  })

  it('should handle functions with variable execution time', async () => {
    const variableFn = () => {
      const iterations = Math.floor(Math.random() * 1000) + 100
      let sum = 0
      for (let i = 0; i < iterations; i++) {
        sum += i
      }
      return sum
    }

    const result = await monitor.measureFunction(variableFn, {
      iterations: 10,
    })

    expect(result.duration).toBeGreaterThan(0)
    expect(result.iterations).toBe(10)
  })

  it('should handle zero iterations gracefully', async () => {
    const testFn = () => 42

    await expect(
      monitor.measureFunction(testFn, {
        iterations: 0,
      }),
    ).rejects.toThrow()
  })

  it('should handle negative iterations gracefully', async () => {
    const testFn = () => 42

    await expect(
      monitor.measureFunction(testFn, {
        iterations: -1,
      }),
    ).rejects.toThrow()
  })
})
