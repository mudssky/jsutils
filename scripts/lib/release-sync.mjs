const RELEASE_SECTION_HEADING =
  /^(#{1,2}) \[([^\]]+)\]\(([^)]+)\) \((\d{4}-\d{2}-\d{2})\)$/gm

/**
 * 统一文本换行符，避免不同平台导致的重复差异。
 *
 * @param {string} text 待规范化的原始文本。
 * @returns {string} 统一为 LF 换行符后的文本。
 */
export function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, '\n')
}

/**
 * 从 tag 或 version 文本中提取规范化版本号。
 *
 * @param {string} value 可能带有 `v` 前缀的版本文本。
 * @returns {string} 去掉 `v` 前缀后的语义化版本号。
 */
export function normalizeVersion(value) {
  const normalizedValue = value.trim().replace(/^v/, '')

  if (!/^\d+\.\d+\.\d+$/.test(normalizedValue)) {
    throw new Error(`不支持的版本格式: ${value}`)
  }

  return normalizedValue
}

/**
 * 将语义化版本拆分为可比较的数字数组。
 *
 * @param {string} version 语义化版本号。
 * @returns {[number, number, number]} 主版本、次版本、修订号数组。
 */
export function parseVersion(version) {
  return normalizeVersion(version)
    .split('.')
    .map((part) => Number(part))
}

/**
 * 比较两个语义化版本号。
 *
 * @param {string} left 左侧版本号。
 * @param {string} right 右侧版本号。
 * @returns {number} 左侧大于右侧时返回正数，小于时返回负数，相等时返回 0。
 */
export function compareVersions(left, right) {
  const leftParts = parseVersion(left)
  const rightParts = parseVersion(right)

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index]
    }
  }

  return 0
}

/**
 * 解析 changelog 中已有的 release 段落。
 *
 * @param {string} changelog 原始 changelog 文本。
 * @returns {{ preamble: string, sections: Array<{ version: string, content: string }> }} 解析后的前导文本与 release 段落。
 */
export function parseReleaseSections(changelog) {
  const normalizedChangelog = normalizeLineEndings(changelog)
  const matches = Array.from(
    normalizedChangelog.matchAll(RELEASE_SECTION_HEADING),
  )

  if (matches.length === 0) {
    return {
      preamble: normalizedChangelog.trim(),
      sections: [],
    }
  }

  const firstSectionStart = matches[0].index ?? 0
  const sections = matches.map((match, index) => {
    const start = match.index ?? 0
    const end =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? normalizedChangelog.length)
        : normalizedChangelog.length

    return {
      version: normalizeVersion(match[2]),
      content: normalizedChangelog.slice(start, end).trim(),
    }
  })

  return {
    preamble: normalizedChangelog.slice(0, firstSectionStart).trim(),
    sections,
  }
}

/**
 * 判断 changelog 中是否已经存在指定版本段落。
 *
 * @param {string} changelog 原始 changelog 文本。
 * @param {string} version 目标版本号。
 * @returns {boolean} 存在时返回 `true`，否则返回 `false`。
 */
export function hasReleaseSection(changelog, version) {
  const targetVersion = normalizeVersion(version)

  return parseReleaseSections(changelog).sections.some(
    (section) => section.version === targetVersion,
  )
}

/**
 * 根据当前 tag 找到前一个已发布 tag，用于 compare 链接。
 *
 * @param {string[]} tags 仓库中可见的 tag 列表。
 * @param {string} targetTag 当前目标 tag。
 * @returns {string | null} 上一个 tag，不存在时返回 `null`。
 */
export function findPreviousTag(tags, targetTag) {
  const sortedTags = Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag)),
    ),
  ).sort((left, right) =>
    compareVersions(normalizeVersion(right), normalizeVersion(left)),
  )
  const targetVersion = normalizeVersion(targetTag)
  const currentIndex = sortedTags.findIndex(
    (tag) => normalizeVersion(tag) === targetVersion,
  )

  if (currentIndex === -1) {
    return null
  }

  return sortedTags[currentIndex + 1] ?? null
}

/**
 * 将 ISO 日期转为 changelog 使用的日期格式。
 *
 * @param {string} value GitHub API 返回的发布日期。
 * @returns {string} `YYYY-MM-DD` 格式日期。
 */
export function formatReleaseDate(value) {
  return new Date(value).toISOString().slice(0, 10)
}

/**
 * 生成单个 release 对应的 changelog 段落。
 *
 * @param {{
 *   version: string
 *   currentTag: string
 *   previousTag: string | null
 *   repoUrl: string
 *   releaseUrl: string
 *   publishedAt: string
 *   notes: string
 * }} options 生成 changelog 所需的 release 元数据。
 * @returns {string} 适合插入到 `CHANGELOG.md` 顶部的版本段落。
 */
export function buildReleaseSection(options) {
  const version = normalizeVersion(options.version)
  const publishedDate = formatReleaseDate(options.publishedAt)
  const safeRepoUrl = options.repoUrl.replace(/\.git$/, '')
  const releaseLink = options.previousTag
    ? `${safeRepoUrl}/compare/${options.previousTag}...${options.currentTag}`
    : options.releaseUrl
  const normalizedNotes = normalizeLineEndings(options.notes).trim()
  const heading = `# [${version}](${releaseLink}) (${publishedDate})`

  if (!normalizedNotes) {
    return `${heading}\n`
  }

  return `${heading}\n\n${normalizedNotes}\n`
}

/**
 * 将指定版本段落幂等插入到 changelog 顶部，并移除旧的重复段落。
 *
 * @param {string} changelog 原始 changelog 文本。
 * @param {string} version 目标版本号。
 * @param {string} nextSection 新生成的版本段落。
 * @returns {string} 插入并去重后的 changelog 文本。
 */
export function upsertReleaseSection(changelog, version, nextSection) {
  const targetVersion = normalizeVersion(version)
  const { preamble, sections } = parseReleaseSections(changelog)
  const seenVersions = new Set([targetVersion])
  const dedupedSections = sections
    .filter((section) => {
      if (seenVersions.has(section.version)) {
        return false
      }

      seenVersions.add(section.version)

      return true
    })
    .map((section) => section.content)
  const body = [nextSection.trim(), ...dedupedSections].join('\n\n').trim()

  if (!preamble) {
    return `${body}\n`
  }

  return `${preamble}\n\n${body}\n`
}

/**
 * 判断目标版本是否允许同步到当前 `package.json`。
 *
 * @param {{
 *   currentVersion: string
 *   targetVersion: string
 *   hasTargetSection: boolean
 * }} options 当前仓库版本、目标版本及 changelog 命中情况。
 * @returns {boolean} 需要更新 `package.json` 时返回 `true`，否则返回 `false`。
 */
export function shouldUpdatePackageVersion(options) {
  const versionComparison = compareVersions(
    options.currentVersion,
    options.targetVersion,
  )

  if (versionComparison > 0 && !options.hasTargetSection) {
    throw new Error(
      `检测到旧版本补跑会回退 package.json：当前 ${options.currentVersion}，目标 ${options.targetVersion}`,
    )
  }

  return versionComparison < 0
}
