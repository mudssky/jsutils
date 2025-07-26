# Highlighter 文本高亮器

`Highlighter` 是一个强大的文本高亮工具类，提供在指定 DOM 元素中高亮显示关键词的功能，支持导航到不同的匹配项。

## 特性

- 🎯 **精确匹配**：支持大小写敏感和完整单词匹配
- 🎨 **自定义样式**：可配置高亮标签、CSS 类名和样式
- 🚀 **性能优化**：支持大文档的批量处理和异步操作
- 📍 **智能导航**：提供前进、后退、跳转等导航功能
- 🔄 **事件回调**：支持高亮应用、移除、导航等事件监听
- 🛡️ **安全过滤**：自动跳过脚本、样式等特殊标签
- 🎪 **灵活配置**：支持动态更新配置和回调函数

## 安装

```bash
npm install @mudssky/jsutils
```

## 基本用法

### 简单示例

```typescript
import { Highlighter } from '@mudssky/jsutils'

// 获取目标容器
const container = document.getElementById('content')

// 创建高亮器实例
const highlighter = new Highlighter(container)

// 应用高亮
highlighter.apply('JavaScript')

// 导航到下一个匹配项
highlighter.next()

// 导航到上一个匹配项
highlighter.previous()

// 获取匹配总数
console.log(`找到 ${highlighter.getMatchCount()} 个匹配项`)

// 清除所有高亮
highlighter.remove()
```

### 高级配置

```typescript
import {
  Highlighter,
  HighlighterConfig,
  HighlightCallbacks,
} from '@mudssky/jsutils'

// 配置选项
const config: HighlighterConfig = {
  highlightTag: 'span', // 使用 span 标签
  highlightClass: 'search-result', // 自定义高亮样式类
  activeClass: 'current-match', // 自定义激活样式类
  skipTags: ['SCRIPT', 'STYLE', 'CODE'], // 跳过的标签
  scrollOptions: {
    // 滚动行为配置
    behavior: 'smooth',
    block: 'center',
  },
  enablePerformanceOptimization: true, // 启用性能优化
}

// 事件回调
const callbacks: HighlightCallbacks = {
  onHighlightApplied: (count, keyword) => {
    console.log(`找到 ${count} 个 "${keyword}" 的匹配项`)
    updateSearchInfo(count, keyword)
  },
  onHighlightRemoved: () => {
    console.log('高亮已清除')
    clearSearchInfo()
  },
  onNavigate: (index, total, element) => {
    console.log(`当前: ${index + 1}/${total}`)
    updateCurrentPosition(index + 1, total)
    // 可以对当前激活元素进行额外处理
    element.setAttribute('aria-current', 'true')
  },
}

// 创建高亮器
const highlighter = new Highlighter(container, config, callbacks)
```

## API 参考

### 构造函数

```typescript
constructor(
  targetNode: HTMLElement,
  config?: HighlighterConfig,
  callbacks?: HighlightCallbacks
)
```

**参数：**

- `targetNode`: 要进行高亮操作的目标 DOM 元素
- `config`: 可选的配置选项
- `callbacks`: 可选的事件回调函数

### 主要方法

#### `apply(keyword, options?)`

应用高亮到指定关键词。

```typescript
async apply(keyword: string, options?: HighlightOptions): Promise<number>
```

**参数：**

- `keyword`: 要高亮的关键词
- `options`: 高亮选项
  - `caseSensitive?: boolean` - 是否区分大小写（默认：false）
  - `wholeWord?: boolean` - 是否只匹配完整单词（默认：false）

**返回值：** 匹配项的数量

**示例：**

```typescript
// 基本高亮
const count1 = await highlighter.apply('JavaScript')

// 区分大小写
const count2 = await highlighter.apply('JavaScript', { caseSensitive: true })

// 只匹配完整单词
const count3 = await highlighter.apply('script', { wholeWord: true })

// 组合选项
const count4 = await highlighter.apply('API', {
  caseSensitive: true,
  wholeWord: true,
})
```

#### `remove()`

移除所有高亮。

```typescript
remove(): void
```

#### `next()`

跳转到下一个高亮项。

```typescript
next(): boolean
```

**返回值：** 是否成功跳转

#### `previous()`

跳转到上一个高亮项。

```typescript
previous(): boolean
```

**返回值：** 是否成功跳转

#### `jumpTo(index)`

跳转到指定索引的高亮项。

```typescript
jumpTo(index: number): boolean
```

**参数：**

- `index`: 目标索引（从 0 开始）

**返回值：** 是否成功跳转

#### `getMatchCount()`

获取匹配总数。

```typescript
getMatchCount(): number
```

#### `getCurrentIndex()`

获取当前激活项的索引。

```typescript
getCurrentIndex(): number
```

**返回值：** 当前激活项的索引，如果没有匹配项则返回 -1

#### `getCurrentKeyword()`

获取当前高亮的关键词。

```typescript
getCurrentKeyword(): string
```

#### `getCurrentElement()`

获取当前激活的高亮元素。

```typescript
getCurrentElement(): HTMLElement | null
```

#### `getAllHighlights()`

获取所有高亮元素。

```typescript
getAllHighlights(): HTMLElement[]
```

#### `updateConfig(newConfig)`

动态更新配置。

```typescript
updateConfig(newConfig: Partial<HighlighterConfig>): void
```

#### `updateCallbacks(newCallbacks)`

动态更新回调函数。

```typescript
updateCallbacks(newCallbacks: Partial<HighlightCallbacks>): void
```

## 配置选项

### HighlighterConfig

```typescript
interface HighlighterConfig {
  highlightTag?: string // 高亮标签名称（默认：'mark'）
  highlightClass?: string // 高亮样式类（默认：'highlight'）
  activeClass?: string // 激活样式类（默认：'highlight-active'）
  skipTags?: string[] // 跳过的标签（默认：['SCRIPT', 'STYLE', 'NOSCRIPT']）
  scrollOptions?: ScrollIntoViewOptions // 滚动配置（默认：{ behavior: 'smooth', block: 'center' }）
  enablePerformanceOptimization?: boolean // 性能优化（默认：true）
}
```

### HighlightCallbacks

```typescript
interface HighlightCallbacks {
  onHighlightApplied?: (matchCount: number, keyword: string) => void
  onHighlightRemoved?: () => void
  onNavigate?: (
    currentIndex: number,
    totalCount: number,
    element: HTMLElement,
  ) => void
}
```

## 实际应用示例

### 搜索功能实现

```typescript
class SearchComponent {
  private highlighter: Highlighter
  private searchInput: HTMLInputElement
  private resultInfo: HTMLElement
  private navButtons: { prev: HTMLButtonElement; next: HTMLButtonElement }

  constructor(container: HTMLElement) {
    this.searchInput = document.getElementById(
      'search-input',
    ) as HTMLInputElement
    this.resultInfo = document.getElementById('search-info') as HTMLElement
    this.navButtons = {
      prev: document.getElementById('prev-btn') as HTMLButtonElement,
      next: document.getElementById('next-btn') as HTMLButtonElement,
    }

    // 创建高亮器
    this.highlighter = new Highlighter(
      container,
      {
        highlightClass: 'search-highlight',
        activeClass: 'search-active',
      },
      {
        onHighlightApplied: (count, keyword) =>
          this.updateSearchInfo(count, keyword),
        onHighlightRemoved: () => this.clearSearchInfo(),
        onNavigate: (index, total) => this.updateNavigation(index, total),
      },
    )

    this.bindEvents()
  }

  private bindEvents() {
    // 搜索输入
    this.searchInput.addEventListener('input', (e) => {
      const keyword = (e.target as HTMLInputElement).value.trim()
      if (keyword) {
        this.highlighter.apply(keyword, {
          caseSensitive: false,
          wholeWord: false,
        })
      } else {
        this.highlighter.remove()
      }
    })

    // 导航按钮
    this.navButtons.prev.addEventListener('click', () => {
      this.highlighter.previous()
    })

    this.navButtons.next.addEventListener('click', () => {
      this.highlighter.next()
    })

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault()
            this.searchInput.focus()
            break
          case 'g':
            e.preventDefault()
            if (e.shiftKey) {
              this.highlighter.previous()
            } else {
              this.highlighter.next()
            }
            break
        }
      }
    })
  }

  private updateSearchInfo(count: number, keyword: string) {
    this.resultInfo.textContent = `找到 ${count} 个 "${keyword}" 的匹配项`
    this.navButtons.prev.disabled = count === 0
    this.navButtons.next.disabled = count === 0
  }

  private clearSearchInfo() {
    this.resultInfo.textContent = ''
    this.navButtons.prev.disabled = true
    this.navButtons.next.disabled = true
  }

  private updateNavigation(index: number, total: number) {
    if (total > 0) {
      this.resultInfo.textContent = `第 ${index + 1} 个，共 ${total} 个匹配项`
    }
  }
}

// 使用
const searchComponent = new SearchComponent(document.getElementById('content'))
```

### CSS 样式示例

```css
/* 基本高亮样式 */
.search-highlight {
  background-color: #ffeb3b;
  color: #333;
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: normal;
}

/* 当前激活的高亮项 */
.search-active {
  background-color: #ff9800;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 0 3px rgba(255, 152, 0, 0.5);
}

/* 搜索界面样式 */
.search-container {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.search-input {
  width: 200px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  margin-bottom: 5px;
}

.search-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.search-nav {
  display: flex;
  gap: 5px;
}

.search-nav button {
  padding: 3px 8px;
  border: 1px solid #ccc;
  background: #f5f5f5;
  border-radius: 3px;
  cursor: pointer;
}

.search-nav button:hover:not(:disabled) {
  background: #e0e0e0;
}

.search-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## 性能优化

### 大文档处理

对于包含大量文本的文档，`Highlighter` 提供了性能优化选项：

```typescript
const highlighter = new Highlighter(container, {
  enablePerformanceOptimization: true, // 启用性能优化
  skipTags: ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'], // 跳过更多标签
})

// 使用异步方式应用高亮
async function performSearch(keyword: string) {
  try {
    const count = await highlighter.apply(keyword)
    console.log(`处理完成，找到 ${count} 个匹配项`)
  } catch (error) {
    console.error('搜索过程中出现错误:', error)
  }
}
```

### 内存管理

```typescript
// 在组件销毁时清理资源
class SearchComponent {
  destroy() {
    // 清除高亮
    this.highlighter.remove()

    // 移除事件监听器
    this.removeEventListeners()

    // 清空回调
    this.highlighter.updateCallbacks({})
  }
}
```

## 注意事项

1. **DOM 结构**：高亮器会修改 DOM 结构，请确保在应用高亮前保存必要的状态
2. **事件处理**：高亮操作可能会影响原有的事件监听器，建议使用事件委托
3. **样式冲突**：确保高亮样式不会与现有样式产生冲突
4. **性能考虑**：对于大型文档，建议启用性能优化选项
5. **无障碍访问**：考虑为高亮元素添加适当的 ARIA 属性

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

MIT License
