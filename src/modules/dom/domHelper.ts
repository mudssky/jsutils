/**
 * DOM 操作辅助类
 * @public
 */
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

  // 隐藏元素
  hide(): this {
    const el = this.get()
    if (el) el.style.display = 'none'
    return this
  }

  // 显示元素
  show(): this {
    const el = this.get()
    if (el) el.style.display = ''
    return this
  }

  // 设置元素样式
  setStyle(style: string | Record<string, string>, value?: string): this {
    const el = this.get()
    if (!el) return this

    if (typeof style === 'string') {
      // 处理单个样式属性
      const prop = style.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      el.style.setProperty(prop, value || '')
    } else {
      // 处理样式对象
      Object.entries(style).forEach(([key, val]) => {
        const prop = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
        el.style.setProperty(prop, val)
      })
    }
    return this
  }

  // 添加子元素
  appendChild(child: HTMLElement | DOMHelper): this {
    const el = this.get()
    const childEl = child instanceof DOMHelper ? child.get() : child
    if (el && childEl) el.appendChild(childEl)
    return this
  }

  // 在最前面插入子元素
  prependChild(child: HTMLElement | DOMHelper): this {
    const el = this.get()
    const childEl = child instanceof DOMHelper ? child.get() : child
    if (el && childEl) el.insertBefore(childEl, el.firstChild)
    return this
  }

  // 移除子元素
  removeChild(child: HTMLElement | DOMHelper): this {
    const el = this.get()
    const childEl = child instanceof DOMHelper ? child.get() : child
    if (el && childEl && el.contains(childEl)) el.removeChild(childEl)
    return this
  }

  // 创建DOM元素
  static createElement(
    tagName: string,
    attributes: Record<string, string> = {},
    children: Array<HTMLElement | DOMHelper> = [],
  ): DOMHelper {
    const element = document.createElement(tagName)

    // 设置属性
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })

    // 添加子元素
    children.forEach((child) => {
      const childEl = child instanceof DOMHelper ? child.get() : child
      if (childEl) element.appendChild(childEl)
    })

    return new DOMHelper(element)
  }
}

// 保留原有的 $ 对象导出
/**
 * jQuery 风格的 DOM 选择器函数
 * @public
 */
export const $ = DOMHelper.$
