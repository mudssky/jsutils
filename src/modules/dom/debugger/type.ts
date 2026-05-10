/**
 * 选择器值类型
 *
 * 支持 CSS 选择器字符串或自定义查询函数
 *
 * @public
 */
export type SelectorValue =
  | string
  | ((root: Element | Document) => Element | null)

/**
 * 选择器配置对象
 *
 * 键为选择器名称，值为 CSS 选择器字符串或自定义查询函数
 *
 * @public
 */
export type SelectorMap = Record<string, SelectorValue>

/**
 * 未匹配原因枚举
 *
 * @public
 */
export enum SelectorFailReason {
  /** 选择器未匹配到任何元素 */
  NOT_FOUND = 'NOT_FOUND',
  /** 选择器语法非法 */
  INVALID_SELECTOR = 'INVALID_SELECTOR',
  /** 元素存在但不可见（display:none 或 visibility:hidden） */
  HIDDEN = 'HIDDEN',
  /** 元素在 Shadow DOM 内，无法通过 querySelector 直接访问 */
  SHADOW_DOM = 'SHADOW_DOM',
  /** 元素在同源 iframe 内，需要跨 document 查询 */
  IFRAME = 'IFRAME',
}

/**
 * 单个选择器的检测结果
 *
 * @public
 */
export interface SelectorResult {
  /** 选择器名称 */
  name: string
  /** 原始选择器值 */
  selector: SelectorValue
  /** 是否匹配成功 */
  matched: boolean
  /** 匹配到的元素数量 */
  count: number
  /** 未匹配原因（仅 matched=false 时存在） */
  reason?: SelectorFailReason
  /** 匹配到的元素列表 */
  elements: Element[]
}

/**
 * 未匹配选择器的诊断上下文信息
 *
 * @public
 */
export interface SelectorDiagnosticContext {
  /** 父级元素标签名 */
  parentTag: string | null
  /** 父级元素 class 列表 */
  parentClasses: string[]
  /** 同级元素列表（标签名 + class 摘要） */
  siblings: Array<{ tag: string; classes: string[] }>
  /** 最近的已匹配祖先选择器名称 */
  nearestMatchedAncestor: string | null
  /** 附近的 DOM 片段（outerHTML 截断） */
  nearbyHtmlSnippet: string | null
}

/**
 * 单个选择器的完整诊断报告
 *
 * @public
 */
export interface SelectorDiagnostic {
  /** 选择器名称 */
  name: string
  /** 原始选择器值 */
  selector: SelectorValue
  /** 是否匹配成功 */
  matched: boolean
  /** 未匹配原因 */
  reason?: SelectorFailReason
  /** 匹配数量 */
  count: number
  /** 诊断上下文（仅未匹配时提供） */
  context?: SelectorDiagnosticContext
  /** 排障建议 */
  suggestion: string
}

/**
 * waitFor 方法的配置选项
 *
 * @public
 */
export interface WaitForOptions {
  /** 超时时间（毫秒），默认 5000 */
  timeout?: number
  /** 检查间隔（毫秒），默认 500 */
  interval?: number
}

/**
 * waitFor 方法的返回结果
 *
 * @public
 */
export interface WaitForResult {
  /** 选择器名称 */
  name: string
  /** 是否在超时前匹配成功 */
  matched: boolean
  /** 匹配到的元素 */
  element: Element | null
  /** 等待耗时（毫秒） */
  elapsed: number
}

/**
 * debugSelectors 函数的配置选项
 *
 * @public
 */
export interface DebugOptions {
  /** 查询根元素，默认 document */
  root?: Element | Document
}
