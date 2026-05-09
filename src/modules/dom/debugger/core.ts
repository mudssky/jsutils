import {
  DebugOptions,
  SelectorDiagnostic,
  SelectorDiagnosticContext,
  SelectorFailReason,
  SelectorMap,
  SelectorResult,
  SelectorValue,
} from './type'

/** 诊断上下文信息最大 HTML 截断长度 */
const HTML_SNIPPET_MAX_LENGTH = 200
/** 同级元素最大展示数量 */
const SIBLINGS_MAX_COUNT = 10

/**
 * 校验 CSS 选择器语法是否合法
 *
 * @param selector - CSS 选择器字符串
 * @returns true 表示合法，false 表示非法
 *
 * @public
 */
export function isValidSelector(selector: string): boolean {
  try {
    document.createDocumentFragment().querySelector(selector)
    return true
  } catch {
    return false
  }
}

/**
 * 解析选择器值，返回统一的结果
 *
 * @param name - 选择器名称
 * @param value - 选择器值（字符串或函数）
 * @param root - 查询根元素
 * @returns 单个选择器的检测结果
 */
function resolveSelector(
  name: string,
  value: SelectorValue,
  root: Element | Document,
): SelectorResult {
  // 自定义断言函数
  if (typeof value === 'function') {
    try {
      const element = value(root)
      return {
        name,
        selector: value,
        matched: element !== null,
        count: element !== null ? 1 : 0,
        elements: element ? [element] : [],
        reason: element === null ? SelectorFailReason.NOT_FOUND : undefined,
      }
    } catch {
      return {
        name,
        selector: value,
        matched: false,
        count: 0,
        elements: [],
        reason: SelectorFailReason.NOT_FOUND,
      }
    }
  }

  // CSS 选择器字符串
  if (!isValidSelector(value)) {
    return {
      name,
      selector: value,
      matched: false,
      count: 0,
      elements: [],
      reason: SelectorFailReason.INVALID_SELECTOR,
    }
  }

  const elements = Array.from(root.querySelectorAll(value))
  const matched = elements.length > 0
  let reason: SelectorFailReason | undefined

  if (!matched) {
    reason = SelectorFailReason.NOT_FOUND
  }

  return {
    name,
    selector: value,
    matched,
    count: elements.length,
    elements,
    reason,
  }
}

/**
 * 检测一组选择器的匹配状态（纯函数）
 *
 * @param selectors - 选择器配置对象
 * @param options - 检测选项
 * @returns 所有选择器的检测结果数组
 *
 * @example
 * ```typescript
 * const results = debugSelectors({
 *   toolbar: '.bar-top',
 *   table: '.art-table',
 *   custom: (root) => root.querySelector('[data-role="panel"]')
 * })
 * // results: [{ name: 'toolbar', matched: true, count: 1, ... }, ...]
 * ```
 *
 * @public
 */
export function debugSelectors(
  selectors: SelectorMap,
  options: DebugOptions = {},
): SelectorResult[] {
  const root = options.root ?? document
  return Object.entries(selectors).map(([name, value]) =>
    resolveSelector(name, value, root),
  )
}

/**
 * 收集未匹配选择器的诊断上下文信息
 *
 * @param selector - 选择器字符串（仅对字符串选择器有效）
 * @param root - 查询根元素
 * @returns 诊断上下文，无法收集时返回 null
 */
function collectContext(
  selector: string,
  root: Element | Document,
): SelectorDiagnosticContext | null {
  // 尝试找到最近匹配的祖先：逐步去掉选择器的最后一段
  const parts = selector.split(/\s+/)
  let nearestMatchedAncestor: string | null = null
  let nearestElement: Element | null = null

  for (let i = parts.length - 1; i > 0; i--) {
    const ancestorSelector = parts.slice(0, i).join(' ')
    if (!isValidSelector(ancestorSelector)) continue
    const found = root.querySelector(ancestorSelector)
    if (found) {
      nearestMatchedAncestor = ancestorSelector
      nearestElement = found
      break
    }
  }

  // 收集同级元素信息
  const siblings: Array<{ tag: string; classes: string[] }> = []
  if (nearestElement?.parentElement) {
    const parent = nearestElement.parentElement
    for (const child of Array.from(parent.children).slice(
      0,
      SIBLINGS_MAX_COUNT,
    )) {
      siblings.push({
        tag: child.tagName.toLowerCase(),
        classes: Array.from(child.classList),
      })
    }
  }

  const parent = nearestElement?.parentElement
  const nearbyHtmlSnippet = nearestElement?.parentElement
    ? truncateHtml(
        nearestElement.parentElement.outerHTML,
        HTML_SNIPPET_MAX_LENGTH,
      )
    : null

  return {
    parentTag: parent?.tagName.toLowerCase() ?? null,
    parentClasses: parent ? Array.from(parent.classList) : [],
    siblings,
    nearestMatchedAncestor,
    nearbyHtmlSnippet,
  }
}

/**
 * 根据失败原因生成排障建议
 *
 * @param reason - 失败原因
 * @param name - 选择器名称
 * @returns 排障建议文本
 */
function generateSuggestion(
  reason: SelectorFailReason | undefined,
  name: string,
): string {
  switch (reason) {
    case SelectorFailReason.INVALID_SELECTOR:
      return `选择器 "${name}" 语法非法，请检查 CSS 选择器拼写`
    case SelectorFailReason.HIDDEN:
      return `选择器 "${name}" 匹配到元素但不可见，检查 display/visibility 样式`
    case SelectorFailReason.NOT_FOUND:
      return `选择器 "${name}" 未匹配到元素。可能原因：元素未加载、选择器过期（页面改版）、在 iframe 或 Shadow DOM 中`
    case SelectorFailReason.SHADOW_DOM:
      return `选择器 "${name}" 的目标可能在 Shadow DOM 内，需要穿透 shadow root 查询`
    case SelectorFailReason.IFRAME:
      return `选择器 "${name}" 的目标可能在 iframe 内，需要跨 document 查询`
    default:
      return ''
  }
}

/**
 * 对选择器检测结果生成完整诊断报告
 *
 * @param selectors - 选择器配置对象
 * @param options - 检测选项
 * @returns 诊断报告数组
 *
 * @example
 * ```typescript
 * const diagnostics = diagnoseSelectors({
 *   toolbar: '.bar-top',
 *   table: '.art-table'
 * })
 * // diagnostics: [{ name: 'toolbar', matched: true, suggestion: '', ... }, ...]
 * ```
 *
 * @public
 */
export function diagnoseSelectors(
  selectors: SelectorMap,
  options: DebugOptions = {},
): SelectorDiagnostic[] {
  const root = options.root ?? document
  const results = debugSelectors(selectors, options)

  return results.map((result): SelectorDiagnostic => {
    let context: SelectorDiagnosticContext | undefined

    if (
      !result.matched &&
      typeof result.selector === 'string' &&
      result.reason !== SelectorFailReason.INVALID_SELECTOR
    ) {
      context = collectContext(result.selector, root) ?? undefined
    }

    return {
      name: result.name,
      selector: result.selector,
      matched: result.matched,
      reason: result.reason,
      count: result.count,
      context,
      suggestion: generateSuggestion(result.reason, result.name),
    }
  })
}

/**
 * 将诊断报告格式化为人类可读的多行文本
 *
 * @param diagnostics - 诊断报告数组
 * @returns 格式化文本
 *
 * @example
 * ```typescript
 * const text = formatDiagnostics(diagnostics)
 * console.log(text)
 * // ✓ toolbar (.bar-top) — 匹配 1 个元素
 * // ✗ table (.art-table) — 未匹配: NOT_FOUND
 * //   建议: 选择器 "table" 未匹配到元素。...
 * ```
 *
 * @public
 */
export function formatDiagnostics(diagnostics: SelectorDiagnostic[]): string {
  const lines: string[] = []
  const total = diagnostics.length
  const matched = diagnostics.filter((d) => d.matched).length

  lines.push(`DOM Debug: ${matched}/${total} 选择器匹配`)
  lines.push('─'.repeat(40))

  for (const d of diagnostics) {
    const selectorLabel =
      typeof d.selector === 'string' ? d.selector : '[自定义函数]'

    if (d.matched) {
      lines.push(`✓ ${d.name} (${selectorLabel}) — 匹配 ${d.count} 个元素`)
    } else {
      lines.push(`✗ ${d.name} (${selectorLabel}) — 未匹配: ${d.reason}`)
      if (d.suggestion) {
        lines.push(`  建议: ${d.suggestion}`)
      }
      if (d.context) {
        if (d.context.nearestMatchedAncestor) {
          lines.push(`  最近匹配祖先: ${d.context.nearestMatchedAncestor}`)
        }
        if (d.context.parentTag) {
          const classStr =
            d.context.parentClasses.length > 0
              ? `.${d.context.parentClasses.join('.')}`
              : ''
          lines.push(`  父级元素: ${d.context.parentTag}${classStr}`)
        }
      }
    }
  }

  return lines.join('\n')
}

/**
 * 截断 HTML 字符串到指定长度
 *
 * @param html - 原始 HTML
 * @param maxLength - 最大长度
 * @returns 截断后的 HTML
 */
function truncateHtml(html: string, maxLength: number): string {
  if (html.length <= maxLength) return html
  return `${html.slice(0, maxLength)}...`
}
