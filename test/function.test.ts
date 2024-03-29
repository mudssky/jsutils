import { debounce, throttle } from '@mudssky/jsutils'
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
