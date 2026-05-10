# 前端目录结构

> 本项目为纯 TypeScript 工具库，无 UI 组件。此文件记录 DOM 模块和构建相关结构。

---

## 构建配置

```
项目根目录/
├── tsdown.config.ts       # 构建配置（ESM + CJS + UMD）
├── tsconfig.json           # TypeScript 配置
├── vitest.config.ts        # 测试配置
├── biome.json              # 格式化配置
├── eslint.config.mjs       # Lint 配置
├── lint-staged.config.js   # 提交时 lint
└── .prettierrc.cjs         # Prettier 配置
```

---

## 构建产物

| 格式 | 目录 | DTS | 说明 |
|------|------|-----|------|
| ESM | `dist/esm/` | `.d.ts` | 主格式，unbundle |
| CJS | `dist/cjs/` | `.d.cts` | 兼容格式，unbundle |
| UMD | `dist/umd/` | 无 | 浏览器直接引用，bundled + minified |

构建命令：`pnpm build`（使用 tsdown）

---

## DOM 模块结构

```
src/modules/dom/
├── index.ts               # barrel 导出
├── domHelper.ts           # DOMHelper 类（jQuery 风格）
├── debugger/              # DOM 调试工具
│   ├── index.ts           # DomDebugger 类 + 导出
│   ├── core.ts            # 函数式核心 API
│   └── type.ts            # 类型定义
├── highlighter/           # 文本高亮器
│   ├── index.ts           # Highlighter 类
│   └── type.ts            # 类型定义
└── examples/              # HTML 示例
```

---

## 新增模块步骤

1. 在 `src/modules/` 下创建文件或目录
2. 如为目录模块，创建 `index.ts` barrel
3. 在 `src/index.ts` 中添加 `export * from './modules/<name>'`
4. 在 `test/` 下创建对应的测试文件
5. 运行 `pnpm qa` 确认通过
