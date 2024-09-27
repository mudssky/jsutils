/**
 * 传入字符串，返回字符串中每个字母不同大小写情况的列表
 * @param str 输入字符串
 * @returns 返回列表
 * @example
 * ```ts
 * console.log(genAllCasesCombination('mb'))
 * -> [ 'mb', 'mB', 'Mb', 'MB' ]
 * ```
 * @public
 */
function genAllCasesCombination(str: string): string[] {
  const result: string[] = []
  const letterPattern = /[a-zA-Z]/
  let path = ''
  const dfs = (start: number) => {
    if (path.length === str.length) {
      result.push(path)
      return
    }
    for (let i = start; i < str.length; i++) {
      //  是字母的情况，有两种可能
      if (letterPattern.test(str[i])) {
        path += str[i].toLowerCase()
        dfs(i + 1)
        path = path.slice(0, -1)

        path += str[i].toUpperCase()
        dfs(i + 1)
        path = path.slice(0, -1)
      } else {
        // 不是字母的情况，直接加上
        path += str[i]
        dfs(i + 1)
        path = path.slice(0, -1)
      }
    }
  }
  dfs(0)
  return result
}

/**
 * 使用随机数生成uuid
 * @returns
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0 // 生成一个随机整数，范围在 0 到 15 之间
    const v = c === 'x' ? r : (r & 0x3) | 0x8 // 如果字符是 'x'，则保持随机数的值；如果是 'y'，则根据规范设置为 4
    return v.toString(16) // 将整数转换为十六进制字符串
  })
}

const base62Chars =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * 生成任意长度的base62随机字符串
 * 可以用于生成短链的编码
 * @param len
 * @returns
 */
function generateBase62Code(len = 6) {
  if (len < 0) {
    throw new Error('len must be greater than 0')
  }
  let str = ''
  for (let i = 0; i < len; i++) {
    // 生成0-61的随机数
    const num = Math.floor(Math.random() * 62)
    // str += base62Chars.charAt(num)
    str += base62Chars[num]
  }
  return str
}
/**
 * 模糊匹配字符串，忽略大小写
 * @param searchValue 用于匹配的字符串
 * @param targetString 匹配的目标字符串
 * @returns
 */
function fuzzyMatch(searchValue: string, targetString: string) {
  const pattern = new RegExp(searchValue, 'i')
  return pattern.test(targetString)
}

/**
 * 以.分割文件名，返回扩展名
 * @param fileName
 * @returns
 */
function getFileExt(fileName: string) {
  const parts = fileName.split('.')
  if (parts.length > 1) {
    return parts[parts.length - 1]
  }
  return ''
}
export {
  fuzzyMatch,
  genAllCasesCombination,
  generateBase62Code,
  generateUUID,
  getFileExt,
}
