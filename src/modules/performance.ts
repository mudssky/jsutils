/**
 * 性能测试结果接口
 *
 * @public
 */
export interface PerformanceResult {
  /**
   * 执行时间（毫秒）
   */
  duration: number
  /**
   * 内存使用情况（如果可用）
   */
  memory?: {
    /** 使用的JS堆大小（字节） */
    usedJSHeapSize: number
    /** 总的JS堆大小（字节） */
    totalJSHeapSize: number
    /** JS堆大小限制（字节） */
    jsHeapSizeLimit: number
  }
  /**
   * 函数返回值
   */
  result: unknown
  /**
   * 执行次数
   */
  iterations: number
}

/**
 * 性能测试选项接口
 *
 * @public
 */
export interface PerformanceTestOptions {
  /**
   * 执行次数
   * @defaultValue 1
   */
  iterations?: number
  /**
   * 是否收集内存信息
   * @defaultValue true
   */
  collectMemory?: boolean
  /**
   * 预热次数（在正式测试前执行的次数，用于JIT优化）
   * @defaultValue 0
   */
  warmupIterations?: number
  /**
   * 是否在每次迭代前强制垃圾回收（仅在支持的环境中有效）
   * @defaultValue false
   */
  forceGC?: boolean
  /**
   * 时间限制（毫秒）
   * 当设置时间限制时，测试将在达到时间限制或完成所有迭代时停止
   * @defaultValue undefined
   */
  timeLimit?: number
}

/**
 * 性能检测器类
 *
 * 提供测试JavaScript代码片段或方法执行性能的功能，支持多次迭代测试、
 * 内存使用监控、预热执行等高级特性。
 *
 * @example
 * ```typescript
 * const perf = new PerformanceMonitor()
 *
 * // 测试函数性能
 * const result = await perf.measureFunction(() => {
 *   return Array.from({ length: 1000 }, (_, i) => i * 2)
 * })
 * console.log(`执行时间: ${result.duration}ms`)
 *
 * // 测试异步函数性能
 * const asyncResult = await perf.measureFunction(async () => {
 *   await new Promise(resolve => setTimeout(resolve, 100))
 *   return 'done'
 * })
 *
 * // 多次迭代测试
 * const iterResult = await perf.measureFunction(
 *   () => Math.random(),
 *   { iterations: 1000, warmupIterations: 100 }
 * )
 *
 * // 比较两个函数的性能
 * const comparison = await perf.compare(
 *   () => [1, 2, 3].map(x => x * 2),
 *   () => [1, 2, 3].forEach((x, i, arr) => arr[i] = x * 2),
 *   { iterations: 10000 }
 * )
 * ```
 *
 * @public
 * @since 1.0.0
 */
export class PerformanceMonitor {
  /**
   * 测试函数执行性能
   *
   * @param fn - 要测试的函数
   * @param options - 测试选项
   * @returns - 性能测试结果
   *
   * @example
   * ```typescript
   * const perf = new PerformanceMonitor()
   *
   * // 基本测试
   * const result = await perf.measureFunction(() => {
   *   return Array.from({ length: 1000 }, (_, i) => i * 2)
   * })
   *
   * // 带选项的测试
   * const result2 = await perf.measureFunction(
   *   () => someExpensiveOperation(),
   *   {
   *     iterations: 100,
   *     warmupIterations: 10,
   *     collectMemory: true,
   *     forceGC: true
   *   }
   * )
   * ```
   */
  public async measureFunction<T>(
    fn: () => T | Promise<T>,
    options: PerformanceTestOptions = {},
  ): Promise<PerformanceResult> {
    const {
      iterations = 1,
      collectMemory = true,
      warmupIterations = 0,
      forceGC = false,
      timeLimit,
    } = options

    // 验证迭代次数
    if (iterations <= 0) {
      throw new Error('Iterations must be greater than 0')
    }
    if (warmupIterations < 0) {
      throw new Error('Warmup iterations must be non-negative')
    }
    if (timeLimit !== undefined && timeLimit <= 0) {
      throw new Error('Time limit must be greater than 0')
    }

    // 预热执行
    for (let i = 0; i < warmupIterations; i++) {
      await fn()
    }

    // 强制垃圾回收（如果支持）
    if (
      forceGC &&
      typeof (globalThis as { gc?: () => void }).gc === 'function'
    ) {
      ;(globalThis as { gc: () => void }).gc()
    }

    // 开始性能测试
    const startTime = performance.now()
    let result: unknown
    let actualIterations = 0

    // 如果设置了时间限制，使用基于时间的循环
    if (timeLimit !== undefined) {
      const endTimeLimit = startTime + timeLimit

      for (let i = 0; i < iterations && performance.now() < endTimeLimit; i++) {
        result = await fn()
        actualIterations++
      }
    } else {
      // 否则使用固定迭代次数
      for (let i = 0; i < iterations; i++) {
        result = await fn()
        actualIterations++
      }
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    // 收集最终内存信息
    const finalMemory = collectMemory ? this.getMemoryInfo() : undefined

    return {
      duration,
      memory: finalMemory,
      result,
      iterations: actualIterations,
    }
  }

  /**
   * 比较两个函数的性能
   *
   * @param fn1 - 第一个函数
   * @param fn2 - 第二个函数
   * @param options - 测试选项
   * @returns - 包含两个函数性能结果的对象
   *
   * @example
   * ```typescript
   * const perf = new PerformanceMonitor()
   *
   * const comparison = await perf.compare(
   *   () => [1, 2, 3].map(x => x * 2),
   *   () => {
   *     const result = []
   *     for (const x of [1, 2, 3]) {
   *       result.push(x * 2)
   *     }
   *     return result
   *   },
   *   { iterations: 10000 }
   * )
   *
   * console.log(`函数1: ${comparison.fn1.duration}ms`)
   * console.log(`函数2: ${comparison.fn2.duration}ms`)
   * console.log(`性能差异: ${comparison.ratio.toFixed(2)}x`)
   * ```
   */
  public async compare<T1, T2>(
    fn1: () => T1 | Promise<T1>,
    fn2: () => T2 | Promise<T2>,
    options: PerformanceTestOptions = {},
  ): Promise<{
    fn1: PerformanceResult
    fn2: PerformanceResult
    ratio: number
    faster: 'fn1' | 'fn2'
  }> {
    const result1 = await this.measureFunction(fn1, options)
    const result2 = await this.measureFunction(fn2, options)

    const ratio = result1.duration / result2.duration
    const faster = result1.duration < result2.duration ? 'fn1' : 'fn2'

    return {
      fn1: result1,
      fn2: result2,
      ratio: Math.abs(ratio),
      faster,
    }
  }

  /**
   * 批量测试多个函数的性能
   *
   * @param functions - 要测试的函数数组
   * @param options - 测试选项
   * @returns - 所有函数的性能结果数组
   *
   * @example
   * ```typescript
   * const perf = new PerformanceMonitor()
   *
   * const results = await perf.benchmark([
   *   () => [1, 2, 3].map(x => x * 2),
   *   () => [1, 2, 3].forEach((x, i, arr) => arr[i] = x * 2),
   *   () => {
   *     const result = []
   *     for (const x of [1, 2, 3]) {
   *       result.push(x * 2)
   *     }
   *     return result
   *   }
   * ], { iterations: 10000 })
   *
   * results.forEach((result, index) => {
   *   console.log(`函数${index + 1}: ${result.duration}ms`)
   * })
   * ```
   */
  public async benchmark<T>(
    functions: Array<() => T | Promise<T>>,
    options: PerformanceTestOptions = {},
  ): Promise<PerformanceResult[]> {
    const results: PerformanceResult[] = []

    for (const fn of functions) {
      const result = await this.measureFunction(fn, options)
      results.push(result)
    }

    return results
  }

  /**
   * 测试代码字符串的性能
   *
   * @param code - 要测试的代码字符串
   * @param options - 测试选项
   * @returns - 性能测试结果
   *
   * @example
   * ```typescript
   * const perf = new PerformanceMonitor()
   *
   * const result = await perf.measureCode(`
   *   const arr = Array.from({ length: 1000 }, (_, i) => i)
   *   return arr.reduce((sum, x) => sum + x, 0)
   * `, { iterations: 100 })
   * ```
   */
  public async measureCode(
    code: string,
    options: PerformanceTestOptions = {},
  ): Promise<PerformanceResult> {
    // 创建函数包装器
    const fn = new Function(`return (function() { ${code} })`)()
    return this.measureFunction(fn, options)
  }

  /**
   * 获取内存使用信息
   *
   * @returns - 内存信息对象，如果不支持则返回undefined
   *
   * @internal
   */
  private getMemoryInfo(): PerformanceResult['memory'] | undefined {
    const performanceWithMemory = performance as Performance & {
      memory?: {
        usedJSHeapSize: number
        totalJSHeapSize: number
        jsHeapSizeLimit: number
      }
    }

    if (typeof performanceWithMemory.memory !== 'undefined') {
      const memory = performanceWithMemory.memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      }
    }
    return undefined
  }

  /**
   * 格式化性能结果为可读字符串
   *
   * @param result - 性能测试结果
   * @returns - 格式化的字符串
   *
   * @example
   * ```typescript
   * const perf = new PerformanceMonitor()
   * const result = await perf.measureFunction(() => someFunction())
   * console.log(perf.formatResult(result))
   * ```
   */
  public formatResult(result: PerformanceResult): string {
    let output = `执行时间: ${result.duration.toFixed(2)}ms`

    if (result.iterations > 1) {
      output += ` (${result.iterations} 次迭代)`
      output += ` 平均: ${(result.duration / result.iterations).toFixed(2)}ms/次`
    }

    if (result.memory) {
      const memoryMB = (result.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
      output += ` 内存使用: ${memoryMB}MB`
    }

    return output
  }

  /**
   * 创建性能报告
   *
   * @param results - 性能测试结果数组
   * @param labels - 可选的标签数组
   * @returns - 格式化的性能报告
   *
   * @example
   * ```typescript
   * const perf = new PerformanceMonitor()
   * const results = await perf.benchmark([fn1, fn2, fn3])
   * const report = perf.createReport(results, ['Map', 'ForEach', 'For Loop'])
   * console.log(report)
   * ```
   */
  public createReport(results: PerformanceResult[], labels?: string[]): string {
    if (results.length === 0) {
      return '没有性能测试结果'
    }

    // 按执行时间排序
    const sortedResults = results
      .map((result, index) => ({
        result,
        index,
        label: labels?.[index] || `函数${index + 1}`,
      }))
      .sort((a, b) => a.result.duration - b.result.duration)

    let report = '\n=== 性能测试报告 ===\n'

    sortedResults.forEach((item, rank) => {
      const { result, label } = item
      const isWinner = rank === 0
      const speedRatio =
        rank === 0 ? 1 : result.duration / sortedResults[0].result.duration

      report += `\n${rank + 1}. ${label}${isWinner ? ' 🏆' : ''}`
      report += `\n   ${this.formatResult(result)}`

      if (!isWinner) {
        report += `\n   比最快慢 ${speedRatio.toFixed(2)}x`
      }

      report += '\n'
    })

    return report
  }
}

/**
 * 创建性能监控器实例的便捷函数
 *
 * @returns - 新的性能监控器实例
 *
 * @example
 * ```typescript
 * const perf = createPerformanceMonitor()
 * const result = await perf.measureFunction(() => someFunction())
 * ```
 *
 * @public
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor()
}

/**
 * 快速测试函数性能的便捷函数
 *
 * @param fn - 要测试的函数
 * @param options - 测试选项
 * @returns - 性能测试结果
 *
 * @example
 * ```typescript
 * const result = await measurePerformance(() => {
 *   return Array.from({ length: 1000 }, (_, i) => i * 2)
 * }, { iterations: 100 })
 * console.log(`执行时间: ${result.duration}ms`)
 * ```
 *
 * @public
 */
export async function measurePerformance<T>(
  fn: () => T | Promise<T>,
  options?: PerformanceTestOptions,
): Promise<PerformanceResult> {
  const monitor = new PerformanceMonitor()
  return monitor.measureFunction(fn, options)
}

/**
 * 快速比较两个函数性能的便捷函数
 *
 * @param fn1 - 第一个函数
 * @param fn2 - 第二个函数
 * @param options - 测试选项
 * @returns - 比较结果
 *
 * @example
 * ```typescript
 * const comparison = await comparePerformance(
 *   () => [1, 2, 3].map(x => x * 2),
 *   () => [1, 2, 3].forEach((x, i, arr) => arr[i] = x * 2)
 * )
 * console.log(`${comparison.faster === 'fn1' ? '第一个' : '第二个'}函数更快`)
 * ```
 *
 * @public
 */
export async function comparePerformance<T1, T2>(
  fn1: () => T1 | Promise<T1>,
  fn2: () => T2 | Promise<T2>,
  options?: PerformanceTestOptions,
): Promise<{
  fn1: PerformanceResult
  fn2: PerformanceResult
  ratio: number
  faster: 'fn1' | 'fn2'
}> {
  const monitor = new PerformanceMonitor()
  return monitor.compare(fn1, fn2, options)
}
