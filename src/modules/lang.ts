/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 获取值的类型标签
 * @param value - 要检查的值
 * @returns 类型标签字符串
 * @public
 */
function getTag(value: any) {
  const toString = Object.prototype.toString
  if (value == null) {
    return value === undefined ? '[object Undefined]' : '[object Null]'
  }
  return toString.call(value)
}

/**
 *
 * @param value - 要检查的值
 * @returns 如果值为空则返回true，否则返回false
 * @example
 * isEmpty(null)
 * // =\> true
 *  * isEmpty(undefined)
 * // =\> true
 *
 * isEmpty(true)
 * // =\> true
 *
 * isEmpty(1)
 * // =\> true
 *
 * isEmpty([1, 2, 3])
 * // =\> false
 *
 * isEmpty('abc')
 * // =\> false
 *
 * isEmpty(\{ 'a': 1 \})
 * // =\> false
 */
// function isEmpty(value: any): boolean {
//   // 1. 判断 undefined 或 null
//   if (value === undefined || value === null) {
//     return true
//   }

//   // 2. 判断空字符串
//   if (typeof value === 'string' && value.length > 0) {
//     return false
//   }

//   // 3. 判断空数组
//   if (Array.isArray(value) && value.length > 0) {
//     return false
//   }

//   // 5. 判断空 Map 或 Set
//   if ((value instanceof Map || value instanceof Set) && value.size > 0) {
//     return false
//   }
//   // 4. 判断空对象
//   if (
//     typeof value === 'object' &&
//     !Array.isArray(value) &&
//     Object.keys(value).length > 0
//   ) {
//     return false
//   }

//   // 6. 默认返回 false，表示非空
//   return true
// }

export { getTag }
