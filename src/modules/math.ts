import { ArgumentError } from './error'

/**
 * 生成[start,end)范围的整数随机数
 * @param startInt 起始值
 * @param endInt 结束值（不包含）
 * @returns [start,end)中的一个随机数
 * @public
 * @example
 * ```ts
 * randomInt(100)
 * randomInt(0,100)
 * ```
 */
function randomInt(startInt: number, endInt?: number) {
  // 只传入一个参数时进行处理
  if (endInt === undefined) {
    endInt = startInt
    startInt = 0
  }
  if (startInt > endInt) {
    throw new ArgumentError('startInt shoud be less than or equal to endInt')
  }
  const min = Math.ceil(startInt)
  const max = Math.floor(endInt)

  return Math.floor(Math.random() * (max - min)) + min
}
export { randomInt }
