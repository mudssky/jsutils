import { Nullable } from '@/types'

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

/**
 * Capitalize the first word of the string
 *
 * capitalize('hello')   -> 'Hello'
 * capitalize('va va voom') -> 'Va va voom'
 */
const capitalize = (str: string): string => {
  if (!str || str.length === 0) return ''
  const lower = str.toLowerCase()
  return lower.substring(0, 1).toUpperCase() + lower.substring(1, lower.length)
}

/**
 * Formats the given string in camel case fashion
 *
 * camel('hello world')   -> 'helloWorld'
 * camel('va va-VOOM') -> 'vaVaVoom'
 * camel('helloWorld') -> 'helloWorld'
 */
const camelCase = (str: string): string => {
  const parts =
    str
      ?.replace(/([A-Z])+/g, capitalize)
      ?.split(/(?=[A-Z])|[.\-\s_]/)
      .map((x) => x.toLowerCase()) ?? []
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return parts.reduce((acc, part) => {
    return `${acc}${part.charAt(0).toUpperCase()}${part.slice(1)}`
  })
}

/**
 * Formats the given string in snake case fashion
 *
 * snake('hello world')   -> 'hello_world'
 * snake('va va-VOOM') -> 'va_va_voom'
 * snake('helloWord') -> 'hello_world'
 */
const snake_case = (
  str: string,
  options?: {
    splitOnNumber?: boolean
  },
): string => {
  const parts =
    str
      ?.replace(/([A-Z])+/g, capitalize)
      .split(/(?=[A-Z])|[.\-\s_]/)
      .map((x) => x.toLowerCase()) ?? []
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  const result = parts.reduce((acc, part) => {
    return `${acc}_${part.toLowerCase()}`
  })
  return options?.splitOnNumber === false
    ? result
    : result.replace(/([A-Za-z]{1}[0-9]{1})/, (val) => `${val[0]!}_${val[1]!}`)
}

/**
 * Formats the given string in dash case fashion
 *
 * dash('hello world')   -> 'hello-world'
 * dash('va va_VOOM') -> 'va-va-voom'
 * dash('helloWord') -> 'hello-word'
 */
const dashCase = (str: string): string => {
  const parts =
    str
      ?.replace(/([A-Z])+/g, capitalize)
      ?.split(/(?=[A-Z])|[.\-\s_]/)
      .map((x) => x.toLowerCase()) ?? []
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return parts.reduce((acc, part) => {
    return `${acc}-${part.toLowerCase()}`
  })
}

/**
 * Formats the given string in pascal case fashion
 *
 * pascal('hello world') -> 'HelloWorld'
 * pascal('va va boom') -> 'VaVaBoom'
 */
const PascalCase = (str: string): string => {
  const parts = str?.split(/[.\-\s_]/).map((x) => x.toLowerCase()) ?? []
  if (parts.length === 0) return ''
  return parts.map((str) => str.charAt(0).toUpperCase() + str.slice(1)).join('')
}

const parseTemplate = (
  str: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  regex = /\{\{(.+?)\}\}/g,
) => {
  return Array.from(str.matchAll(regex)).reduce((acc, match) => {
    return acc.replace(match[0], data[match[1]])
  }, str)
}

const trim = (str: Nullable<string>, charsToTrim: string = ' ') => {
  if (!str) return ''
  // 转义替换字符串中的特殊字符
  const toTrim = charsToTrim.replace(/[\W]{1}/g, '\\$&')
  // 构建正则，全局替换toTrim分别为开头和结尾的情况
  const regex = new RegExp(`^[${toTrim}]+|[${toTrim}]+$`, 'g')
  return str.replace(regex, '')
}

export {
  camelCase,
  capitalize,
  dashCase,
  fuzzyMatch,
  genAllCasesCombination,
  generateBase62Code,
  generateUUID,
  getFileExt,
  parseTemplate,
  PascalCase,
  snake_case,
  trim,
}
