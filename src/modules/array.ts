/**
 * 函数“range”返回一个数字数组，该数组从给定的起始值开始，按给定的步长值递增，并以给定的结束值结束（可选）。
 * @param {number} start - start 参数是范围的起始值。它是必需参数并且必须是数字。
 * @param {number} [end] - “end”参数是一个可选参数，用于指定范围的结束值。如果未提供，则范围将从“start”到“Infinity”生成。
 * @param [step=1] - “step”参数是一个可选参数，用于指定范围内每个值之间的增量。如果未提供，则默认为 1。
 * @returns 由 rangeIter 函数生成的数字数组。
 */
function range(start: number, end?: number, step = 1) {
  return Array.from(rangeIter(start, end, step))
}

/* `function* rangeIter(start: number, end?: number, step = 1)`
是一个生成器函数，它根据给定的参数生成数字序列。它接受三个参数：“start”、“end”和“step”。 */
function* rangeIter(start: number, end?: number, step = 1) {
  // 判断只有一个参数的情况，区间从0到start
  if (typeof end === 'undefined') {
    end = start
    start = 0
  }

  // 进行参数检查
  if (step === 0) {
    throw new Error('step can not be zero')
  }

  // 参数需要都是整数
  if (
    !(
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      Number.isInteger(step)
    )
  ) {
    throw new Error('unsupport decimal number')
  }
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      yield i
    }
  } else {
    for (let i = start; i > end; i += step) {
      yield i
    }
  }
}

export { range, rangeIter }
