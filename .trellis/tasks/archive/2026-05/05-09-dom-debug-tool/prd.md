# DOM Debug Tool

## Goal

在 `src/modules/dom/` 下新增 `debugger` 模块，提供通用 DOM 元素选择器检测与诊断能力。当声明的 CSS 选择器在页面上不存在时，自动生成排障信息（未匹配选择器、DOM 上下文、可能原因），帮助开发者和 AI agent 快速定位"元素没出现"等问题。

作为 `@mudssky/jsutils` 的一部分发布，`my-userscripts` 等项目通过 npm 引入使用。

## What I already know

* jsutils 已有 `src/modules/dom/` 模块，含 `DOMHelper`（jQuery 风格）和 `highlighter`（文本高亮）
* 项目使用 tsdown 构建，输出 ESM/CJS 双格式
* 测试框架：Vitest + happy-dom
* `my-userscripts` 项目已有同名任务的 PRD（用户态 IIFE + 浮动面板），本任务取其核心检测逻辑，重新设计为通用库 API

## Assumptions (temporary)

* 库只负责检测和诊断，不负责 UI 渲染（面板等由消费者自行实现）
* 输出为结构化数据，消费者（userscript、devtools 插件等）自行决定展示方式
* `waitFor` 内部使用 MutationObserver，同步检测（`check()`）不依赖浏览器特定 API

## Decision (ADR-lite)

**API 风格：函数式核心 + Class 封装**
* **Context**: 库需要同时满足 tree-shakeable 的库消费场景和 console 交互调试场景
* **Decision**: 函数式 API 做核心检测逻辑（纯函数、无副作用、易测试），Class 做有状态封装（持有选择器配置、缓存结果、console 友好）
* **Consequences**: 导出两部分，使用者按需选用；Class 内部调用函数式 API，不重复逻辑

## Open Questions

(none)

## Requirements (evolving)

* **函数式 API（核心）**：纯函数，传入选择器配置对象，返回结构化检测结果
* **Class 封装（便捷）**：`DomDebugger` 类，持有选择器配置，提供 `check()`、`diagnose()` 等方法，适合 console 交互
* **选择器值类型**：支持 `string`（CSS 选择器）和 `(root: Element) => Element | null`（自定义断言函数）两种形式
* **异步检测**：内置 `waitFor(name, options?)` 方法，支持 timeout 配置，内部使用 MutationObserver 实现，返回 Promise
* **双输出模式**：`diagnose()` 返回结构化 JSON（agent 友好），`diagnoseText()` 返回格式化多行文本（console 人类友好）
* **选择器语法校验**：注册时校验 CSS 选择器语法合法性，非法选择器标记为 `INVALID_SELECTOR` 而非抛异常
* 检测结果包含：匹配/未匹配状态、匹配数量、未匹配原因分类
* 未匹配原因分类：元素未加载、选择器过期/拼写错误、iframe 隔离、Shadow DOM 隔离、元素存在但隐藏
* 诊断上下文：未匹配选择器的父级元素 tag/class、同级元素列表、最近匹配的祖先选择器
* TypeScript 编写，完整类型导出
* 零运行时依赖（仅用 jsutils 已有依赖）

## Acceptance Criteria (evolving)

* [ ] 传入选择器对象，返回结构化检测结果
* [ ] 未匹配选择器标注原因分类
* [ ] 已匹配选择器显示匹配数量
* [ ] 提供 `diagnose()` 方法返回结构化 JSON 诊断报告
* [ ] `waitFor(name, { timeout? })` 异步等待选择器匹配，超时返回失败结果
* [ ] `diagnoseText()` 返回格式化多行文本，适合 console 打印
* [ ] 非法 CSS 选择器语法标记为 `INVALID_SELECTOR`，不抛异常
* [ ] TypeScript 类型完整导出
* [ ] 单元测试覆盖核心检测逻辑
* [ ] 通过 `pnpm qa`

## Definition of Done

* TypeScript 源码通过 typecheck
* 单元测试覆盖核心检测逻辑
* `pnpm qa` 全部通过
* 从 `src/modules/dom/index.ts` 导出

## Out of Scope (explicit)

* UI 渲染（浮动面板、高亮等）——由消费者实现
* MutationObserver 持续监听——由消费者实现
* XPath 选择器支持
* ~~自定义断言函数 `(el) => boolean`~~ — 已纳入 MVP
* 导出检测报告为文件

## Technical Notes

* 放置路径：`src/modules/dom/debugger/`
* 构建系统：tsdown（已有配置，无需修改）
* 参考消费者：`my-userscripts/standalone/dmsHelper.user.js`
* 选择器类型参考：`SELECTORS = { resultContainer: '.con-sql-result', toolbar: '.bar-top', ... }`
