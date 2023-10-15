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
  let isLeadingExecuted = false
  // 判断trailing是否执行过
  let isTrailingExcuted = false

  // 记录闭包函数的参数，用于在外层执行函数
  let lastArgs: unknown[]
  let lastThis: unknown
  let funcRes: unknown = undefined

  function invokeFunc() {
    // 执行函数
    funcRes = func.apply(lastThis, lastArgs)
    // 重置状态
    resetState()
    return funcRes
  }
  function resetState() {
    isLeadingExecuted = false
    isTrailingExcuted = false
  }
  function startTimer() {
    // 定时器设置后，等待定时器执行完才能再次执行
    if (timerId === undefined) {
      // 需要leading，并且leading未执行，则执行
      if (options.leading && !isLeadingExecuted) {
        invokeFunc()
        isLeadingExecuted = true
      }
      // 都为false时，额可以在trailing执行完后手动调用。
      if (!options.leading && !options.trailing && isTrailingExcuted === true) {
        invokeFunc()
        isTrailingExcuted = false
      }
      // 如果需要 trailing，则在 wait 毫秒后执行
      timerId = setTimeout(() => {
        if (options.trailing) {
          invokeFunc()
        }
        // trailing结束后重置状态
        isLeadingExecuted = false
        // 这个只有trailing和leading都为false时判断会用到，其他时候无影响
        isTrailingExcuted = true
        timerId = undefined
      }, wait)
    }
  }
  function debounced(this: unknown, ...args: unknown[]) {
    // 记录函数参数
    lastArgs = args
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this
    // 防抖，若定时器启动时执行，则重新执行定时器
    if (timerId === undefined) {
      startTimer()
      // 返回值，定时器结束后返回，每次返回的都是上次的计算结果
      if (funcRes !== undefined) {
        return funcRes
      }
    } else {
      clearTimeout(timerId)
      timerId = undefined
      startTimer()
    }
  }

  debounced.cancel = () => {
    clearTimeout(timerId)
    timerId = undefined
    resetState()
  }
  // 定时器设置了，说明处于pending状态。
  debounced.pending = () => {
    return timerId !== undefined
  }
  debounced.flush = () => {
    if (timerId === undefined) {
      return funcRes
    } else {
      clearTimeout(timerId)
      timerId = undefined
      resetState()
      invokeFunc()
      return funcRes
    }
  }

  return debounced
}

// 基础版防抖
// function debounce(
//   func: (...args: unknown[]) => unknown,
//   wait = 200,
// ) {
//   let timerId: ReturnType<typeof setTimeout> | null = null
//   const debounced = function (this: unknown, ...args: unknown[]) {
//     if (timerId) {
//       clearTimeout(timerId)
//     }

//     timerId = setTimeout(() => {
//       func.apply(this, args)
//       timerId = null
//     }, wait)
//   }
//   return debounced
// }

// 基础版节流
// function throttle(func: (...args: unknown[]) => unknown, wait = 200) {
//   let timerId: ReturnType<typeof setTimeout> | null = null
//   const throttled = function (this: unknown, ...args: unknown[]) {
//     if (!timerId) {
//       timerId = setTimeout(() => {
//         func.apply(this, args)
//         timerId = null
//       }, wait)
//     }
//   }

//   return throttled
// }
function throttle(
  func: (...args: unknown[]) => unknown,
  wait: number = 200,
  options: {
    leading: boolean
    trailing: boolean
  } = {
    leading: false,
    trailing: true,
  },
) {
  let timerId: ReturnType<typeof setTimeout> | null = null

  // 记录闭包函数的参数，用于在外层执行函数
  let lastArgs: unknown[]
  let lastThis: unknown
  let funcRes: unknown

  // 判断leading是否执行过了
  let isLeadingExecuted = false
  // 判断trailing是否执行过
  let isTrailingExcuted = false

  function invokeFunc() {
    funcRes = func.apply(lastThis, lastArgs)
    return funcRes
  }
  function resetState() {
    isLeadingExecuted = false
    isTrailingExcuted = false
  }
  function throttled(this: unknown, ...args: unknown[]) {
    lastArgs = args
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this

    if (!timerId) {
      if (options.leading && isLeadingExecuted === false) {
        invokeFunc()
        isLeadingExecuted = true
      }
      if (!options.leading && !options.trailing && isTrailingExcuted === true) {
        invokeFunc()
        // isLeadingExecuted = false
        isTrailingExcuted = false
      }
      timerId = setTimeout(() => {
        if (options.trailing) {
          invokeFunc()
        }
        timerId = null
        isLeadingExecuted = false
        isTrailingExcuted = true
      }, wait)
    }
  }

  throttled.cancel = () => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
      resetState()
    }
  }

  throttled.flush = () => {
    if (timerId === null) {
      return funcRes
    } else {
      clearTimeout(timerId)
      timerId = null
      resetState()
      return invokeFunc()
    }
  }
  return throttled
}

export { debounce, throttle }
