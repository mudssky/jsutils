import { createPolling, debounce, throttle } from '@mudssky/jsutils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
function sum(...args: number[]) {
  return args.reduce((a, b) => a + b, 0)
}

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  // 检查传参是否正确
  test('should call the function with the correct arguments', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 1000)
    debouncedFn(1, 2, 3)
    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledWith(1, 2, 3)
  })
  // 检查是否实现防抖功能
  test('should not call the function during wait', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 1000)
    debouncedFn(1, 2, 3)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(100)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(100)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(800)
    expect(fn).toBeCalled()
    expect(fn).toHaveBeenCalledWith(1, 2, 3)
    const debouncedSum = debounce(() => sum(1, 2, 3), 1000)
    debouncedSum()
    vi.advanceTimersByTime(1000)
    const res = debouncedSum()
    expect(res).toBe(6)
    // vi.advanceTimersByTime(1000)
    // const res2 = debouncedSum()
    // expect(res2).toBe(6)
  })
  test('should reset timer when call function during wait', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 1000)
    debouncedFn(1, 2, 3)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(200)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(700)
    expect(fn).not.toBeCalled()
    debouncedFn(1, 2, 3)
    vi.advanceTimersByTime(100)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(900)
    expect(fn).toHaveBeenCalledWith(1, 2, 3)
  })
  // tariling和leading都为false时，应该可以在延迟·时间过后，手动调用函数
  test.concurrent(
    'can manually execute,when tariling and leading is false',
    () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 1000, {
        trailing: false,
        leading: false,
      })
      // 时间未到前不能调用
      debouncedFn(1, 2, 3)
      expect(fn).not.toBeCalled()
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()
      // 时间到了，可以手动调用
      vi.advanceTimersByTime(800)
      debouncedFn(1, 2, 3)
      expect(fn).toBeCalled()
      // expect(fn).toHaveBeenCalledWith(1, 2, 3)
    },
  )

  test.concurrent(
    'should only excute function first,when leading is true,trailing is false',
    () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 1000, {
        trailing: false,
        leading: true,
      })
      // 第一次立即调用
      debouncedFn(1, 2, 3)
      expect(fn).toHaveBeenNthCalledWith(1, 1, 2, 3)
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      // 调用后的延时无法调用
      debouncedFn(1, 2, 3)
      expect(fn).toHaveBeenCalledTimes(1)
      //延时结束，不会调用trailing
      vi.advanceTimersByTime(1000)
      expect(fn).toHaveBeenCalledTimes(1)
      // 手动触发第一次leading调用
      debouncedFn(1, 2, 3)

      expect(fn).toHaveBeenNthCalledWith(2, 1, 2, 3)
    },
  )
  test.concurrent(
    'should only excute function after delay ,when leading is false,trailing is true',
    () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 1000, {
        trailing: true,
        leading: false,
      })
      const args = [1, 2, 3]
      // 会延迟执行
      debouncedFn(...args)
      expect(fn).not.toBeCalled()
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()

      // 时间到了会自动执行
      vi.advanceTimersByTime(800)

      expect(fn).toHaveBeenNthCalledWith(1, ...args)
      // 手动触发
      debouncedFn(1, 2, 3)
      // 同样不会立刻调用
      expect(fn).not.toBeCalledTimes(2)
    },
  )
  test.concurrent(
    'should both excute first and after delay ,when leading is true,trailing is true',
    () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 1000, {
        trailing: true,
        leading: true,
      })
      const args = [1, 2, 3]
      // 会立刻执行
      debouncedFn(...args)
      expect(fn).toHaveBeenNthCalledWith(1, ...args)
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenNthCalledWith(1, ...args)
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenNthCalledWith(1, ...args)

      // 时间到了会自动执行
      vi.advanceTimersByTime(800)

      expect(fn).toHaveBeenNthCalledWith(2, ...args)
      // 手动触发
      debouncedFn(...args)
      // 会立刻调用
      expect(fn).toHaveBeenNthCalledWith(3, ...args)
    },
  )

  test.concurrent('should support cancel', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 1000)
    const args = [1, 2, 3]
    // 不会立刻执行
    debouncedFn(...args)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(100)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(100)
    expect(fn).not.toBeCalled()

    expect(debouncedFn.pending()).toBe(true)
    // 提前取消
    debouncedFn.cancel()
    expect(debouncedFn.pending()).toBe(false)
    vi.advanceTimersByTime(800)

    expect(fn).not.toBeCalled()
    // 手动触发
    debouncedFn(...args)
    expect(debouncedFn.pending()).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(debouncedFn.pending()).toBe(false)
    expect(fn).toHaveBeenNthCalledWith(1, ...args)
  })

  test.concurrent('should support flush', () => {
    const args = [1, 2, 3]

    const debouncedFn = debounce(() => sum(...args), 1000)
    debouncedFn()
    vi.advanceTimersByTime(100)
    expect(debouncedFn.pending()).toBe(true)
    const res = debouncedFn.flush()
    expect(debouncedFn.pending()).toBe(false)
    expect(res).toBe(6)
    // 测试trailing执行后，再执行flush
    debouncedFn()
    vi.advanceTimersByTime(1000)
    const res2 = debouncedFn.flush()
    expect(res2).toBe(6)
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  // 检查传参是否正确
  test.concurrent('should call the function with the correct arguments', () => {
    const fn = vi.fn()
    const throttleFn = throttle(fn, 1000)
    throttleFn(1, 2, 3)
    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledWith(1, 2, 3)
  })
  // 检查是否实现节流，延迟期间不能调用
  test.concurrent('should call the function with the correct arguments', () => {
    const fn = vi.fn()
    const throttleFn = throttle(fn, 1000)
    throttleFn(1, 2, 3)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledWith(1, 2, 3)
    throttleFn(1, 2, 3)
    vi.advanceTimersByTime(800)
    expect(fn).not.toBeCalledTimes(2)
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenNthCalledWith(2, 1, 2, 3)
    for (let index = 0; index < 10; index++) {
      throttleFn(1, 2, 3)
      vi.advanceTimersByTime(800)
    }
    // expect(fn).toHaveBeenNthCalledWith(12, 1, 2, 3)
    expect(fn).toBeCalledTimes(7)
  })

  test('should not reset timer when call function during wait', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 1000)
    throttledFn(1, 2, 3)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(200)
    expect(fn).not.toBeCalled()
    throttledFn(1, 2, 3)
    vi.advanceTimersByTime(800)
    expect(fn).toHaveBeenCalledWith(1, 2, 3)
    throttledFn(1, 2, 3)
  })

  test.concurrent(
    'can manually execute,when tariling and leading is false',
    () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 1000, {
        trailing: false,
        leading: false,
      })
      // 时间未到前不能调用
      throttledFn(1, 2, 3)
      expect(fn).not.toBeCalled()
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()
      // 时间到了，可以手动调用
      vi.advanceTimersByTime(800)
      throttledFn(1, 2, 3)
      expect(fn).toBeCalled()
      // expect(fn).toHaveBeenCalledWith(1, 2, 3)
    },
  )

  test.concurrent(
    'should only excute function first,when leading is true,trailing is false',
    () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 1000, {
        trailing: false,
        leading: true,
      })
      // 第一次立即调用
      throttledFn(1, 2, 3)
      expect(fn).toHaveBeenNthCalledWith(1, 1, 2, 3)
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      // 调用后的延时无法调用
      throttledFn(1, 2, 3)
      expect(fn).toHaveBeenCalledTimes(1)
      //延时结束，不会调用trailing
      vi.advanceTimersByTime(1000)
      expect(fn).toHaveBeenCalledTimes(1)
      // 手动触发第一次leading调用
      throttledFn(1, 2, 3)

      expect(fn).toHaveBeenNthCalledWith(2, 1, 2, 3)
    },
  )
  test.concurrent(
    'should only excute function after delay ,when leading is false,trailing is true',
    () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 1000, {
        trailing: true,
        leading: false,
      })
      const args = [1, 2, 3]
      // 会延迟执行
      throttledFn(...args)
      expect(fn).not.toBeCalled()
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()

      // 时间到了会自动执行
      vi.advanceTimersByTime(800)

      expect(fn).toHaveBeenNthCalledWith(1, ...args)
      // 手动触发
      throttledFn(1, 2, 3)
      // 同样不会立刻调用
      expect(fn).not.toBeCalledTimes(2)
    },
  )
  test.concurrent(
    'should both excute first and after delay ,when leading is true,trailing is true',
    () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 1000, {
        trailing: true,
        leading: true,
      })
      const args = [1, 2, 3]
      // 会立刻执行
      throttledFn(...args)
      expect(fn).toHaveBeenNthCalledWith(1, ...args)
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenNthCalledWith(1, ...args)
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenNthCalledWith(1, ...args)

      // 时间到了会自动执行
      vi.advanceTimersByTime(800)

      expect(fn).toHaveBeenNthCalledWith(2, ...args)
      // 手动触发
      throttledFn(...args)
      // 会立刻调用
      expect(fn).toHaveBeenNthCalledWith(3, ...args)
    },
  )

  test.concurrent('should support cancel', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 1000)
    const args = [1, 2, 3]
    // 不会立刻执行
    throttledFn(...args)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(100)
    expect(fn).not.toBeCalled()
    vi.advanceTimersByTime(100)
    expect(fn).not.toBeCalled()
    // 提前取消
    throttledFn.cancel()
    vi.advanceTimersByTime(800)
    expect(fn).not.toBeCalled()
    // 手动触发
    throttledFn(...args)
    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenNthCalledWith(1, ...args)
  })

  test.concurrent('should support flush', () => {
    const args = [1, 2, 3]

    const throttledFn = throttle(() => sum(...args), 1000)
    throttledFn()
    vi.advanceTimersByTime(100)

    const res = throttledFn.flush()
    expect(res).toBe(6)
    // 测试trailing执行后，再执行flush
    throttledFn()
    vi.advanceTimersByTime(1000)
    const res2 = throttledFn.flush()
    expect(res2).toBe(6)
  })
})

describe('createPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  test('正常启动和停止轮询', async () => {
    const task = vi.fn().mockResolvedValue('data')
    const polling = createPolling({
      task,
      stopCondition: (res) => res === 'done',
      interval: 1000,
    })

    polling.start()
    expect(task).not.toBeCalled()

    vi.advanceTimersByTime(1000)
    await Promise.resolve()
    expect(task).toBeCalledTimes(1)

    polling.stop()
    vi.advanceTimersByTime(2000)
    expect(task).toBeCalledTimes(1)
  })

  test('满足停止条件时自动终止', async () => {
    let count = 0
    const task = vi.fn().mockImplementation(async () => {
      return ++count
    })

    const polling = createPolling({
      task,
      stopCondition: (res) => res === 3,
      interval: 500,
    })

    polling.start()

    vi.advanceTimersByTime(500)
    await Promise.resolve()
    expect(count).toBe(1)

    vi.advanceTimersByTime(500)
    await Promise.resolve()
    expect(count).toBe(2)

    vi.advanceTimersByTime(500)
    await Promise.resolve()
    expect(count).toBe(3)

    // 应该停止执行
    vi.advanceTimersByTime(1500)
    expect(count).toBe(3)
  })

  test('错误重试机制', async () => {
    const errorMock = vi.fn()
    let attempt = 0

    const task = vi.fn().mockImplementation(async () => {
      attempt++
      if (attempt < 3) throw new Error('retry')
      return 'success'
    })

    const polling = createPolling({
      task,
      stopCondition: (res) => res === 'success',
      errorAction: errorMock,
      maxRetries: 5,
      interval: 1000,
    })

    polling.start()

    vi.advanceTimersByTime(1000)
    await Promise.resolve()
    expect(errorMock).toBeCalledTimes(1)

    vi.advanceTimersByTime(1000)
    await Promise.resolve()
    expect(errorMock).toBeCalledTimes(2)

    vi.advanceTimersByTime(1000)
    await Promise.resolve()
    expect(task).toHaveResolvedWith('success')
  })

  test('立即执行配置', async () => {
    const task = vi.fn().mockImplementation(async () => {
      return 'success'
    })
    const polling = createPolling({
      task,
      stopCondition: () => false,
      immediate: true,
      interval: 2000,
    })

    polling.start()
    await Promise.resolve()
    expect(task).toHaveResolvedTimes(1)
    vi.advanceTimersToNextTimer()
    await Promise.resolve()
    expect(task).toHaveResolvedTimes(2)
  })

  test('进度回调执行', async () => {
    const progressMock = vi.fn()
    const results = [1, 2, 3]
    let index = 0

    const polling = createPolling({
      task: () => Promise.resolve(results[index++]),
      stopCondition: (res) => res === 3,
      onProgress: progressMock,
      interval: 500,
    })

    polling.start()

    vi.advanceTimersByTime(500)
    await Promise.resolve()
    expect(progressMock).toBeCalledWith(1)

    vi.advanceTimersByTime(500)
    await Promise.resolve()
    expect(progressMock).toBeCalledWith(2)

    vi.advanceTimersByTime(500)
    await Promise.resolve()
    expect(progressMock).toBeCalledWith(3)
  })
})
