# Brainstorm: 迁移到 tsdown 构建

**日期:** 2026-03-13
**状态:** 已完成

## What We're Building

将 `@mudssky/jsutils` 的构建工具从 Rollup 迁移到 **tsdown**（Rolldown 团队为库打包场景设计的高层构建工具），以简化构建配置、提升构建速度、减少插件依赖。

### 当前状态

- **构建工具:** Rollup v4 + 9 个插件（跨两个配置文件）
- **输出格式:** ESM（preserveModules）、CJS（preserveModules, `.cjs` 扩展名）、UMD（单文件 minified）
- **类型声明:** rollup-plugin-dts 生成 `.d.ts`（`dist/types/`）+ `.d.cts`（`dist/typescts/`）
- **开发构建:** 独立的 rollup.config.dev.js，使用 rollup-plugin-esbuild
- **prebuild:** PowerShell 脚本（clean:dist, copy:style）
- **外部依赖:** ESM/CJS 排除 `clsx`、`tailwind-merge`；UMD 内联所有依赖

### 目标状态

- **构建工具:** tsdown（底层 Rolldown + Oxc）
- **输出格式:** 保持不变 — ESM + CJS + UMD
- **类型声明:** tsdown 内置 dts 生成（基于 Oxc isolatedDeclarations）
- **开发构建:** tsdown --watch 替代 rollup.config.dev.js
- **prebuild:** PowerShell 脚本保持不变

## Why This Approach

### 选择 tsdown 而非直接使用 Rolldown 的理由

1. **专为库打包设计** — tsdown 是 Rolldown 团队针对库场景的上层封装，开箱即用
2. **配置极简** — 一个 `tsdown.config.ts` 替代两个 Rollup 配置文件 + 9 个插件
3. **内置 dts 生成** — 不需要单独的 dts 插件，基于 Oxc isolatedDeclarations 性能更好
4. **unbundle 模式** — 等同于 Rollup 的 preserveModules，保证 tree-shaking 效果
5. **UMD 完整支持** — tsdown 原生支持 `format: 'umd'`，可配 globalName 和 minify

### 迁移动机

- **构建速度** — Rolldown (Rust) 显著快于 Rollup (JS)
- **统一工具链** — 跟随 Vite/Rolldown 生态发展
- **减少维护负担** — 从 9 个插件减少到几乎零插件
- **面向未来** — Rolldown 是 Rollup 的 Rust 重写，长期方向明确

## Key Decisions

### 1. 构建工具选择：tsdown

选择 tsdown 而非直接 Rolldown，因为它专为库场景优化，配置更简洁。

### 2. UMD 格式保留

继续输出 UMD 格式（`dist/umd/index.js`），用于 `<script>` 标签场景。tsdown 原生支持 `format: 'umd'`。注意：UMD 构建不设置 external，内联 `clsx` 和 `tailwind-merge`。

### 3. 类型声明策略

使用 tsdown 内置的 `dts: true` 生成类型声明，替代 rollup-plugin-dts。tsdown 的 dts 基于 Oxc `isolatedDeclarations`，需要源码中所有导出函数/变量有显式类型标注。

**前置条件：** 迁移前必须先运行 `tsc --isolatedDeclarations` 评估代码改动量，已知需要添加返回类型标注的函数包括 `getEnvironmentInfo()`、`createPolling()`、`createLogger()`、`createPerformanceMonitor()` 等。

### 4. 双配置合并

将 `rollup.config.js`（生产）和 `rollup.config.dev.js`（开发）合并为单个 `tsdown.config.ts`，开发模式通过 `tsdown --watch` 实现。

### 5. prebuild 脚本不变

PowerShell 的 `clean:dist` 和 `copy:style` 脚本保持不变。**重要：** tsdown 的内置 `clean` 选项不能启用，否则会在 `copy:style` 执行后清除已拷贝的样式文件。

### 6. package.json exports 路径

迁移时有两种策略：

- **保守：** 通过 tsdown 的 `outDir` 精确匹配现有路径结构（`dist/esm/`、`dist/cjs/`、`dist/types/`、`dist/typescts/`）
- **激进：** 趁迁移机会简化路径结构，统一输出到 `dist/` 并使用 `fixedExtension`（`.mjs`/`.cjs`/`.d.mts`/`.d.cts`），同步更新 `exports` 字段

### 7. 历史遗留清理

迁移时一并清理：

- `tsconfig.cts.json` — 评估是否仍需要，tsdown 自动处理 CJS 输出
- `tslib` — 源码中未使用，可移除
- `@rollup/plugin-typescript` — 已安装但从未使用

## 预期配置草图

```typescript
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig([
  // ESM（unbundle 模式保留模块结构）
  {
    entry: ['src/index.ts'],
    format: 'esm',
    outDir: 'dist/esm',
    unbundle: true,
    dts: true, // 输出 .d.ts 到同目录或 dist/types
    external: ['clsx', 'tailwind-merge'],
  },
  // CJS（unbundle 模式保留模块结构，.cjs 扩展名）
  {
    entry: ['src/index.ts'],
    format: 'cjs',
    outDir: 'dist/cjs',
    unbundle: true,
    dts: true, // 输出 .d.cts
    external: ['clsx', 'tailwind-merge'],
  },
  // UMD（单文件打包，minified，内联所有依赖）
  {
    entry: ['src/index.ts'],
    format: 'umd',
    outDir: 'dist/umd',
    globalName: 'utils',
    minify: true,
    // 注意：不设置 external，内联 clsx 和 tailwind-merge
  },
])
```

> **注意：** 此草图是 brainstorm 阶段的方向性参考。dts 的双路径输出、`outExtensions` 配置等细节需要在 plan 阶段通过实际 spike 测试确认。

## 可移除的依赖

迁移后可从 `devDependencies` 移除：

| 包                            | 原因                        |
| ----------------------------- | --------------------------- |
| `rollup`                      | 被 tsdown/rolldown 替代     |
| `rollup-plugin-typescript2`   | tsdown 内置 TypeScript 支持 |
| `rollup-plugin-dts`           | tsdown 内置 dts 生成        |
| `rollup-plugin-esbuild`       | tsdown 内置快速编译         |
| `@rollup/plugin-commonjs`     | tsdown 内置                 |
| `@rollup/plugin-node-resolve` | tsdown 内置                 |
| `@rollup/plugin-babel`        | tsdown 使用 Oxc 转换        |
| `@rollup/plugin-terser`       | tsdown 内置 minify          |
| `@rollup/plugin-typescript`   | 从未使用，直接移除          |
| `rollup-plugin-node-builtins` | UMD 构建由 tsdown 处理      |
| `rollup-plugin-node-globals`  | UMD 构建由 tsdown 处理      |
| `@babel/core`                 | 不再需要 babel              |
| `@babel/preset-env`           | 不再需要 babel              |
| `esbuild`                     | 被 Oxc 替代                 |
| `tslib`                       | 源码中未使用，历史遗留      |

## 风险与缓解

| 风险                                           | 严重程度 | 缓解措施                                                           |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `isolatedDeclarations` 要求大量代码改动        | **高**   | 迁移前先运行 `tsc --isolatedDeclarations` 统计需修改的导出函数数量 |
| tsdown 较新，可能有 edge case                  | 中       | 保留旧配置文件直到验证通过，用 `pnpm qa` 全面测试                  |
| dts 输出路径不匹配现有 exports                 | 中       | 通过 `outExtensions` 精细控制；或趁机简化路径结构并更新 exports    |
| tsdown `clean` 与 `copy:style` 时序冲突        | 中       | 明确禁用 tsdown 的 clean 选项，继续使用 PowerShell prebuild        |
| UMD 构建中 node builtins polyfill 缺失         | 中       | 测试 tsdown UMD 输出，必要时用 Rolldown 插件补充                   |
| unbundle 输出结构与 preserveModules 不完全等价 | 中       | 对比迁移前后的 dist 目录结构（文件名、层级、内容）                 |
| `dist/typescts` 非常规目录名复现               | 低       | 考虑趁迁移机会标准化为 `dist/cjs/*.d.cts`                          |

## 验证策略

迁移后需通过以下验证：

1. **`pnpm qa`** — typecheck + lint + 运行时测试 + 类型测试
2. **dist 结构对比** — 迁移前保存 dist 快照，与迁移后逐文件对比
3. **exports 验证** — 确保 `import`、`require`、`types` 路径全部正确解析
4. **UMD 验证** — 在浏览器环境测试 `<script>` 标签加载和 `window.utils` 全局变量
5. **tree-shaking 验证** — 用消费端项目验证按需导入的 bundle size

## Resolved Questions

- **UMD 是否保留？** — 必须保留
- **PowerShell 脚本是否迁移？** — 继续使用 PowerShell
- **类型声明方案？** — 使用 tsdown 内置 dts
- **`src/modules/config/rollup.ts` 怎么处理？** — 这是运行时公共 API（`vendorRollupOption`），与构建工具无关，不受迁移影响
