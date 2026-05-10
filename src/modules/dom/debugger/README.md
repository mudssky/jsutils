# DOM Debugger 模块

提供 DOM 元素选择器检测与诊断能力，帮助开发者和 AI agent 快速定位"元素没出现"等问题。

## 功能

- **选择器检测**：传入 CSS 选择器或自定义查询函数，返回匹配状态
- **诊断报告**：未匹配选择器自动生成排障建议和 DOM 上下文信息
- **异步等待**：`waitFor()` 基于 MutationObserver 等待动态加载的元素
- **语法校验**：非法 CSS 选择器标记为 `INVALID_SELECTOR`，不抛异常
- **双输出模式**：结构化 JSON（agent 友好）+ 格式化文本（console 友好）

## 快速开始

### 函数式 API

```typescript
import {
  debugSelectors,
  diagnoseSelectors,
  formatDiagnostics,
} from '@mudssky/jsutils'

// 基础检测
const results = debugSelectors({
  toolbar: '.bar-top',
  table: '.art-table',
  customPanel: (root) => root.querySelector('[data-role="panel"]'),
})

// 完整诊断（含排障建议和 DOM 上下文）
const diagnostics = diagnoseSelectors({
  toolbar: '.bar-top',
  table: '.art-table',
})

// 格式化文本输出
console.log(formatDiagnostics(diagnostics))
// DOM Debug: 1/2 选择器匹配
// ────────────────────────────────────────
// ✓ toolbar (.bar-top) — 匹配 1 个元素
// ✗ table (.art-table) — 未匹配: NOT_FOUND
//   建议: 选择器 "table" 未匹配到元素。...
```

### Class 封装

```typescript
import { DomDebugger } from '@mudssky/jsutils'

const dbg = new DomDebugger({
  toolbar: '.bar-top',
  table: '.art-table',
})

// 同步检测
dbg.check()

// 诊断报告（JSON）
const report = dbg.diagnose()

// 诊断报告（文本）
console.log(dbg.diagnoseText())

// 异步等待动态元素
const result = await dbg.waitFor('toolbar', { timeout: 5000 })

// 动态增删选择器
dbg.addSelectors({ sidebar: '.sidebar' })
dbg.removeSelectors('table')
```

## API 参考

### 函数

| 函数                                     | 说明                                                |
| ---------------------------------------- | --------------------------------------------------- |
| `debugSelectors(selectors, options?)`    | 纯函数，返回检测结果数组                            |
| `diagnoseSelectors(selectors, options?)` | 纯函数，返回诊断报告数组（含排障建议和 DOM 上下文） |
| `formatDiagnostics(diagnostics)`         | 将诊断报告格式化为多行文本                          |
| `isValidSelector(selector)`              | 校验 CSS 选择器语法是否合法                         |

### DomDebugger 类

| 方法                        | 说明                                              |
| --------------------------- | ------------------------------------------------- |
| `check()`                   | 执行检测，返回 `SelectorResult[]`                 |
| `diagnose()`                | 生成诊断报告，返回 `SelectorDiagnostic[]`         |
| `diagnoseText()`            | 生成格式化文本，返回 `string`                     |
| `waitFor(name, options?)`   | 异步等待选择器匹配，返回 `Promise<WaitForResult>` |
| `addSelectors(selectors)`   | 添加选择器                                        |
| `removeSelectors(...names)` | 移除选择器                                        |

### 未匹配原因

| 枚举值             | 说明                   |
| ------------------ | ---------------------- |
| `NOT_FOUND`        | 选择器未匹配到任何元素 |
| `INVALID_SELECTOR` | 选择器语法非法         |
| `HIDDEN`           | 元素存在但不可见       |
| `SHADOW_DOM`       | 元素在 Shadow DOM 内   |
| `IFRAME`           | 元素在 iframe 内       |
