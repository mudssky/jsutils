# brainstorm: storage README 与 Zod 适配评估

## Goal

为 `src/modules/storage` 补充模块级 README，帮助使用者快速理解 storage 的定位、适配器、类型化 schema、prefix 命名空间、缓存、同步/异步 API 与示例入口；同时评估该模块与 Zod 组合使用是否合适，明确推荐边界，避免把运行时校验能力错误地耦合进核心存储模块。

## What I already know

* 用户希望在 `src/modules/storage` 目录下新增 README 文档。
* 用户希望判断 storage 模块搭配 Zod 使用是否合适。
* 当前 storage 模块包含 `base.ts`、`types.ts`、`index.ts`、`adapters/` 与 `examples/`。
* 当前导出包含 `AbstractStorage`、`WebLocalStorage`、`WebSessionStorage`、`TaroStorage`、`UniStorage` 与 storage 类型。
* 当前 storage 核心能力是类型化 key/value 存储、prefix 命名空间隔离、可选缓存、同步/异步 API、存储信息查询。
* 现有示例已经覆盖 localStorage prefix、sessionStorage 基本用法、schema 类型安全、异步 API 与错误处理。
* `stateMachine` 模块已有 README，可作为模块级 README 的风格参考。
* 项目当前 `dependencies` 没有 Zod。
* ctx7 查询到 Zod 官方文档：Zod 适合对不可信输入使用 `parse` / `safeParse` 做运行时校验，并能由 schema 推导 TypeScript 类型。

## Assumptions (temporary)

* README 应该使用中文，风格贴近 `src/modules/stateMachine/README.md`。
* 本任务优先补文档和使用建议，不直接把 Zod 加入项目依赖。
* Zod 示例可以作为“业务层组合用法”出现，而不是作为 storage 核心能力承诺。

## Open Questions

* 无。

## Requirements (evolving)

* 在 `src/modules/storage/README.md` 新增模块级说明。
* README 覆盖模块定位、快速开始、核心概念、实例 API、各端适配器、prefix/caching 行为、示例链接与设计边界。
* 给出 storage 与 Zod 的适配建议：推荐在业务层读取后 `safeParse` 校验，不推荐把 Zod 作为 storage 核心依赖。
* README 不新增运行时代码依赖，不改变 storage 模块 API。
* README 包含 Zod 业务层组合示例，使用 `safeParse` 展示读取后校验。
* README 展示全局 `globalStorage` 单例导出模式，并提供 Zod helper 封装示例。

## Acceptance Criteria (evolving)

* [x] `src/modules/storage/README.md` 存在且内容为中文。
* [x] README 能让读者不打开源码也能知道如何选择 `WebLocalStorage`、`WebSessionStorage`、`TaroStorage`、`UniStorage`。
* [x] README 明确说明 TypeScript schema 只提供编译期约束，不能保证历史数据、外部篡改数据或旧版本数据的运行时有效性。
* [x] README 明确说明 Zod 更适合业务层校验或薄封装，不建议直接引入为核心依赖。
* [x] README 包含 `globalStorage`、`getParsedStorage` 和 `setParsedStorage` 示例。
* [x] 任务完成后执行 `pnpm qa`。

## Definition of Done (team quality bar)

* Tests added/updated (unit/integration where appropriate)
* Lint / typecheck / CI green
* Docs/notes updated if behavior changes
* Rollout/rollback considered if risky

## Out of Scope (explicit)

* 不修改 storage 核心实现。
* 不新增 Zod 依赖。
* 不新增测试页面或样式相关测试。
* 不把 README 示例扩展成完整文档站页面。

## Research References

* [`research/zod-storage.md`](research/zod-storage.md) — Zod 适合做读取不可信数据后的运行时校验；对 storage 核心更适合作为业务层可选组合。

## Research Notes

### Feasible approaches here

**Approach A: README 说明 Zod 推荐组合方式** (Recommended)

* How it works: README 中解释 TypeScript schema 与 Zod 的分工，并给出 `safeParse` 的业务层组合示例。
* Pros: 不增加核心依赖，保持 storage 轻量，同时回应 Zod 适配问题。
* Cons: 用户需要自行安装和维护 Zod schema。

**Approach B: README 仅说明设计边界，不放 Zod 示例**

* How it works: 只说明 storage 不做运行时校验，业务层可接入任意 validator。
* Pros: README 更聚焦 storage API，不引入外部库心智负担。
* Cons: 对“是否搭配 Zod”回答不够直接。

**Approach C: 新增 Zod storage helper**

* How it works: 在代码中新增接受 Zod schema 的封装，读取时自动校验。
* Pros: 使用体验更集中。
* Cons: 增加依赖和 API 面，超出当前“补 README + 评估”的最小范围。

## Technical Notes

* Inspected `src/modules/storage/base.ts`
* Inspected `src/modules/storage/types.ts`
* Inspected `src/modules/storage/index.ts`
* Inspected `src/modules/storage/adapters/web-local.ts`
* Inspected `src/modules/storage/adapters/web-session.ts`
* Inspected `src/modules/storage/adapters/taro.ts`
* Inspected `src/modules/storage/adapters/uni.ts`
* Inspected `src/modules/storage/examples/storage-prefix-example.md`
* Inspected `src/modules/storage/examples/session-storage-example.md`
* Inspected `src/modules/stateMachine/README.md`
* Inspected `package.json`
* ctx7 library result selected `/websites/zod_dev` for official Zod documentation coverage.

## Decision (ADR-lite)

**Context**: storage 当前通过 TypeScript 泛型提供编译期 key/value 约束，但真实存储中的数据可能来自历史版本、外部篡改或跨应用污染，仍属于不可信输入。用户希望判断是否适合搭配 Zod。

**Decision**: 采用 Approach A，在 `src/modules/storage/README.md` 中说明 Zod 适合做业务层运行时校验，并提供 `safeParse` 示例；不新增 Zod 依赖，不修改 storage 核心 API。

**Consequences**: README 能直接回答 Zod 适配问题，同时保持 storage 核心轻量。使用者需要自行安装 Zod 并维护业务 schema；如果未来这种模式高频出现，可再考虑放入 `storage-extras` 作为可选 helper。
