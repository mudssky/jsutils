# Highlighter 多关键词高亮功能

## 概述

`Highlighter` 类现在支持同时高亮多个关键词，这使得在文档中搜索和标记多个相关术语变得更加便捷。

## 新增功能

### 1. 多关键词支持

`apply()` 和 `applySync()` 方法现在接受 `string | string[]` 类型的关键词参数：

```typescript
// 单个关键词（原有功能）
await highlighter.apply('JavaScript')

// 多个关键词（新功能）
await highlighter.apply(['JavaScript', 'React', 'Vue'])
```

### 2. 新增方法

#### `getCurrentKeywords(): string[]`

返回当前高亮的关键词数组：

```typescript
const keywords = highlighter.getCurrentKeywords()
console.log(keywords) // ['JavaScript', 'React', 'Vue']
```

#### `getCurrentKeyword(): string` (已弃用)

为了向后兼容，保留了原有的 `getCurrentKeyword()` 方法，但现在返回逗号分隔的关键词字符串：

```typescript
const keywordString = highlighter.getCurrentKeyword()
console.log(keywordString) // 'JavaScript, React, Vue'
```

> ⚠️ **注意**: `getCurrentKeyword()` 方法已标记为 `@deprecated`，建议使用 `getCurrentKeywords()` 方法。

### 3. 回调函数更新

`onHighlightApplied` 回调函数现在接收逗号分隔的关键词字符串：

```typescript
const highlighter = new Highlighter(
  element,
  {},
  {
    onHighlightApplied: (matchCount, keywords) => {
      console.log(`找到 ${matchCount} 个匹配项`)
      console.log(`关键词: ${keywords}`) // 'JavaScript, React, Vue'
    },
  },
)
```

## 使用示例

### 基本用法

```typescript
import { Highlighter } from '@mudssky/jsutils'

const container = document.getElementById('content')
const highlighter = new Highlighter(container)

// 高亮多个关键词
const keywords = ['JavaScript', 'TypeScript', 'React']
const matchCount = await highlighter.apply(keywords)

console.log(`找到 ${matchCount} 个匹配项`)
console.log(`当前关键词:`, highlighter.getCurrentKeywords())
```

### 带选项的用法

```typescript
// 区分大小写的多关键词搜索
const count = await highlighter.apply(['JavaScript', 'javascript'], {
  caseSensitive: true,
})

// 完整单词匹配
const count2 = await highlighter.apply(['Script', 'JavaScript'], {
  wholeWord: true,
})
```

### 同步版本

```typescript
// 同步方法也支持多关键词
const count = highlighter.applySync(['React', 'Vue', 'Angular'])
```

### 导航功能

```typescript
// 多关键词高亮后的导航
await highlighter.apply(['JavaScript', 'React'])

// 导航到下一个匹配项（可能是不同的关键词）
highlighter.next()

// 导航到上一个匹配项
highlighter.previous()

// 获取当前位置信息
console.log(
  `当前位置: ${highlighter.getCurrentIndex() + 1}/${highlighter.getMatchCount()}`,
)
```

## 实现细节

### 正则表达式组合

多个关键词会被组合成一个正则表达式，使用 `|` 操作符连接：

```typescript
// 输入: ['JavaScript', 'React', 'Vue']
// 生成的正则: /JavaScript|React|Vue/gi
```

### 特殊字符转义

所有关键词中的正则表达式特殊字符都会被自动转义：

```typescript
// 输入: ['$100', '[test]', '(demo)']
// 安全转义后进行匹配
```

### 空值处理

空字符串和仅包含空白字符的关键词会被自动过滤：

```typescript
// 输入: ['', 'JavaScript', '   ', 'React']
// 实际处理: ['JavaScript', 'React']
```

## 向后兼容性

- 所有原有的单关键词功能保持不变
- `getCurrentKeyword()` 方法仍然可用，但建议迁移到 `getCurrentKeywords()`
- 回调函数签名保持兼容，但参数含义略有变化

## 性能考虑

- 多关键词搜索使用单个正则表达式，性能优于多次单独搜索
- 大量关键词可能会影响正则表达式的性能，建议合理控制关键词数量
- 启用性能优化选项可以提升大文档的处理速度

## 测试覆盖

新功能包含完整的测试覆盖，包括：

- 多关键词高亮功能测试
- 新增方法的功能测试
- 选项组合测试（大小写敏感、完整单词匹配）
- 边界情况测试（空数组、混合空值等）
- 回调函数测试
- 导航功能测试
- 状态管理测试

## 迁移指南

如果你正在使用旧版本的 `Highlighter`，迁移到多关键词版本非常简单：

```typescript
// 旧代码
await highlighter.apply('JavaScript')
const keyword = highlighter.getCurrentKeyword()

// 新代码（完全兼容）
await highlighter.apply('JavaScript')
const keyword = highlighter.getCurrentKeyword() // 仍然工作
const keywords = highlighter.getCurrentKeywords() // 推荐使用

// 使用新功能
await highlighter.apply(['JavaScript', 'React', 'Vue'])
const keywords = highlighter.getCurrentKeywords()
```

## 示例页面

查看 `examples/highlighter-multiple-keywords.html` 文件，了解完整的交互式示例。
