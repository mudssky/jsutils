import path from 'node:path'
import { cwd } from 'node:process'

const ignoredDirs = ['.agents', '.claude', '.codex', '.trellis']

/**
 * 将 lint-staged 传入的绝对路径转换为仓库相对路径。
 *
 * @param {string[]} files lint-staged 匹配到的暂存文件路径。
 * @returns {string[]} 仓库根目录下的相对路径列表。
 */
const toRelativePaths = (files) =>
  files.map((file) => path.relative(cwd(), file).replaceAll('\\', '/'))

/**
 * 过滤掉本地 AI/Trellis 配置目录，避免临时生成文件进入提交前格式化流程。
 *
 * @param {string[]} files 仓库根目录下的相对路径列表。
 * @returns {string[]} 需要继续交给格式化工具处理的文件路径列表。
 */
const filterIgnoredDirs = (files) =>
  files.filter(
    (file) =>
      !ignoredDirs.some((dir) => file === dir || file.startsWith(`${dir}/`)),
  )

export default {
  '*.{md,json}': (files) => {
    const matchedFiles = filterIgnoredDirs(toRelativePaths(files))
    return matchedFiles.length
      ? `prettier --write --no-error-on-unmatched-pattern ${matchedFiles.join(' ')}`
      : []
  },
  '*.{css,less}': ['stylelint --fix', 'prettier --write'],
  '*.{js,jsx}': ['eslint --fix', 'prettier --write'],
  '*.{ts,tsx}': ['eslint --fix', 'prettier --parser=typescript --write'],
}
