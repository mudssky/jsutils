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

/**
 * 解析模板字符串，并将占位符替换为数据对象中的值。
 * @param str - 包含占位符的模板字符串。
 * @param data - 一个记录，其键是占位符的名称（不带括号），值是替换内容。
 * @param regex - 用于匹配占位符的正则表达式。默认为 /\{\{(.+?)\}\}/g，匹配 {{placeholder}} 格式。
 * @returns 替换占位符后的字符串。
 * @example
 * ```ts
 * const template = "Hello {{name}}, welcome to {{place}}!";
 * const data = { name: "World", place: "our app" };
 * console.log(parseTemplate(template, data));
 * // -> "Hello World, welcome to our app!"
 *
 * const customTemplate = "Hi <user>, your id is <id>.";
 * const customData = { user: "Alex", id: "123" };
 * const customRegex = /<(.+?)>/g;
 * console.log(parseTemplate(customTemplate, customData, customRegex));
 * // -> "Hi Alex, your id is 123."
 * ```
 * @public
 */
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

/**
 * 移除字符串两端指定的字符。
 * @param str - 需要修剪的原始字符串，可以为 null。
 * @param charsToTrim - 一个包含需要移除字符的字符串，默认为空格。这些字符将被视为一个集合，任何在开头或结尾处匹配此集合中字符的实例都将被移除。
 * @returns 修剪后的字符串。如果输入字符串为 null 或 undefined，则返回空字符串。
 * @example
 * ```ts
 * console.log(trim("  hello world  ")); // -> "hello world"
 * console.log(trim("__hello__", "_")); // -> "hello"
 * console.log(trim("-!-hello-!-", "-!")); // -> "hello"
 * console.log(trim("/path/to/file/", "/")); // -> "path/to/file"
 * console.log(trim(null)); // -> ""
 * ```
 * @public
 */
const trim = (str: Nullable<string>, charsToTrim: string = ' ') => {
  if (!str) return ''
  // 转义替换字符串中的特殊字符
  const toTrim = charsToTrim.replace(/[\W]{1}/g, '\\$&')
  // 构建正则，全局替换toTrim分别为开头和结尾的情况
  const regex = new RegExp(`^[${toTrim}]+|[${toTrim}]+$`, 'g')
  return str.replace(regex, '')
}

/**
 * 移除字符串开头指定的字符。
 * @param str - 需要修剪的原始字符串，可以为 null。
 * @param charsToTrim - 一个包含需要移除字符的字符串，默认为空格。这些字符将被视为一个集合，任何在开头处匹配此集合中字符的实例都将被移除。
 * @returns 从开头修剪后的字符串。如果输入字符串为 null 或 undefined，则返回空字符串。
 * @example
 * ```ts
 * console.log(trimStart("  hello world  ")); // -> "hello world  "
 * console.log(trimStart("__hello__", "_")); // -> "hello__"
 * console.log(trimStart("-!-hello-!-", "-!")); // -> "hello-!-"
 * console.log(trimStart("/path/to/file/", "/")); // -> "path/to/file/"
 * console.log(trimStart(null)); // -> ""
 * ```
 * @public
 */
const trimStart = (str: Nullable<string>, charsToTrim: string = ' ') => {
  if (!str) return ''
  const toTrim = charsToTrim.replace(/[\W]{1}/g, '\\$&')
  const regex = new RegExp(`^[${toTrim}]+`, 'g')
  return str.replace(regex, '')
}

/**
 * 移除字符串末尾指定的字符。
 * @param str - 需要修剪的原始字符串，可以为 null。
 * @param charsToTrim - 一个包含需要移除字符的字符串，默认为空格。这些字符将被视为一个集合，任何在末尾处匹配此集合中字符的实例都将被移除。
 * @returns 从末尾修剪后的字符串。如果输入字符串为 null 或 undefined，则返回空字符串。
 * @example
 * ```ts
 * console.log(trimEnd("  hello world  ")); // -> "  hello world"
 * console.log(trimEnd("__hello__", "_")); // -> "__hello"
 * console.log(trimEnd("-!-hello-!-", "-!")); // -> "-!-hello"
 * console.log(trimEnd("/path/to/file/", "/")); // -> "/path/to/file"
 * console.log(trimEnd(null)); // -> ""
 * ```
 * @public
 */
const trimEnd = (str: Nullable<string>, charsToTrim: string = ' ') => {
  if (!str) return ''
  const toTrim = charsToTrim.replace(/[\W]{1}/g, '\\$&')
  const regex = new RegExp(`[${toTrim}]+$`, 'g')
  return str.replace(regex, '')
}

/**
 * 移除字符串中指定的前缀
 * @param str - 原始字符串
 * @param prefix - 需要移除的前缀
 * @returns 移除前缀后的字符串，如果原始字符串不以该前缀开头则返回原字符串
 * @example
 * ```ts
 * console.log(removePrefix("hello world", "hello ")); // -> "world"
 * console.log(removePrefix("__hello__", "__")); // -> "hello__"
 * console.log(removePrefix("test", "no")); // -> "test"
 * console.log(removePrefix(null, "prefix")); // -> ""
 * ```
 * @public
 */
const removePrefix = (str: Nullable<string>, prefix: string): string => {
  if (!str || !prefix) return str || ''
  return str.startsWith(prefix) ? str.slice(prefix.length) : str
}

/**
 * 根据输入的分支数组生成合并路径
 * @param branches - 分支名称数组，按照合并顺序排列
 * @returns 返回合并路径数组，每个路径包含两个分支名称，表示从第一个分支合并到第二个分支
 * @example
 * ```ts
 * console.log(generateMergePaths(['dev-xxx', 'dev', 'test']))
 * // -> [['dev-xxx','dev'], ['dev','test']]
 *
 * console.log(generateMergePaths(['feature', 'dev', 'test', 'prod']))
 * // -> [['feature','dev'], ['dev','test'], ['test','prod']]
 * ```
 * @public
 */
function generateMergePaths(branches: string[]): string[][] {
  const paths: string[][] = []
  if (branches.length < 2) {
    return paths
  }
  for (let i = 0; i < branches.length - 1; i++) {
    paths.push([branches[i], branches[i + 1]])
  }
  return paths
}

export {
  camelCase,
  capitalize,
  dashCase,
  fuzzyMatch,
  genAllCasesCombination,
  generateBase62Code,
  generateMergePaths,
  generateUUID,
  getFileExt,
  parseTemplate,
  PascalCase,
  removePrefix,
  snake_case,
  trim,
  trimEnd,
  trimStart,
}
