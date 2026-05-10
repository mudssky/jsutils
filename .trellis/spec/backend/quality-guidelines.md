# 代码质量规范

> 代码标准、linting 规则和提交规范。

---

## Linting 工具栈

项目使用三层 lint 工具：

| 工具 | 配置文件 | 职责 |
|------|----------|------|
| ESLint | `eslint.config.mjs` | TypeScript 规则 + tsdoc 语法检查 |
| Biome | `biome.json` | 格式化 + import 排序 |
| Prettier | `.prettierrc.cjs` | 通过 lint-staged 在提交时运行 |

### 格式化配置

- 缩进：2 空格
- 分号：按需（`semicolons: "asNeeded"`）
- 引号：单引号
- 尾逗号：全部（`trailingCommas: "all"`）
- 行宽：80
- 箭头函数括号：始终

---

## QA 命令

```bash
pnpm qa  # 并行运行 typecheck + lint + test + types
```

必须全部通过才能提交。

---

## 导出规范

### 必须遵循

- 每个导出的函数/类型/类必须有 JSDoc 注释
- JSDoc 中必须包含 `@public` 标签（用于 api-extractor）
- 函数必须有 `@param` 和 `@returns` 说明
- 类型导出使用 `export type { ... }`，值导出使用 `export { ... }`

### 注释语言

- 中文注释为主（JSDoc、行内注释）
- 从外部库借鉴的函数保留英文注释

---

## 禁止的模式

- **禁止使用 TypeScript `enum`** — 项目使用 `EnumArray` 类模式替代
- **禁止在导出 API 中使用 `any` 而不加 eslint-disable 注释** — 如需使用 `any`，在文件顶部加 `/* eslint-disable @typescript-eslint/no-explicit-any */`
- **禁止未使用的导入** — Biome import 排序会自动清理
- **禁止 `console.log` 在生产代码中** — 使用 `ConsoleLogger` 模块
- **禁止在工具函数中引入外部依赖** — 仅使用 `clsx` 和 `tailwind-merge`（已有的 dependencies）

---

## 提交规范

遵循 Conventional Commits：

```
<type>(<scope>): <中文描述>
```

type 可选：feat / fix / refactor / style / docs / test / chore

示例：
- `feat(array): 添加分组函数`
- `fix(string): 修复空字符串边界情况`
- `chore(deps): 升级依赖包版本`
