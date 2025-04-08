export class DOMHelper {
  constructor(private selector: string | HTMLElement) {}

  // 获取元素
  get(): HTMLElement | null {
    return typeof this.selector === 'string'
      ? document.querySelector(this.selector)
      : this.selector
  }

  // 获取元素文本内容
  text(defaultValue = ''): string {
    return this.get()?.textContent?.trim() || defaultValue
  }

  // 获取元素属性
  attr(attrName: string, defaultValue = ''): string {
    return this.get()?.getAttribute(attrName) || defaultValue
  }

  // 获取表单元素值（改进类型）
  val<T extends string | number | boolean>(defaultValue?: T): T | string {
    const el = this.get() as HTMLInputElement
    if (!el) return defaultValue as T

    if (typeof defaultValue === 'number') {
      const num = Number(el.value)
      return (isNaN(num) ? defaultValue : num) as T
    }
    if (typeof defaultValue === 'boolean') {
      return (el.value === 'true') as T
    }
    return el.value as T
  }

  // 设置元素文本
  setText(text: string): this {
    const el = this.get()
    if (el) el.textContent = text
    return this
  }

  // 设置元素属性
  setAttr(attrName: string, value: string): this {
    this.get()?.setAttribute(attrName, value)
    return this
  }

  // 添加/移除 CSS 类
  addClass(className: string): this {
    this.get()?.classList.add(className)
    return this
  }

  removeClass(className: string): this {
    this.get()?.classList.remove(className)
    return this
  }

  toggleClass(className: string): this {
    this.get()?.classList.toggle(className)
    return this
  }

  // 检查元素是否存在
  exists(): boolean {
    return this.get() !== null
  }

  // 静态方法创建实例
  static $(selector: string): DOMHelper {
    return new DOMHelper(selector)
  }

  // 事件绑定/解绑
  private eventHandlers = new Map<string, EventListener>()

  on(event: string, handler: EventListener): this {
    const el = this.get()
    if (el) {
      this.eventHandlers.set(event, handler)
      el.addEventListener(event, handler)
    }
    return this
  }

  off(event: string): this {
    const el = this.get()
    const handler = this.eventHandlers.get(event)
    if (el && handler) {
      el.removeEventListener(event, handler)
      this.eventHandlers.delete(event)
    }
    return this
  }

  // 链式操作父/子元素
  parent(): DOMHelper | null {
    const parent = this.get()?.parentElement
    return parent ? new DOMHelper(parent) : null
  }

  children(selector?: string): DOMHelper[] {
    const children = selector
      ? Array.from(this.get()?.querySelectorAll(selector) || [])
      : Array.from(this.get()?.children || [])
    return children.map((el) => new DOMHelper(el as HTMLElement))
  }
}

// 保留原有的 $ 对象导出
export const $ = DOMHelper.$
