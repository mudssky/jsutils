import { debounce } from '@mudssky/jsutil'
import { beforeEach, describe, expect, test, vi } from 'vitest'

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
  })
  // tariling和leading都为false时，应该可以在延迟·时间过后，手动调用函数
  test.skip('can manually execute,when tariling and leading is false', () => {
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
  })

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
      vi.advanceTimersByTime(800)
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
        leading: false,
      })
      const args = [1, 2, 3]
      // 会立刻执行
      debouncedFn(...args)
      expect(fn).toHaveBeenNthCalledWith(1, ...args)
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()
      vi.advanceTimersByTime(100)
      expect(fn).not.toBeCalled()

      // 时间到了会自动执行
      vi.advanceTimersByTime(800)

      expect(fn).toHaveBeenNthCalledWith(2, ...args)
      // 手动触发
      debouncedFn(...args)
      // 会立刻调用
      expect(fn).toHaveBeenNthCalledWith(3, ...args)
    },
  )
})
