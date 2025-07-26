/**
 * 转义正则表达式中的特殊字符
 *
 * 将字符串中的正则表达式特殊字符进行转义，使其可以作为字面量在正则表达式中使用。
 * 这对于动态构建正则表达式时处理用户输入非常有用。
 *
 * @param string - 需要转义的字符串
 * @returns 转义后的字符串，其中所有正则表达式特殊字符都被转义
 *
 * @example
 * ```typescript
 * // 转义包含特殊字符的字符串
 * escapeRegExp('Hello (world)') // 返回: 'Hello \\(world\\)'
 * escapeRegExp('$100.50') // 返回: '\\$100\\.50'
 * escapeRegExp('[a-z]+') // 返回: '\\[a-z\\]\\+'
 *
 * // 在正则表达式中使用转义后的字符串
 * const userInput = 'Hello (world)'
 * const escapedInput = escapeRegExp(userInput)
 * const regex = new RegExp(escapedInput, 'g')
 * const text = 'Say Hello (world) to everyone'
 * console.log(text.match(regex)) // ['Hello (world)']
 * ```
 *
 * @remarks
 * 该函数转义以下正则表达式特殊字符：
 * - `.` (点号) - 匹配任意字符
 * - `*` (星号) - 匹配零个或多个前面的字符
 * - `+` (加号) - 匹配一个或多个前面的字符
 * - `?` (问号) - 匹配零个或一个前面的字符
 * - `^` (脱字符) - 匹配字符串开始
 * - `$` (美元符) - 匹配字符串结束
 * - `{}` (大括号) - 量词
 * - `()` (圆括号) - 分组
 * - `|` (竖线) - 或操作符
 * - `[]` (方括号) - 字符类
 * - `\\` (反斜杠) - 转义字符
 * @public
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
