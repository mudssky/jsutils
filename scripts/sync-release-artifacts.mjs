import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildReleaseSection,
  compareVersions,
  findPreviousTag,
  hasReleaseSection,
  normalizeLineEndings,
  normalizeVersion,
  shouldUpdatePackageVersion,
  upsertReleaseSection,
} from './lib/release-sync.mjs'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDirectory, '..')
const packageJsonPath = resolve(projectRoot, 'package.json')
const changelogPath = resolve(projectRoot, 'CHANGELOG.md')

/**
 * 读取必填环境变量，缺失时直接中断同步流程。
 *
 * @param {string} name 环境变量名称。
 * @returns {string} 对应环境变量的非空值。
 */
function getRequiredEnv(name) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`缺少必填环境变量: ${name}`)
  }

  return value
}

/**
 * 获取当前仓库的全部 release tag，用于推导 compare 链接。
 *
 * @param {string} cwd Git 仓库根目录。
 * @returns {string[]} 经过换行拆分后的 tag 列表。
 */
function getGitTags(cwd) {
  const output = execFileSync('git', ['tag', '--list', 'v*'], {
    cwd,
    encoding: 'utf8',
  })

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * 通过 GitHub Release API 读取指定 tag 的发布元数据。
 *
 * @param {{
 *   apiUrl: string
 *   repository: string
 *   tag: string
 *   token: string
 * }} options GitHub API 地址、仓库、tag 和访问令牌。
 * @returns {Promise<{
 *   body: string
 *   html_url: string
 *   prerelease: boolean
 *   draft: boolean
 *   published_at: string | null
 *   created_at: string
 *   tag_name: string
 * }>} 目标版本对应的 GitHub Release 元数据。
 */
async function fetchReleaseByTag(options) {
  const requestUrl = `${options.apiUrl.replace(/\/$/, '')}/repos/${options.repository}/releases/tags/${options.tag}`
  const response = await globalThis.fetch(requestUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${options.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()

    throw new Error(
      `读取 GitHub Release 失败 (${response.status}): ${errorText}`,
    )
  }

  return response.json()
}

/**
 * 仅在文件内容发生变化时落盘，避免无意义 diff。
 *
 * @param {string} filePath 目标文件绝对路径。
 * @param {string} nextContent 期望写入的新内容。
 * @returns {boolean} 文件内容发生变化并已写入时返回 `true`。
 */
function writeFileIfChanged(filePath, nextContent) {
  const previousContent = readFileSync(filePath, 'utf8')

  if (previousContent === nextContent) {
    return false
  }

  writeFileSync(filePath, nextContent, 'utf8')

  return true
}

/**
 * 根据已成功发布的 release 元数据，同步 `package.json` 与 `CHANGELOG.md`。
 *
 * @returns {Promise<void>} 同步完成后结束。
 */
async function main() {
  const releaseTag = getRequiredEnv('RELEASE_TAG')
  const repository = getRequiredEnv('GITHUB_REPOSITORY')
  const token = getRequiredEnv('GITHUB_TOKEN')
  const apiUrl = process.env.GITHUB_API_URL?.trim() || 'https://api.github.com'
  const repoUrl = `https://github.com/${repository}`
  const release = await fetchReleaseByTag({
    apiUrl,
    repository,
    tag: releaseTag,
    token,
  })

  if (release.draft || release.prerelease) {
    throw new Error(`仅支持同步正式发布版本: ${release.tag_name}`)
  }

  const targetVersion = normalizeVersion(release.tag_name)
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const currentVersion = normalizeVersion(packageJson.version)
  const changelogContent = normalizeLineEndings(
    readFileSync(changelogPath, 'utf8'),
  )
  const targetSectionExists = hasReleaseSection(changelogContent, targetVersion)
  const shouldUpdatePackage = shouldUpdatePackageVersion({
    currentVersion,
    targetVersion,
    hasTargetSection: targetSectionExists,
  })
  const versionComparison = compareVersions(currentVersion, targetVersion)

  if (versionComparison > 0) {
    console.log(`release-sync: ${release.tag_name} 已作为历史版本同步，跳过`)

    return
  }

  const previousTag = findPreviousTag(getGitTags(projectRoot), release.tag_name)

  const nextSection = buildReleaseSection({
    version: targetVersion,
    currentTag: release.tag_name,
    previousTag,
    repoUrl,
    releaseUrl: release.html_url,
    publishedAt: release.published_at ?? release.created_at,
    notes: release.body ?? '',
  })
  const nextChangelogContent = upsertReleaseSection(
    changelogContent,
    targetVersion,
    nextSection,
  )

  if (shouldUpdatePackage) {
    packageJson.version = targetVersion
  }

  const nextPackageJsonContent = `${JSON.stringify(packageJson, null, 2)}\n`
  const packageChanged = writeFileIfChanged(
    packageJsonPath,
    nextPackageJsonContent,
  )
  const changelogChanged = writeFileIfChanged(
    changelogPath,
    nextChangelogContent,
  )

  if (!packageChanged && !changelogChanged) {
    console.log(`release-sync: ${release.tag_name} 无需同步`)

    return
  }

  console.log(`release-sync: ${release.tag_name} 已同步`)
  console.log(`  package.json: ${packageChanged ? 'updated' : 'unchanged'}`)
  console.log(`  CHANGELOG.md: ${changelogChanged ? 'updated' : 'unchanged'}`)
}

await main()
