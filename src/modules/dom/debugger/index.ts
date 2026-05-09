import { debugSelectors, diagnoseSelectors, formatDiagnostics } from './core'
import type {
  DebugOptions,
  SelectorDiagnostic,
  SelectorMap,
  SelectorResult,
  WaitForOptions,
  WaitForResult,
} from './type'

/**
 * DOM 选择器调试器
 *
 * 持有选择器配置的有状态封装，提供便捷的检测、诊断、等待方法。
 * 适合在浏览器控制台交互使用。
 *
 * @example
 * ```typescript
 * // 创建实例
 * const debugger_ = new DomDebugger({
 *   toolbar: '.bar-top',
 *   table: '.art-table',
 *   customPanel: (root) => root.querySelector('[data-role="panel"]')
 * })
 *
 * // 同步检测
 * debugger_.check()
 *
 * // 获取结构化诊断报告
 * const report = debugger_.diagnose()
 *
 * // 获取格式化文本
 * console.log(debugger_.diagnoseText())
 *
 * // 异步等待某个选择器出现
 * const result = await debugger_.waitFor('toolbar', { timeout: 3000 })
 *
 * // 重新检测（DOM 变化后）
 * debugger_.check()
 * ```
 *
 * @public
 */
export class DomDebugger {
  private selectors: SelectorMap
  private options: DebugOptions
  private lastResults: SelectorResult[] = []
  private lastDiagnostics: SelectorDiagnostic[] = []

  /**
   * 创建 DomDebugger 实例
   *
   * @param selectors - 选择器配置对象
   * @param options - 检测选项
   */
  constructor(selectors: SelectorMap, options: DebugOptions = {}) {
    this.selectors = selectors
    this.options = options
  }

  /**
   * 执行选择器检测，更新并返回结果
   *
   * @returns 所有选择器的检测结果
   */
  check(): SelectorResult[] {
    this.lastResults = debugSelectors(this.selectors, this.options)
    return this.lastResults
  }

  /**
   * 生成结构化诊断报告
   *
   * 如果从未调用 check()，会自动执行一次检测。
   *
   * @returns 诊断报告数组
   */
  diagnose(): SelectorDiagnostic[] {
    this.lastDiagnostics = diagnoseSelectors(this.selectors, this.options)
    return this.lastDiagnostics
  }

  /**
   * 生成人类可读的格式化诊断文本
   *
   * @returns 多行格式化文本，适合 console 打印
   */
  diagnoseText(): string {
    const diagnostics = this.diagnose()
    return formatDiagnostics(diagnostics)
  }

  /**
   * 异步等待指定选择器匹配成功
   *
   * 内部使用 MutationObserver 监听 DOM 变化，超时后返回失败结果。
   *
   * @param name - 选择器名称（必须在 selectors 配置中）
   * @param options - 等待选项
   * @returns 等待结果
   */
  waitFor(name: string, options: WaitForOptions = {}): Promise<WaitForResult> {
    const timeout = options.timeout ?? 5000
    const interval = options.interval ?? 500
    const value = this.selectors[name]
    const root = this.options.root ?? document
    const startTime = Date.now()

    if (!value) {
      return Promise.resolve({
        name,
        matched: false,
        element: null,
        elapsed: 0,
      })
    }

    return new Promise<WaitForResult>((resolve) => {
      // 先做一次同步检测
      const tryMatch = (): Element | null => {
        if (typeof value === 'function') {
          try {
            return value(root)
          } catch {
            return null
          }
        }
        return root.querySelector(value)
      }

      const initial = tryMatch()
      if (initial) {
        resolve({
          name,
          matched: true,
          element: initial,
          elapsed: Date.now() - startTime,
        })
        return
      }

      // 设置超时
      const timer = setTimeout(() => {
        observer.disconnect()
        resolve({
          name,
          matched: false,
          element: null,
          elapsed: Date.now() - startTime,
        })
      }, timeout)

      // MutationObserver 监听 DOM 变化
      const observerTarget =
        root instanceof Document ? root.documentElement : root
      const observer = new MutationObserver(() => {
        const el = tryMatch()
        if (el) {
          clearTimeout(timer)
          observer.disconnect()
          resolve({
            name,
            matched: true,
            element: el,
            elapsed: Date.now() - startTime,
          })
        }
      })

      observer.observe(observerTarget, {
        childList: true,
        subtree: true,
      })

      // 定时轮询兜底（MutationObserver 可能遗漏某些场景）
      const pollTimer = setInterval(() => {
        const el = tryMatch()
        if (el) {
          clearTimeout(timer)
          clearInterval(pollTimer)
          observer.disconnect()
          resolve({
            name,
            matched: true,
            element: el,
            elapsed: Date.now() - startTime,
          })
        }
      }, interval)

      // 超时时也清理轮询
      setTimeout(() => {
        clearInterval(pollTimer)
      }, timeout)
    })
  }

  /**
   * 添加或更新选择器配置
   *
   * @param selectors - 要合并的选择器配置
   */
  addSelectors(selectors: SelectorMap): void {
    this.selectors = { ...this.selectors, ...selectors }
  }

  /**
   * 移除指定名称的选择器
   *
   * @param names - 要移除的选择器名称
   */
  removeSelectors(...names: string[]): void {
    for (const name of names) {
      delete this.selectors[name]
    }
  }

  /**
   * 获取最后一次检测结果
   *
   * @returns 最后一次检测结果，未检测过则返回空数组
   */
  getLastResults(): SelectorResult[] {
    return this.lastResults
  }

  /**
   * 获取最后一次诊断报告
   *
   * @returns 最后一次诊断报告，未诊断过则返回空数组
   */
  getLastDiagnostics(): SelectorDiagnostic[] {
    return this.lastDiagnostics
  }

  /**
   * 获取当前配置的选择器名称列表
   *
   * @returns 选择器名称数组
   */
  getSelectorNames(): string[] {
    return Object.keys(this.selectors)
  }
}

export {
  debugSelectors,
  diagnoseSelectors,
  formatDiagnostics,
  isValidSelector,
} from './core'

export type {
  DebugOptions,
  SelectorDiagnostic,
  SelectorDiagnosticContext,
  SelectorFailReason,
  SelectorMap,
  SelectorResult,
  SelectorValue,
  WaitForOptions,
  WaitForResult,
} from './type'

export { SelectorFailReason as FailReason } from './type'
