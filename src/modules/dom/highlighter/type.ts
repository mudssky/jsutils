/**
 * 高亮选项配置接口
 *
 * @public
 */
export interface HighlightOptions {
  /**
   * 是否区分大小写
   * @defaultValue false
   */
  caseSensitive?: boolean
  /**
   * 是否只匹配完整单词
   * @defaultValue false
   */
  wholeWord?: boolean
}

/**
 * 高亮器配置接口
 *
 * @public
 */
export interface HighlighterConfig {
  /**
   * 用于包装高亮文本的HTML标签名称
   * @defaultValue 'mark'
   */
  highlightTag?: string
  /**
   * 高亮元素的CSS类名
   * @defaultValue 'highlight'
   */
  highlightClass?: string
  /**
   * 当前激活高亮项的CSS类名
   * @defaultValue 'highlight-active'
   */
  activeClass?: string
  /**
   * 需要跳过的标签名称列表
   * @defaultValue ['SCRIPT', 'STYLE', 'NOSCRIPT']
   */
  skipTags?: string[]
  /**
   * 滚动行为配置
   * @defaultValue `{ behavior: 'smooth', block: 'center' }`
   */
  scrollOptions?: ScrollIntoViewOptions
  /**
   * 是否启用性能优化（对大文档有效）
   * @defaultValue true
   */
  enablePerformanceOptimization?: boolean
  /**
   * 是否启用智能滚动
   * 开启后，在导航到下一个/上一个匹配项时，只有当目标元素不在视口内时才会触发滚动
   * @defaultValue true
   */
  smartScroll?: boolean
  /**
   * 智能滚动的视口内边距（单位：像素）
   * 用于判断元素是否在"舒适"的可见区域内
   * 例如，设置为 50 意味着，如果元素距离视口顶部或底部小于50px，也会被认为是"不可见"的，从而触发滚动
   * @defaultValue 50
   */
  scrollPadding?: number
}

/**
 * 高亮事件回调接口
 *
 * @public
 */
export interface HighlightCallbacks {
  /**
   * 高亮应用完成时的回调
   * @param matchCount - 匹配项总数
   * @param keywords - 高亮的关键词数组
   */
  onHighlightApplied?: (matchCount: number, keywords: string[]) => void
  /**
   * 高亮移除时的回调
   */
  onHighlightRemoved?: () => void
  /**
   * 导航到新匹配项时的回调
   * @param currentIndex - 当前索引
   * @param totalCount - 总匹配数
   * @param element - 当前激活的元素
   */
  onNavigate?: (
    currentIndex: number,
    totalCount: number,
    element: HTMLElement,
  ) => void
}
