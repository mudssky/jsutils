import { ArgumentError } from './error'

/**
 * 函数“range”返回一个数字数组，该数组从给定的起始值开始，按给定的步长值递增，并以给定的结束值结束（可选）。
 * @param  start - start 参数是范围的起始值
 * @param  end - “end”参数是一个可选参数，用于指定范围的结束值。如果未提供，则范围将是[0,start）。
 * @param step - “step”参数是一个可选参数，用于指定范围内每个值之间的增量。如果未提供，则默认为 1。
 * @returns [start,end)范围的，按照step步长的整数组成的数组
 * @example
 * ```ts
 * console.log(range(1,3))
 * // print [1,2]
 * ```
 * @public
 */
function range(start: number, end?: number, step = 1) {
  return Array.from(rangeIter(start, end, step))
}

/**
 * 函数“range”返回一个数字数组，该数组从给定的起始值开始，按给定的步长值递增，并以给定的结束值结束（可选）。
 * @param  start - start 参数是范围的起始值
 * @param  end - “end”参数是一个可选参数，用于指定范围的结束值。如果未提供，则范围将是[0,start）。
 * @param step - “step”参数是一个可选参数，用于指定范围内每个值之间的增量。如果未提供，则默认为 1。
 * @returns [start,end)范围的，按照step步长的整数生成器。
 * @example
 * ```ts
 * for (const num of rangeIter(1,8)){
 * console.log(num)
 * }
 * ```
 * @public
 */
function* rangeIter(start: number, end?: number, step = 1) {
  let actualStart = start
  let actualEnd = end
  // 判断只有一个参数的情况，区间从0到start
  if (typeof actualEnd === 'undefined') {
    actualEnd = start
    actualStart = 0
  }

  // 进行参数检查
  if (step === 0) {
    throw new ArgumentError('step can not be zero')
  }

  // 参数需要都是整数
  if (
    !(
      Number.isInteger(actualStart) &&
      Number.isInteger(actualEnd) &&
      Number.isInteger(step)
    )
  ) {
    throw new ArgumentError('unsupport decimal number')
  }
  if (step > 0) {
    for (let i = actualStart; i < actualEnd; i += step) {
      yield i
    }
  } else {
    for (let i = actualStart; i > actualEnd; i += step) {
      yield i
    }
  }
}

export { range, rangeIter }
