# 性能监控与装饰器使用指南

本文档介绍 `@mudssky/jsutils` 中的性能监控模块和装饰器的使用方法。

## 目录

- [性能监控模块 (Performance)](#性能监控模块-performance)
- [装饰器模块 (Decorators)](#装饰器模块-decorators)
- [实际应用示例](#实际应用示例)
- [最佳实践](#最佳实践)

## 性能监控模块 (Performance)

性能监控模块位于 `src/modules/performance.ts`，提供了全面的性能测试和分析功能。

### PerformanceMonitor 类

`PerformanceMonitor` 是核心性能监控类，提供以下主要功能：

#### 基本用法

```typescript
import { PerformanceMonitor } from '@mudssky/jsutils'

const monitor = new PerformanceMonitor()

// 测量函数执行性能
const result = monitor.measureFunction(() => {
  // 你的代码逻辑
  return Array.from({ length: 1000 }, (_, i) => i * 2)
})

console.log(`执行时间: ${result.duration}ms`)
console.log(`内存使用: ${result.memoryUsage?.used}MB`)
```

#### 主要方法

##### 1. measureFunction(fn, options?)

测量单个函数的执行性能。

```typescript
const options = {
  iterations: 100, // 执行次数
  warmupIterations: 10, // 预热次数
  collectMemory: true, // 是否收集内存信息
  logResult: true, // 是否输出结果到控制台
}

const result = monitor.measureFunction(myFunction, options)
```

##### 2. measureCode(code, options?)

测量代码字符串的执行性能。

```typescript
const code = `
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += i;
  }
  return sum;
`

const result = monitor.measureCode(code, { iterations: 50 })
```

##### 3. compare(fn1, fn2, options?)

比较两个函数的性能。

```typescript
const bubbleSort = (arr) => {
  /* 冒泡排序实现 */
}
const quickSort = (arr) => {
  /* 快速排序实现 */
}

const comparison = monitor.compare(bubbleSort, quickSort, {
  iterations: 100,
})

console.log(`性能比率: ${comparison.ratio}`)
console.log(`更快的函数: ${comparison.faster}`)
```

##### 4. benchmark(functions, options?)

对多个函数进行基准测试。

```typescript
const functions = [
  () => [1, 2, 3].map((x) => x * 2),
  () => {
    const result = []
    ;[1, 2, 3].forEach((x) => result.push(x * 2))
    return result
  },
  () => {
    const result = []
    for (let i of [1, 2, 3]) result.push(i * 2)
    return result
  },
]

const results = monitor.benchmark(functions, {
  iterations: 1000,
  timeLimit: 5000, // 最大执行时间 5 秒
})
```

##### 5. createReport(results, labels?)

生成格式化的性能报告。

```typescript
const report = monitor.createReport(results, ['方法1', '方法2', '方法3'])
console.log(report)
```

### 工具函数

#### comparePerformance(fn1, fn2, options?)

独立的性能比较函数。

```typescript
import { comparePerformance } from '@mudssky/jsutils'

const result = comparePerformance(
  () =>
    Array(1000)
      .fill(0)
      .map((_, i) => i),
  () => Array.from({ length: 1000 }, (_, i) => i),
  { iterations: 100 },
)
```

## 装饰器模块 (Decorators)

装饰器模块位于 `src/modules/decorator.ts`，提供了方便的性能监控装饰器。

### 性能监控装饰器

#### @performanceMonitor(options?)

为类方法添加性能监控功能。

```typescript
import { performanceMonitor } from '@mudssky/jsutils'

class DataProcessor {
  @performanceMonitor({
    iterations: 10,
    logResult: true,
    collectMemory: true,
  })
  processLargeDataset(data: any[]) {
    return data.map((item) => {
      // 复杂的数据处理逻辑
      return this.transformItem(item)
    })
  }

  private transformItem(item: any) {
    // 数据转换逻辑
    return { ...item, processed: true }
  }
}
```

#### @performanceBenchmark(options?)

为类方法添加基准测试功能。

```typescript
import { performanceBenchmark } from '@mudssky/jsutils'

class Algorithm {
  @performanceBenchmark({
    iterations: 1000,
    warmupIterations: 100,
    collectMemory: true,
  })
  sortArray(arr: number[]) {
    return [...arr].sort((a, b) => a - b)
  }

  @performanceBenchmark({
    iterations: 500,
    onResult: (name, result) => {
      // 自定义结果处理
      this.sendMetricsToServer(name, result)
    },
  })
  searchElement(arr: any[], target: any) {
    return arr.indexOf(target)
  }

  private sendMetricsToServer(name: string, result: any) {
    // 发送指标到服务器
  }
}
```

#### @performanceCompare(groupName, options?)

为同一组的多个方法进行性能比较。

```typescript
import {
  performanceCompare,
  getPerformanceReport,
  clearPerformanceData,
} from '@mudssky/jsutils'

class SortingAlgorithms {
  @performanceCompare('sorting', { iterations: 1000 })
  bubbleSort(arr: number[]) {
    // 冒泡排序实现
    const result = [...arr]
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result.length - i - 1; j++) {
        if (result[j] > result[j + 1]) {
          ;[result[j], result[j + 1]] = [result[j + 1], result[j]]
        }
      }
    }
    return result
  }

  @performanceCompare('sorting', { iterations: 1000 })
  quickSort(arr: number[]) {
    // 快速排序实现
    if (arr.length <= 1) return arr
    const pivot = arr[Math.floor(arr.length / 2)]
    const left = arr.filter((x) => x < pivot)
    const middle = arr.filter((x) => x === pivot)
    const right = arr.filter((x) => x > pivot)
    return [...this.quickSort(left), ...middle, ...this.quickSort(right)]
  }

  @performanceCompare('sorting', { iterations: 1000 })
  mergeSort(arr: number[]) {
    // 归并排序实现
    if (arr.length <= 1) return arr
    const mid = Math.floor(arr.length / 2)
    const left = this.mergeSort(arr.slice(0, mid))
    const right = this.mergeSort(arr.slice(mid))
    return this.merge(left, right)
  }

  private merge(left: number[], right: number[]): number[] {
    const result = []
    let i = 0,
      j = 0
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        result.push(left[i++])
      } else {
        result.push(right[j++])
      }
    }
    return result.concat(left.slice(i)).concat(right.slice(j))
  }

  // 获取排序算法性能比较报告
  showSortingComparison() {
    console.log(getPerformanceReport('sorting'))
  }

  // 清除性能数据
  clearData() {
    clearPerformanceData('sorting')
  }
}
```

### 性能数据管理

#### getPerformanceReport(groupName)

获取指定组的性能比较报告。

```typescript
import { getPerformanceReport } from '@mudssky/jsutils'

// 获取特定组的报告
const report = getPerformanceReport('sorting')
console.log(report)
```

#### clearPerformanceData(groupName?)

清除性能数据。

```typescript
import { clearPerformanceData } from '@mudssky/jsutils'

// 清除特定组的数据
clearPerformanceData('sorting')

// 清除所有数据
clearPerformanceData()
```

## 实际应用示例

### 示例 1: API 性能监控

```typescript
import { performanceMonitor } from '@mudssky/jsutils'

class ApiService {
  @performanceMonitor({ logResult: true })
  async fetchUserData(userId: string) {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  }

  @performanceMonitor({
    iterations: 5,
    onResult: (name, result) => {
      if (result.duration > 1000) {
        console.warn(`API ${name} 响应时间过长: ${result.duration}ms`)
      }
    },
  })
  async batchProcessUsers(userIds: string[]) {
    return Promise.all(userIds.map((id) => this.fetchUserData(id)))
  }
}
```

### 示例 2: 数据处理性能优化

```typescript
import { performanceCompare, getPerformanceReport } from '@mudssky/jsutils'

class DataProcessor {
  @performanceCompare('dataProcessing')
  processWithForLoop(data: any[]) {
    const result = []
    for (let i = 0; i < data.length; i++) {
      result.push(this.transform(data[i]))
    }
    return result
  }

  @performanceCompare('dataProcessing')
  processWithMap(data: any[]) {
    return data.map((item) => this.transform(item))
  }

  @performanceCompare('dataProcessing')
  processWithReduce(data: any[]) {
    return data.reduce((acc, item) => {
      acc.push(this.transform(item))
      return acc
    }, [])
  }

  private transform(item: any) {
    return { ...item, timestamp: Date.now() }
  }

  // 分析不同处理方法的性能
  analyzePerformance() {
    const testData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random(),
    }))

    this.processWithForLoop(testData)
    this.processWithMap(testData)
    this.processWithReduce(testData)

    console.log(getPerformanceReport('dataProcessing'))
  }
}
```

### 示例 3: 算法性能基准测试

```typescript
import { PerformanceMonitor } from '@mudssky/jsutils'

class AlgorithmBenchmark {
  private monitor = new PerformanceMonitor()

  benchmarkSearchAlgorithms() {
    const data = Array.from({ length: 10000 }, (_, i) => i)
    const target = 5000

    const algorithms = [
      () => data.indexOf(target), // 线性搜索
      () => this.binarySearch(data, target), // 二分搜索
      () => data.find((x) => x === target), // Array.find
      () => data.includes(target), // Array.includes
    ]

    const results = this.monitor.benchmark(algorithms, {
      iterations: 1000,
      warmupIterations: 100,
    })

    const labels = ['线性搜索', '二分搜索', 'Array.find', 'Array.includes']
    const report = this.monitor.createReport(results, labels)
    console.log(report)
  }

  private binarySearch(arr: number[], target: number): number {
    let left = 0
    let right = arr.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      if (arr[mid] === target) return mid
      if (arr[mid] < target) left = mid + 1
      else right = mid - 1
    }

    return -1
  }
}
```

## 最佳实践

### 1. 性能监控的时机

- **开发阶段**: 使用装饰器监控关键方法的性能
- **测试阶段**: 进行全面的性能基准测试
- **生产环境**: 谨慎使用，避免影响实际性能

### 2. 配置建议

```typescript
// 开发环境配置
const devConfig = {
  iterations: 10,
  logResult: true,
  collectMemory: true,
}

// 生产环境配置
const prodConfig = {
  iterations: 1,
  logResult: false,
  collectMemory: false,
}

// 根据环境选择配置
const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig
```

### 3. 内存监控注意事项

- 内存监控会增加额外开销，在性能敏感的场景中谨慎使用
- 大量迭代时建议关闭内存监控
- 定期清理性能数据，避免内存泄漏

### 4. 异步方法监控

```typescript
class AsyncService {
  @performanceMonitor({ logResult: true })
  async processData(data: any[]) {
    // 异步方法会自动等待 Promise 完成
    const results = await Promise.all(
      data.map((item) => this.processItem(item)),
    )
    return results
  }

  private async processItem(item: any) {
    // 模拟异步处理
    await new Promise((resolve) => setTimeout(resolve, 10))
    return { ...item, processed: true }
  }
}
```

### 5. 错误处理

```typescript
class RobustService {
  @performanceMonitor({
    logResult: true,
    onError: (error, methodName) => {
      console.error(`方法 ${methodName} 执行出错:`, error)
      // 发送错误报告到监控系统
    },
  })
  riskyOperation(data: any) {
    if (!data) {
      throw new Error('数据不能为空')
    }
    return this.processData(data)
  }

  private processData(data: any) {
    // 可能出错的数据处理逻辑
    return data.map((item) => item.value * 2)
  }
}
```

## 总结

性能监控模块和装饰器为 JavaScript/TypeScript 应用提供了强大的性能分析能力：

- **PerformanceMonitor**: 提供底层的性能测试 API
- **装饰器**: 提供声明式的性能监控方式
- **比较工具**: 帮助选择最优的算法和实现
- **报告生成**: 生成易读的性能分析报告

通过合理使用这些工具，可以有效识别性能瓶颈，优化代码性能，提升应用的整体表现。
