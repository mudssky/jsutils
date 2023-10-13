/**
 * 创建一个防抖函数，该函数会从上一次被调用后，延迟 wait 毫秒后调用 func 方法。debounced函数提供一个cancel方法，
 * 以及flush方法立即调用。
 * options选项中，可以设置options.leading 与|或 options.trailing 决定延迟前后如何触发
 * 如果leading和trailing都为false，则函数不会立刻触发，也不会延迟后触发，而是需要我们手动触发
 * @param func
 * @param wait
 * @param options
 * @returns
 */
function debounce(
  func: (...args: unknown[]) => unknown,
  wait = 200,
  options: {
    leading?: boolean
    trailing?: boolean
  } = {
    leading: false,
    trailing: true,
  },
) {
  let timerId: ReturnType<typeof setTimeout> | undefined
  // 判断leading是否执行过了
  let leadingExecuted = false

  function debounced(this: unknown, ...args: unknown[]) {
    const execute = () => {
      func.apply(this, args)
      leadingExecuted = false
    }
    // 定时器设置后，等待定时器执行完才能再次执行
    if (!timerId) {
      // 需要leading，并且leading未执行，则执行
      if (options.leading && !leadingExecuted) {
        execute()
        leadingExecuted = true
      }

      // 如果需要 trailing，则在 wait 毫秒后执行
      timerId = setTimeout(() => {
        timerId = undefined
        leadingExecuted = false
        if (options.trailing) {
          execute()
        }
      }, wait)

      // trailing和leading都为false的清空，则
    }
  }

  return debounced
}

export { debounce }
