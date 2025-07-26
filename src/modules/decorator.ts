import type { AnyFunction } from '../types'
import { debounce } from './function'
import {
  PerformanceMonitor,
  type PerformanceResult,
  type PerformanceTestOptions,
} from './performance'

/**
 * 创建一个防抖的类方法装饰器。
 *
 * @param wait - 等待时间（毫秒），默认为 200
 * @param options - 可选参数对象，包含 leading 和 trailing 选项
 * @returns - 返回一个方法装饰器
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @debounceMethod(300, { leading: true })
 *   logMessage(message: string) {
 *     console.log(message);
 *   }
 * }
 *
 * const instance = new MyClass();
 * instance.logMessage("Hello"); // 会立即执行
 * instance.logMessage("World"); // 会在300ms后执行，如果期间没有新的调用
 * ```
 */
export function debounceMethod(
  wait = 200,
  options: {
    leading?: boolean
    trailing?: boolean
  } = {
    leading: false,
    trailing: true,
  },
) {
  return function (
    originalMethod: AnyFunction,
    context: ClassMethodDecoratorContext,
  ) {
    if (context.kind !== 'method') {
      throw new TypeError('Only methods can be decorated with @debounceMethod.')
    }

    if (typeof originalMethod !== 'function') {
      // This check might be redundant if TypeScript enforces originalMethod to be a function type
      // based on ClassMethodDecoratorContext, but it's good for robustness.
      throw new TypeError('The decorated member must be a method.')
    }

    const debouncedFn = debounce(originalMethod, wait, options)

    return function (this: unknown, ...args: unknown[]) {
      return debouncedFn.apply(this, args)
    } as AnyFunction
  }
}

/**
 * 性能监控装饰器选项接口
 *
 * @public
 */
export interface PerformanceDecoratorOptions extends PerformanceTestOptions {
  /**
   * 是否在控制台输出性能结果
   * @defaultValue true
   */
  logResult?: boolean
  /**
   * 自定义日志前缀
   * @defaultValue 方法名
   */
  logPrefix?: string
  /**
   * 性能结果回调函数
   */
  onResult?: (methodName: string, result: PerformanceResult) => void
  /**
   * 是否只在开发环境中启用
   * @defaultValue true
   */
  devOnly?: boolean
  /**
   * 时间限制（毫秒）
   * 用于基准测试，当达到时间限制时停止测试
   */
  timeLimit?: number
}

/**
 * 创建一个性能监控的类方法装饰器。
 *
 * 该装饰器会自动测量被装饰方法的执行时间和内存使用情况，
 * 支持同步和异步方法，可以配置多次迭代测试和自定义输出。
 *
 * @param options - 性能监控选项
 * @returns - 返回一个方法装饰器
 *
 * @example
 * ```typescript
 * class DataProcessor {
 *   @performanceMonitor({
 *     iterations: 100,
 *     logResult: true,
 *     logPrefix: 'DataProcessor'
 *   })
 *   processData(data: any[]) {
 *     return data.map(item => item * 2)
 *   }
 *
 *   @performanceMonitor({
 *     collectMemory: true,
 *     onResult: (name, result) => {
 *       console.log(`${name} 执行了 ${result.duration}ms`)
 *     }
 *   })
 *   async fetchData() {
 *     const response = await fetch('/api/data')
 *     return response.json()
 *   }
 *
 *   @performanceMonitor({ devOnly: true })
 *   expensiveOperation() {
 *     // 只在开发环境中监控性能
 *     return heavyComputation()
 *   }
 * }
 * ```
 */
export function performanceMonitor(options: PerformanceDecoratorOptions = {}) {
  return function (
    originalMethod: AnyFunction,
    context: ClassMethodDecoratorContext,
  ) {
    if (context.kind !== 'method') {
      throw new TypeError(
        'Only methods can be decorated with @performanceMonitor.',
      )
    }

    if (typeof originalMethod !== 'function') {
      throw new TypeError('The decorated member must be a method.')
    }

    const {
      logResult = true,
      logPrefix,
      onResult,
      devOnly = true,
      ...performanceOptions
    } = options

    // 如果设置了只在开发环境启用，且当前不是开发环境，则直接返回原方法
    if (devOnly && process.env.NODE_ENV === 'production') {
      return originalMethod
    }

    const monitor = new PerformanceMonitor()
    const methodName = String(context.name)
    const displayName = logPrefix ? `${logPrefix}.${methodName}` : methodName

    return function (this: unknown, ...args: unknown[]) {
      // 包装原方法以便性能测试
      const wrappedMethod = () => originalMethod.apply(this, args)

      // 执行性能测试
      const performancePromise = monitor.measureFunction(
        wrappedMethod,
        performanceOptions,
      )

      // 处理结果
      const handleResult = (perfResult: PerformanceResult) => {
        if (logResult) {
          // eslint-disable-next-line no-console
          console.log(
            `[性能监控] ${displayName}: ${monitor.formatResult(perfResult)}`,
          )
        }

        if (onResult) {
          onResult(displayName, perfResult)
        }

        return perfResult.result
      }

      // 如果原方法是异步的，返回Promise
      if (performancePromise instanceof Promise) {
        return performancePromise.then(handleResult)
      }

      // 同步方法直接处理结果
      return handleResult(performancePromise)
    } as AnyFunction
  }
}

/**
 * 创建一个性能基准测试的类方法装饰器。
 *
 * 该装饰器会在方法执行时进行多次迭代测试，并生成详细的性能报告。
 * 适用于需要精确性能分析的关键方法。
 *
 * @param options - 基准测试选项
 * @returns 返回一个方法装饰器
 *
 * @example
 * ```typescript
 * class Algorithm {
 *   @performanceBenchmark({
 *     iterations: 1000,
 *     warmupIterations: 100,
 *     collectMemory: true
 *   })
 *   sortArray(arr: number[]) {
 *     return [...arr].sort((a, b) => a - b)
 *   }
 *
 *   @performanceBenchmark({
 *     iterations: 500,
 *     onResult: (name, result) => {
 *       // 自定义结果处理
 *       sendMetricsToServer(name, result)
 *     }
 *   })
 *   searchElement(arr: unknown[], target: unknown) {
 *     return arr.indexOf(target)
 *   }
 * }
 * ```
 */
export function performanceBenchmark(
  options: PerformanceDecoratorOptions = {},
) {
  const defaultOptions: PerformanceDecoratorOptions = {
    iterations: 100,
    warmupIterations: 10,
    collectMemory: true,
    logResult: true,
    ...options,
  }

  return performanceMonitor(defaultOptions)
}

/**
 * 创建一个性能比较装饰器，用于比较同一个类中多个方法的性能。
 *
 * 该装饰器会收集被装饰方法的性能数据，并在指定时机生成比较报告。
 *
 * @param groupName - 比较组名称
 * @param options - 性能监控选项
 * @returns 返回一个方法装饰器
 *
 * @example
 * ```typescript
 * class SortingAlgorithms {
 *   @performanceCompare('sorting', { iterations: 1000 })
 *   bubbleSort(arr: number[]) {
 *     // 冒泡排序实现
 *     return bubbleSortImpl([...arr])
 *   }
 *
 *   @performanceCompare('sorting', { iterations: 1000 })
 *   quickSort(arr: number[]) {
 *     // 快速排序实现
 *     return quickSortImpl([...arr])
 *   }
 *
 *   @performanceCompare('sorting', { iterations: 1000 })
 *   mergeSort(arr: number[]) {
 *     // 归并排序实现
 *     return mergeSortImpl([...arr])
 *   }
 *
 *   // 调用此方法会输出所有sorting组方法的性能比较报告
 *   showSortingComparison() {
 *     // eslint-disable-next-line no-console
 *     console.log(getPerformanceReport('sorting'))
 *   }
 * }
 * ```
 */
export function performanceCompare(
  groupName: string,
  options: PerformanceDecoratorOptions = {},
) {
  return function (
    originalMethod: AnyFunction,
    context: ClassMethodDecoratorContext,
  ) {
    if (context.kind !== 'method') {
      throw new TypeError(
        'Only methods can be decorated with @performanceCompare.',
      )
    }

    // 存储性能数据的全局对象
    if (!(globalThis as Record<string, unknown>).__performanceCompareData) {
      ;(globalThis as Record<string, unknown>).__performanceCompareData =
        new Map()
    }

    const performanceData = (globalThis as Record<string, unknown>)
      .__performanceCompareData as Map<
      string,
      Array<{ methodName: string; result: PerformanceResult }>
    >

    if (!performanceData.has(groupName)) {
      performanceData.set(groupName, [])
    }

    const methodName = String(context.name)
    const monitor = new PerformanceMonitor()

    return function (this: unknown, ...args: unknown[]) {
      const wrappedMethod = () => originalMethod.apply(this, args)

      const perfResult = monitor.measureFunction(wrappedMethod, options)

      const handleResult = (result: PerformanceResult) => {
        // 存储性能数据
        const groupData = performanceData.get(groupName) as Array<{
          methodName: string
          result: PerformanceResult
        }>
        const existingIndex = groupData.findIndex(
          (item: { methodName: string; result: PerformanceResult }) =>
            item.methodName === methodName,
        )

        if (existingIndex >= 0) {
          groupData[existingIndex] = { methodName, result }
        } else {
          groupData.push({ methodName, result })
        }

        return result.result
      }

      if (perfResult instanceof Promise) {
        return perfResult.then(handleResult)
      }

      return handleResult(perfResult)
    } as AnyFunction
  }
}

/**
 * 获取性能比较报告
 *
 * @param groupName - 比较组名称
 * @returns 格式化的性能比较报告
 *
 * @example
 * ```typescript
 * // 在类中使用performanceCompare装饰器后
 * const report = getPerformanceReport('sorting')
 * // eslint-disable-next-line no-console
 * console.log(report)
 * ```
 *
 * @public
 */
export function getPerformanceReport(groupName: string): string {
  const performanceData = (globalThis as Record<string, unknown>)
    .__performanceCompareData as Map<
    string,
    Array<{ methodName: string; result: PerformanceResult }>
  >

  if (!performanceData || !performanceData.has(groupName)) {
    return `没有找到组 "${groupName}" 的性能数据`
  }

  const groupData = performanceData.get(groupName)!
  const monitor = new PerformanceMonitor()

  const results = groupData.map((item) => item.result)
  const labels = groupData.map((item) => item.methodName)

  return monitor.createReport(results, labels)
}

/**
 * 清除性能比较数据
 *
 * @param groupName - 要清除的组名称，如果不提供则清除所有数据
 *
 * @example
 * ```typescript
 * // 清除特定组的数据
 * clearPerformanceData('sorting')
 *
 * // 清除所有数据
 * clearPerformanceData()
 * ```
 *
 * @public
 */
export function clearPerformanceData(groupName?: string): void {
  const performanceData = (globalThis as Record<string, unknown>)
    .__performanceCompareData as Map<
    string,
    Array<{ methodName: string; result: PerformanceResult }>
  >

  if (!performanceData) {
    return
  }

  if (groupName) {
    performanceData.delete(groupName)
  } else {
    performanceData.clear()
  }
}
