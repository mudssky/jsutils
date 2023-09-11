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

export { genAllCasesCombination }
