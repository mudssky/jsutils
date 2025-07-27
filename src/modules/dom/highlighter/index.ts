import { escapeRegExp } from '../../regex'
import { HighlightCallbacks, HighlighterConfig, HighlightOptions } from './type'

/**
 * 文本高亮器类
 *
 * 提供在指定DOM元素中高亮显示关键词的功能，支持导航到不同的匹配项。
 * 可以配置高亮样式、标签类型，并提供前进/后退导航功能。
 *
 * @example
 * ```typescript
 * // 基本用法（单个关键词）
 * const container = document.getElementById('content')
 * const highlighter = new Highlighter(container)
 * highlighter.apply('搜索关键词')
 *
 * // 多个关键词高亮
 * highlighter.apply(['JavaScript', 'TypeScript', 'React'])
 *
 * // 使用配置对象
 * const highlighter = new Highlighter(container, {
 *   highlightTag: 'span',
 *   highlightClass: 'my-highlight',
 *   activeClass: 'my-active',
 *   skipTags: ['SCRIPT', 'STYLE', 'CODE'],
 *   smartScroll: true,      // 启用智能滚动
 *   scrollPadding: 100      // 设置视口内边距为100px
 * })
 *
 * // 带回调的高级用法
 * const highlighter = new Highlighter(container, {
 *   highlightClass: 'search-result'
 * }, {
 *   onHighlightApplied: (count, keywords) => {
 *     console.log(`找到 ${count} 个 "${keywords}" 的匹配项`)
 *   },
 *   onNavigate: (index, total, element) => {
 *     console.log(`当前: ${index + 1}/${total}`)
 *   }
 * })
 *
 * // 高级选项（多个关键词）
 * highlighter.apply(['JavaScript', 'API'], {
 *   caseSensitive: true,  // 区分大小写
 *   wholeWord: true       // 只匹配完整单词
 * })
 *
 * // 导航功能
 * highlighter.next()     // 下一个匹配项
 * highlighter.previous() // 上一个匹配项
 * highlighter.jumpTo(5)  // 跳转到第6个匹配项
 * ```
 *
 * @public
 */
class Highlighter {
  private targetNode: HTMLElement
  private config: Required<HighlighterConfig>
  private callbacks: HighlightCallbacks

  private highlights: HTMLElement[] = []
  private currentIndex: number = -1
  private currentKeywords: string[] = []
  private currentPattern: string[] | RegExp = []

  /**
   * 创建一个新的高亮器实例
   *
   * @param targetNode - 要进行高亮操作的目标DOM元素
   * @param config - 高亮器配置选项
   * @param callbacks - 事件回调函数
   *
   * @example
   * ```typescript
   * const container = document.getElementById('content')
   *
   * // 使用默认配置
   * const highlighter1 = new Highlighter(container)
   *
   * // 自定义配置
   * const highlighter2 = new Highlighter(container, {
   *   highlightTag: 'span',
   *   highlightClass: 'search-highlight',
   *   activeClass: 'current-match',
   *   skipTags: ['SCRIPT', 'STYLE', 'CODE'],
   *   scrollOptions: { behavior: 'auto', block: 'nearest' },
   *   smartScroll: false,     // 禁用智能滚动
   *   scrollPadding: 30       // 设置较小的视口内边距
   * })
   *
   * // 带回调的配置
   * const highlighter3 = new Highlighter(container, {
   *   highlightClass: 'result'
   * }, {
   *   onHighlightApplied: (count) => console.log(`找到 ${count} 个匹配项`),
   *   onNavigate: (index, total) => console.log(`${index + 1}/${total}`)
   * })
   * ```
   */
  constructor(
    targetNode: HTMLElement,
    config: HighlighterConfig = {},
    callbacks: HighlightCallbacks = {},
  ) {
    if (!targetNode || !(targetNode instanceof HTMLElement)) {
      throw new Error('targetNode must be a valid HTMLElement')
    }

    this.targetNode = targetNode
    this.config = {
      highlightTag: 'mark',
      highlightClass: 'highlight',
      activeClass: 'highlight-active',
      skipTags: ['SCRIPT', 'STYLE', 'NOSCRIPT'],
      scrollOptions: { behavior: 'smooth', block: 'center' },
      enablePerformanceOptimization: true,
      smartScroll: true,
      scrollPadding: 50,
      ...config,
    }
    this.callbacks = callbacks
  }

  /**
   * 准备应用正则表达式高亮的内部方法
   *
   * @param regex - 正则表达式
   * @returns 准备好的数据或 null（如果正则表达式无效）
   */
  private _prepareApplyRegex(regex: RegExp): {
    finalRegex: RegExp
    walker: TreeWalker
  } | null {
    // 验证正则表达式
    if (!regex || !(regex instanceof RegExp)) {
      // eslint-disable-next-line no-console
      console.warn('Highlighter: 提供的正则表达式无效')
      return null
    }

    // 检查是否包含全局标志
    if (!regex.global) {
      throw new Error('Highlighter: 正则表达式必须包含全局标志 "g"')
    }

    // 清理之前的高亮
    this.remove()

    // 创建 TreeWalker
    const walker = document.createTreeWalker(
      this.targetNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Node) => {
          // 排除指定标签和已经被高亮的区域
          if (
            node.parentElement &&
            this.config.skipTags.includes(
              node.parentElement.nodeName.toUpperCase(),
            )
          ) {
            return NodeFilter.FILTER_REJECT
          }
          if (
            (node.parentElement as HTMLElement)?.classList.contains(
              this.config.highlightClass,
            )
          ) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        },
      },
    )

    return {
      finalRegex: regex,
      walker,
    }
  }

  /**
   * 准备高亮应用的前置工作
   * @internal
   */
  private _prepareApply(
    keywords: string | string[],
    options: HighlightOptions = {},
  ): { finalRegex: RegExp; walker: TreeWalker } | null {
    this.remove() // 清理旧的高亮

    // 标准化关键词为数组
    const keywordArray = Array.isArray(keywords) ? keywords : [keywords]
    const validKeywords = keywordArray
      .filter(
        (keyword) =>
          keyword != null && typeof keyword === 'string' && keyword.trim(),
      )
      .map((keyword) => keyword.trim())

    if (validKeywords.length === 0) {
      return null
    }

    this.currentKeywords = validKeywords

    // 创建组合正则表达式
    const safeKeywords = validKeywords.map((keyword) => escapeRegExp(keyword))
    const regexFlags = options.caseSensitive ? 'g' : 'gi'
    const keywordPattern = safeKeywords.join('|')
    const finalRegex = options.wholeWord
      ? new RegExp(`\\b(${keywordPattern})\\b`, regexFlags)
      : new RegExp(`(${keywordPattern})`, regexFlags)

    const walker = document.createTreeWalker(
      this.targetNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Node) => {
          // 排除指定标签和已经被高亮的区域
          if (
            node.parentElement &&
            this.config.skipTags.includes(
              node.parentElement.nodeName.toUpperCase(),
            )
          ) {
            return NodeFilter.FILTER_REJECT
          }
          if (
            (node.parentElement as HTMLElement)?.classList.contains(
              this.config.highlightClass,
            )
          ) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        },
      },
    )

    return { finalRegex, walker }
  }

  /**
   * 完成正则表达式高亮应用的后续工作
   * @internal
   */
  private _finalizeApplyRegex(
    nodesToReplace: { oldNode: Node; fragment: DocumentFragment }[],
    regex: RegExp,
  ): number {
    // 批量替换节点
    nodesToReplace.forEach((replacement) => {
      replacement.oldNode.parentNode?.replaceChild(
        replacement.fragment,
        replacement.oldNode,
      )
    })

    // 存储所有高亮元素
    this.highlights = Array.from(
      this.targetNode.querySelectorAll(`.${this.config.highlightClass}`),
    )

    if (this.highlights.length > 0) {
      this.currentIndex = 0
      this.setActiveHighlight()
    }

    // 存储当前模式
    this.currentPattern = regex
    this.currentKeywords = [] // 正则表达式模式下关键词为空

    // 触发回调
    this.callbacks.onHighlightApplied?.(this.highlights.length, [])

    return this.highlights.length
  }

  /**
   * 完成高亮应用的后续工作
   * @internal
   */
  private _finalizeApply(
    nodesToReplace: { oldNode: Node; fragment: DocumentFragment }[],
  ): number {
    // 批量替换节点
    nodesToReplace.forEach((replacement) => {
      replacement.oldNode.parentNode?.replaceChild(
        replacement.fragment,
        replacement.oldNode,
      )
    })

    // 存储所有高亮元素
    this.highlights = Array.from(
      this.targetNode.querySelectorAll(`.${this.config.highlightClass}`),
    )

    if (this.highlights.length > 0) {
      this.currentIndex = 0
      this.setActiveHighlight()
    }

    // 存储当前模式
    this.currentPattern = this.currentKeywords

    // 触发回调
    this.callbacks.onHighlightApplied?.(this.highlights.length, [
      ...this.currentKeywords,
    ])

    return this.highlights.length
  }

  /**
   * 应用高亮到指定关键词（异步版本）
   *
   * 在目标元素中搜索并高亮显示指定的关键词。会自动清理之前的高亮，
   * 并为新的匹配项设置高亮样式。完成后会自动定位到第一个匹配项。
   * 异步版本支持性能优化，适合处理大文档。
   *
   * @param keywords - 要高亮的关键词，可以是单个字符串或字符串数组，空字符串或仅包含空白字符的字符串将被忽略
   * @param options - 高亮选项配置
   * @returns 匹配项的数量
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   *
   * // 基本高亮（单个关键词）
   * const count1 = await highlighter.apply('JavaScript')
   *
   * // 多个关键词高亮
   * const count2 = await highlighter.apply(['JavaScript', 'TypeScript', 'React'])
   *
   * // 区分大小写的高亮
   * const count3 = await highlighter.apply(['JavaScript', 'API'], { caseSensitive: true })
   *
   * // 只匹配完整单词
   * const count4 = await highlighter.apply(['script', 'code'], { wholeWord: true })
   *
   * // 组合选项
   * const count5 = await highlighter.apply(['API', 'SDK'], {
   *   caseSensitive: true,
   *   wholeWord: true
   * })
   * ```
   *
   * @remarks
   * - 该方法会跳过配置中指定的标签内的文本
   * - 不会在已经高亮的元素内进行嵌套高亮
   * - 使用TreeWalker遍历文本节点以确保性能
   * - 关键词中的正则表达式特殊字符会被自动转义
   * - 支持性能优化，在处理大量节点时会分批处理避免阻塞UI
   * - 多个关键词会被组合成一个正则表达式进行匹配
   */
  public async apply(
    keywords: string | string[],
    options: HighlightOptions = {},
  ): Promise<number> {
    const prepared = this._prepareApply(keywords, options)
    if (!prepared) {
      return 0
    }

    const { finalRegex, walker } = prepared
    const nodesToReplace: { oldNode: Node; fragment: DocumentFragment }[] = []
    let currentNode = walker.nextNode()

    // 性能优化：批量处理节点
    const batchSize = this.config.enablePerformanceOptimization ? 100 : Infinity
    let processedCount = 0

    while (currentNode) {
      const textContent = currentNode.textContent
      if (textContent && finalRegex.test(textContent)) {
        const fragment = this.createHighlightedFragment(textContent, finalRegex)
        nodesToReplace.push({ oldNode: currentNode, fragment })
      }

      currentNode = walker.nextNode()
      processedCount++

      // 性能优化：分批处理大量节点
      if (
        this.config.enablePerformanceOptimization &&
        processedCount >= batchSize
      ) {
        // 使用 requestIdleCallback 或 setTimeout 来避免阻塞UI
        if (typeof requestIdleCallback !== 'undefined') {
          await new Promise<void>((resolve) =>
            requestIdleCallback(() => resolve()),
          )
        } else {
          await new Promise<void>((resolve) => setTimeout(() => resolve(), 0))
        }
        processedCount = 0
      }
    }

    return this._finalizeApply(nodesToReplace)
  }

  /**
   * 应用高亮到指定关键词（同步版本）
   *
   * 在目标元素中搜索并高亮显示指定的关键词。会自动清理之前的高亮，
   * 并为新的匹配项设置高亮样式。完成后会自动定位到第一个匹配项。
   * 同步版本不包含性能优化，适合处理小到中等大小的文档。
   *
   * @param keywords - 要高亮的关键词，可以是单个字符串或字符串数组，空字符串或仅包含空白字符的字符串将被忽略
   * @param options - 高亮选项配置
   * @returns 匹配项的数量
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   *
   * // 基本高亮（单个关键词）
   * const count1 = highlighter.applySync('JavaScript')
   *
   * // 多个关键词高亮
   * const count2 = highlighter.applySync(['JavaScript', 'TypeScript', 'React'])
   *
   * // 区分大小写的高亮
   * const count3 = highlighter.applySync(['JavaScript', 'API'], { caseSensitive: true })
   *
   * // 只匹配完整单词
   * const count4 = highlighter.applySync(['script', 'code'], { wholeWord: true })
   *
   * // 组合选项
   * const count5 = highlighter.applySync(['API', 'SDK'], {
   *   caseSensitive: true,
   *   wholeWord: true
   * })
   * ```
   *
   * @remarks
   * - 该方法会跳过配置中指定的标签内的文本
   * - 不会在已经高亮的元素内进行嵌套高亮
   * - 使用TreeWalker遍历文本节点以确保性能
   * - 关键词中的正则表达式特殊字符会被自动转义
   * - 同步执行，不会分批处理，适合小到中等大小的文档
   * - 多个关键词会被组合成一个正则表达式进行匹配
   */
  public applySync(
    keywords: string | string[],
    options: HighlightOptions = {},
  ): number {
    const prepared = this._prepareApply(keywords, options)
    if (!prepared) {
      return 0
    }

    const { finalRegex, walker } = prepared
    const nodesToReplace: { oldNode: Node; fragment: DocumentFragment }[] = []
    let currentNode = walker.nextNode()

    // 同步处理所有节点
    while (currentNode) {
      const textContent = currentNode.textContent
      if (textContent && finalRegex.test(textContent)) {
        const fragment = this.createHighlightedFragment(textContent, finalRegex)
        nodesToReplace.push({ oldNode: currentNode, fragment })
      }

      currentNode = walker.nextNode()
    }

    return this._finalizeApply(nodesToReplace)
  }

  /**
   * 使用自定义正则表达式应用高亮（异步版本）
   *
   * 使用提供的正则表达式在目标元素中搜索并高亮显示匹配的文本。
   * 会自动清理之前的高亮，并为新的匹配项设置高亮样式。
   * 异步版本支持性能优化，适合处理大文档。
   *
   * @param regex - 用于匹配的正则表达式，必须包含全局标志 'g'
   * @returns 匹配项的数量
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   *
   * // 高亮所有邮箱地址
   * const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
   * const count1 = await highlighter.applyRegex(emailRegex)
   *
   * // 高亮日期格式 YYYY-MM-DD
   * const dateRegex = /\d{4}-\d{2}-\d{2}/g
   * const count2 = await highlighter.applyRegex(dateRegex)
   *
   * // 高亮 "Chapter" 或 "Section" 后跟数字
   * const chapterRegex = /(Chapter|Section)\s+\d+/gi
   * const count3 = await highlighter.applyRegex(chapterRegex)
   * ```
   *
   * @throws 如果传入的正则表达式没有 'g' 标志，则会抛出错误
   *
   * @remarks
   * - 该方法会跳过配置中指定的标签内的文本
   * - 不会在已经高亮的元素内进行嵌套高亮
   * - 使用TreeWalker遍历文本节点以确保性能
   * - 支持性能优化，在处理大量节点时会分批处理避免阻塞UI
   * - 正则表达式必须包含全局标志 'g' 以确保能匹配所有实例
   */
  public async applyRegex(regex: RegExp): Promise<number> {
    const prepared = this._prepareApplyRegex(regex)
    if (!prepared) {
      return 0
    }

    const { finalRegex, walker } = prepared
    const nodesToReplace: { oldNode: Node; fragment: DocumentFragment }[] = []
    let currentNode = walker.nextNode()

    // 性能优化：批量处理节点
    const batchSize = this.config.enablePerformanceOptimization ? 100 : Infinity
    let processedCount = 0

    while (currentNode) {
      const textContent = currentNode.textContent
      if (textContent && finalRegex.test(textContent)) {
        const fragment = this.createHighlightedFragment(textContent, finalRegex)
        nodesToReplace.push({ oldNode: currentNode, fragment })
      }

      currentNode = walker.nextNode()
      processedCount++

      // 性能优化：分批处理大量节点
      if (
        this.config.enablePerformanceOptimization &&
        processedCount >= batchSize
      ) {
        // 使用 requestIdleCallback 或 setTimeout 来避免阻塞UI
        if (typeof requestIdleCallback !== 'undefined') {
          await new Promise<void>((resolve) =>
            requestIdleCallback(() => resolve()),
          )
        } else {
          await new Promise<void>((resolve) => setTimeout(() => resolve(), 0))
        }
        processedCount = 0
      }
    }

    return this._finalizeApplyRegex(nodesToReplace, regex)
  }

  /**
   * 使用自定义正则表达式应用高亮（同步版本）
   *
   * 使用提供的正则表达式在目标元素中搜索并高亮显示匹配的文本。
   * 会自动清理之前的高亮，并为新的匹配项设置高亮样式。
   * 同步版本不包含性能优化，适合处理小到中等大小的文档。
   *
   * @param regex - 用于匹配的正则表达式，必须包含全局标志 'g'
   * @returns 匹配项的数量
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   *
   * // 高亮所有邮箱地址
   * const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
   * const count1 = highlighter.applyRegexSync(emailRegex)
   *
   * // 高亮日期格式 YYYY-MM-DD
   * const dateRegex = /\d{4}-\d{2}-\d{2}/g
   * const count2 = highlighter.applyRegexSync(dateRegex)
   * ```
   *
   * @throws 如果传入的正则表达式没有 'g' 标志，则会抛出错误
   *
   * @remarks
   * - 该方法会跳过配置中指定的标签内的文本
   * - 不会在已经高亮的元素内进行嵌套高亮
   * - 使用TreeWalker遍历文本节点以确保性能
   * - 同步执行，不会分批处理，适合小到中等大小的文档
   * - 正则表达式必须包含全局标志 'g' 以确保能匹配所有实例
   */
  public applyRegexSync(regex: RegExp): number {
    const prepared = this._prepareApplyRegex(regex)
    if (!prepared) {
      return 0
    }

    const { finalRegex, walker } = prepared
    const nodesToReplace: { oldNode: Node; fragment: DocumentFragment }[] = []
    let currentNode = walker.nextNode()

    // 同步处理所有节点
    while (currentNode) {
      const textContent = currentNode.textContent
      if (textContent && finalRegex.test(textContent)) {
        const fragment = this.createHighlightedFragment(textContent, finalRegex)
        nodesToReplace.push({ oldNode: currentNode, fragment })
      }

      currentNode = walker.nextNode()
    }

    return this._finalizeApplyRegex(nodesToReplace, regex)
  }

  /**
   * 移除所有高亮
   *
   * 清除目标元素中的所有高亮标记，将高亮的文本恢复为普通文本。
   * 同时重置内部状态，包括高亮元素列表和当前索引。
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply('JavaScript')
   * // ... 一些操作后
   * highlighter.remove() // 清除所有高亮
   * ```
   */
  public remove(): void {
    const highlights = this.targetNode.querySelectorAll(
      `${this.config.highlightTag}.${this.config.highlightClass}`,
    )
    highlights.forEach((element) => {
      const parent = element.parentNode
      if (parent) {
        parent.replaceChild(
          document.createTextNode(element.textContent || ''),
          element,
        )
        parent.normalize()
      }
    })
    this.highlights = []
    this.currentIndex = -1
    this.currentKeywords = []
    this.currentPattern = []

    // 触发回调
    this.callbacks.onHighlightRemoved?.()
  }

  /**
   * 跳转到下一个高亮项
   *
   * 将当前激活的高亮项切换到下一个匹配项。如果当前是最后一个，
   * 则循环到第一个。会自动滚动到目标元素并更新激活状态。
   *
   * @returns 是否成功跳转
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply('JavaScript')
   * const success = highlighter.next() // 跳转到下一个匹配项
   * ```
   */
  public next(): boolean {
    if (this.highlights.length === 0) return false
    this.currentIndex = (this.currentIndex + 1) % this.highlights.length
    this.setActiveHighlight()
    return true
  }

  /**
   * 跳转到上一个高亮项
   *
   * 将当前激活的高亮项切换到上一个匹配项。如果当前是第一个，
   * 则循环到最后一个。会自动滚动到目标元素并更新激活状态。
   *
   * @returns 是否成功跳转
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply('JavaScript')
   * const success = highlighter.previous() // 跳转到上一个匹配项
   * ```
   */
  public previous(): boolean {
    if (this.highlights.length === 0) return false
    this.currentIndex =
      (this.currentIndex - 1 + this.highlights.length) % this.highlights.length
    this.setActiveHighlight()
    return true
  }

  /**
   * 跳转到指定索引的高亮项
   *
   * 直接跳转到指定索引位置的高亮项。索引从0开始计算。
   *
   * @param index - 目标索引（从0开始）
   * @returns 是否成功跳转
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply('JavaScript')
   * const success = highlighter.jumpTo(5) // 跳转到第6个匹配项
   * ```
   */
  public jumpTo(index: number): boolean {
    if (
      this.highlights.length === 0 ||
      index < 0 ||
      index >= this.highlights.length
    ) {
      return false
    }
    this.currentIndex = index
    this.setActiveHighlight()
    return true
  }

  /**
   * 获取匹配总数
   *
   * 返回当前高亮关键词的匹配项总数。
   *
   * @returns 匹配项的总数
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply('JavaScript')
   * console.log(`找到 ${highlighter.getMatchCount()} 个匹配项`)
   * ```
   */
  public getMatchCount(): number {
    return this.highlights.length
  }

  /**
   * 获取当前激活项的索引
   *
   * 返回当前激活的高亮项在所有匹配项中的索引位置（从0开始）。
   * 如果没有匹配项，返回-1。
   *
   * @returns 当前激活项的索引，如果没有匹配项则返回-1
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply('JavaScript')
   * console.log(`当前是第 ${highlighter.getCurrentIndex() + 1} 个匹配项`)
   * ```
   */
  public getCurrentIndex(): number {
    return this.currentIndex
  }

  /**
   * 获取当前高亮的关键词
   *
   * @returns 当前高亮的关键词数组，如果没有高亮则返回空数组
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply(['JavaScript', 'TypeScript'])
   * console.log(`当前高亮关键词: ${highlighter.getCurrentKeywords().join(', ')}`)
   * ```
   */
  public getCurrentKeywords(): string[] {
    return [...this.currentKeywords]
  }

  /**
   * 获取当前高亮的模式
   *
   * @returns 当前高亮的模式，可能是关键词数组或正则表达式
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   *
   * // 使用关键词高亮
   * await highlighter.apply(['JavaScript', 'tutorial'])
   * console.log(highlighter.getCurrentPattern()) // ['JavaScript', 'tutorial']
   *
   * // 使用正则表达式高亮
   * const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
   * await highlighter.applyRegex(emailRegex)
   * console.log(highlighter.getCurrentPattern()) // RegExp object
   * ```
   */
  public getCurrentPattern(): string[] | RegExp {
    return this.currentPattern instanceof RegExp
      ? this.currentPattern
      : [...this.currentPattern]
  }

  /**
   * 获取当前高亮的关键词（兼容性方法）
   *
   * @returns 当前高亮的关键词字符串，多个关键词用逗号分隔，如果没有高亮则返回空字符串
   * @deprecated 建议使用 getCurrentKeywords() 方法
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply(['JavaScript', 'TypeScript'])
   * console.log(`当前高亮关键词: ${highlighter.getCurrentKeyword()}`)
   * ```
   */
  public getCurrentKeyword(): string {
    return this.currentKeywords.join(', ')
  }

  /**
   * 获取当前激活的高亮元素
   *
   * @returns 当前激活的高亮元素，如果没有则返回null
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply('JavaScript')
   * const activeElement = highlighter.getCurrentElement()
   * if (activeElement) {
   *   console.log('当前激活元素的文本:', activeElement.textContent)
   * }
   * ```
   */
  public getCurrentElement(): HTMLElement | null {
    return this.currentIndex >= 0 && this.currentIndex < this.highlights.length
      ? this.highlights[this.currentIndex]
      : null
  }

  /**
   * 获取所有高亮元素
   *
   * @returns 所有高亮元素的数组副本
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.apply('JavaScript')
   * const allHighlights = highlighter.getAllHighlights()
   * console.log(`总共有 ${allHighlights.length} 个高亮元素`)
   * ```
   */
  public getAllHighlights(): HTMLElement[] {
    return [...this.highlights]
  }

  /**
   * 更新配置
   *
   * 动态更新高亮器的配置。注意：某些配置更改可能需要重新应用高亮才能生效。
   *
   * @param newConfig - 新的配置选项
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.updateConfig({
   *   highlightClass: 'new-highlight-class',
   *   scrollOptions: { behavior: 'auto' }
   * })
   * ```
   */
  public updateConfig(newConfig: Partial<HighlighterConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 更新回调函数
   *
   * 动态更新事件回调函数。
   *
   * @param newCallbacks - 新的回调函数
   *
   * @example
   * ```typescript
   * const highlighter = new Highlighter(document.body)
   * highlighter.updateCallbacks({
   *   onNavigate: (index, total) => {
   *     console.log(`导航到: ${index + 1}/${total}`)
   *   }
   * })
   * ```
   */
  public updateCallbacks(newCallbacks: Partial<HighlightCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks }
  }

  /**
   * 检查元素是否在视口的舒适可见区域内
   * @param el - 要检查的HTML元素
   * @returns 如果元素在视口内则返回true，否则返回false
   * @internal
   */
  private _isElementInViewport(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect()
    const padding = this.config.scrollPadding

    return (
      rect.top >= padding &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) - padding
    )
  }

  /**
   * 创建包含高亮标记的文档片段
   *
   * 根据正则表达式匹配结果，将文本分割并创建包含高亮元素的文档片段。
   * 匹配的部分会被包装在指定的高亮标签中，非匹配部分保持为普通文本节点。
   *
   * @param text - 要处理的文本内容
   * @param regex - 用于匹配的正则表达式
   * @returns 包含高亮标记的文档片段
   *
   * @internal
   */
  private createHighlightedFragment(
    text: string,
    regex: RegExp,
  ): DocumentFragment {
    const fragment = document.createDocumentFragment()
    let lastIndex = 0
    let match
    regex.lastIndex = 0 // 重置

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, match.index)),
        )
      }
      const highlightElement = document.createElement(this.config.highlightTag)
      highlightElement.className = this.config.highlightClass
      highlightElement.textContent = match[0]
      fragment.appendChild(highlightElement)
      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)))
    }
    return fragment
  }

  /**
   * 设置当前激活的高亮项
   *
   * 移除所有高亮元素的激活状态，然后为当前索引对应的元素添加激活样式。
   * 如果启用了智能滚动，只有当目标元素不在视口内时才会触发滚动。
   *
   * @internal
   */
  private setActiveHighlight(): void {
    // 移除旧的 active 状态
    this.highlights.forEach((node) =>
      node.classList.remove(this.config.activeClass),
    )

    const activeNode = this.highlights[this.currentIndex]
    if (activeNode) {
      activeNode.classList.add(this.config.activeClass)

      // 智能滚动逻辑
      // 只有在开启了智能滚动，并且目标元素不在视口内时，才执行滚动
      if (!this.config.smartScroll || !this._isElementInViewport(activeNode)) {
        activeNode.scrollIntoView(this.config.scrollOptions)
      }

      // 触发导航回调
      this.callbacks.onNavigate?.(
        this.currentIndex,
        this.highlights.length,
        activeNode,
      )
    }
  }

  /**
   * 私有核心查找逻辑
   * 查找下一个或上一个在视口外的元素的索引。
   * @param direction - 查找方向, 1 为向前, -1 为向后
   * @returns 找到的元素的索引，如果没找到则返回 -1
   * @internal
   */
  private _findOffscreenIndex(direction: 1 | -1): number {
    const total = this.highlights.length
    if (total <= 1) {
      return -1 // 如果只有一个或没有元素，不存在“屏幕外”的另一个元素
    }

    // 从当前位置的下一个/上一个开始，循环遍历所有其他节点
    for (let i = 1; i < total; i++) {
      const nextIndex = (this.currentIndex + i * direction + total) % total
      const nextNode = this.highlights[nextIndex]

      if (!this._isElementInViewport(nextNode)) {
        return nextIndex // 找到了，返回索引
      }
    }

    return -1 // 循环一圈没找到（说明所有元素都在屏幕内）
  }

  /**
   * 查找下一个在视口外的匹配项的索引
   * @returns 找到的元素的索引，如果所有元素都在视口内则返回 -1
   */
  public findNextOffscreenIndex(): number {
    return this._findOffscreenIndex(1)
  }

  /**
   * 查找上一个在视口外的匹配项的索引
   * @returns 找到的元素的索引，如果所有元素都在视口内则返回 -1
   */
  public findPreviousOffscreenIndex(): number {
    return this._findOffscreenIndex(-1)
  }

  /**
   * 跳转到下一个在视口外的匹配项
   *
   * 如果找到了屏幕外的匹配项，则直接跳转到那里。
   * 如果所有匹配项都在视口内，则行为与 next() 相同，以确保总有反馈。
   * @returns 是否成功执行了跳转或导航操作
   */
  public jumpToNextOffscreen(): boolean {
    const targetIndex = this.findNextOffscreenIndex()

    if (targetIndex !== -1) {
      // 如果找到了，直接跳转到该索引
      return this.jumpTo(targetIndex)
    } else {
      // 如果没找到（所有项都在屏幕内），则执行普通 next() 作为回退
      return this.next()
    }
  }

  /**
   * 跳转到上一个在视口外的匹配项
   *
   * 如果找到了屏幕外的匹配项，则直接跳转到那里。
   * 如果所有匹配项都在视口内，则行为与 previous() 相同，以确保总有反馈。
   * @returns 是否成功执行了跳转或导航操作
   */
  public jumpToPreviousOffscreen(): boolean {
    const targetIndex = this.findPreviousOffscreenIndex()

    if (targetIndex !== -1) {
      // 如果找到了，直接跳转到该索引
      return this.jumpTo(targetIndex)
    } else {
      // 如果没找到，执行普通 previous() 作为回退
      return this.previous()
    }
  }

  /**
   * 销毁高亮器实例
   *
   * 清理所有内部状态、引用和事件监听器（如果有）。
   * 在组件卸载时调用此方法以防止内存泄漏。
   */
  public destroy(): void {
    this.remove() // 确保DOM被清理
    this.highlights = []
    this.callbacks = {} // 清除回调引用
    // this.targetNode = null; // 如果可以，断开对DOM节点的引用
  }
}

export type {
  HighlightCallbacks,
  HighlighterConfig,
  HighlightOptions,
} from './type'
export { Highlighter }
