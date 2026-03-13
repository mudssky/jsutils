---
title: 'feat: 迁移构建系统从 Rollup 到 tsdown'
type: feat
status: completed
date: 2026-03-13
origin: docs/brainstorms/2026-03-13-migrate-to-tsdown-brainstorm.md
---

# feat: 迁移构建系统从 Rollup 到 tsdown

## Overview

将 `@mudssky/jsutils` 的构建工具从 Rollup v4（9 个插件、2 个配置文件）迁移到 **tsdown**（Rolldown 团队为库打包场景设计的高层构建工具），以提升构建速度、简化配置、减少插件依赖。

tsdown 基于 Rolldown（Rust）和 Oxc，内置 TypeScript 编译、类型声明生成、minify 等能力，可将 15 个构建相关依赖缩减为 1 个。

## Problem Statement / Motivation

**当前痛点：**

1. **插件膨胀** — 生产构建使用 9 个 Rollup 插件（typescript2, dts, babel, commonjs, node-resolve, terser, node-builtins, node-globals, esbuild），配置跨 2 个文件 (~150 行)
2. **构建速度** — Rollup (JS) 在模块数量增长后构建速度显著下降
3. **维护负担** — 插件版本升级频繁，兼容性问题不断
4. **工具碎片化** — 生产构建用 typescript2，开发构建用 esbuild，类型用 dts，三种不同编译方案

**迁移收益（see brainstorm: docs/brainstorms/2026-03-13-migrate-to-tsdown-brainstorm.md）：**

- 构建速度显著提升（Rust 级别）
- 15 个依赖 → 1 个依赖 (`tsdown`)
- 2 个配置文件 → 1 个 `tsdown.config.ts`
- 跟随 Vite/Rolldown 生态发展方向

## Proposed Solution

采用 **tsdown** 作为构建工具，分阶段迁移：

1. 先解决 `isolatedDeclarations` 源码兼容性（~56 处改动）
2. 安装 tsdown 并配置 ESM + CJS 输出
3. 配置 UMD 输出
4. 配置类型声明生成
5. 验证 dist 产物结构与 package.json exports 匹配
6. 清理旧依赖和配置

## Technical Approach

### Architecture

**迁移前后对比：**

```
迁移前:
  rollup.config.js (生产: ESM+CJS+UMD+dts, ~100行)
  rollup.config.dev.js (开发: ESM+dts, ~50行)
  9 个 Rollup 插件 + babel + esbuild

迁移后:
  tsdown.config.ts (所有格式, 预计 ~40行)
  tsdown 内置 TypeScript/minify/resolve
```

**tsdown 配置方向（see brainstorm 预期配置草图）：**

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
    dts: true,
    external: ['clsx', 'tailwind-merge'],
    target: 'es2017',
  },
  // CJS（unbundle 模式，.cjs 扩展名）
  {
    entry: ['src/index.ts'],
    format: 'cjs',
    outDir: 'dist/cjs',
    unbundle: true,
    dts: true,
    external: ['clsx', 'tailwind-merge'],
    target: 'es2017',
  },
  // UMD（单文件打包，minified，内联所有依赖）
  {
    entry: ['src/index.ts'],
    format: 'umd',
    outDir: 'dist/umd',
    globalName: 'utils',
    minify: true,
    target: 'es2017',
  },
])
```

> **注意：** 此配置为方向性参考。dts 输出路径、扩展名、路径别名解析等需在 Phase 2 通过 spike 测试确认。

### Implementation Phases

#### Phase 0: 基线快照 [预计 10 分钟]

**目标：** 建立对照基线，确保迁移后可精确对比。

- [ ] 在当前 Rollup 配置下执行 `pnpm build`，保存 dist/ 目录的文件树快照
- [ ] 记录关键文件路径（ESM 入口、CJS 入口、UMD 入口、类型声明入口）
- [ ] 运行 `pnpm release:check` 确认当前构建链完整通过

**产物：** `dist-baseline/` 快照（或 `tree dist/ > dist-baseline-tree.txt`）

#### Phase 1: isolatedDeclarations 源码改造 [预计 2-3 小时]

**目标：** 为所有导出函数/变量添加显式类型标注，使源码兼容 tsdown 的 dts 生成。

**前置验证：**

- [ ] 在 `tsconfig.json` 中添加 `"isolatedDeclarations": true`
- [ ] 运行 `pnpm typecheck`（即 `tsc --noEmit`），统计实际报错数量

**需修改的文件（按影响量排序）：**

| 文件                                | 预计改动 | 主要改动                                                                                 |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `src/modules/array.ts`              | ~12 处   | `range`, `rangeIter`, `createQuery`, Query 类方法, 箭头函数 const                        |
| `src/modules/storage.ts`            | ~11 处   | AbstractStorage/WebLocalStorage/WebSessionStorage 类方法                                 |
| `src/modules/fp.ts`                 | ~9 处    | `pipe`, `compose`, `curry`, `identity`, Monad 类方法                                     |
| `src/modules/object.ts`             | ~7 处    | `pick`, `pickBy`, `omit`, `omitBy`, `mapKeys`, `mapValues`, `removeNonSerializableProps` |
| `src/modules/enum.ts`               | ~5 处    | `createEnum`, EnumArray 类方法                                                           |
| `src/modules/string.ts`             | ~4 处    | `generateUUID`, `generateBase62Code`, `fuzzyMatch`, `getFileExt`                         |
| `src/modules/decorator.ts`          | ~4 处    | `debounceMethod`, `performanceMonitor`, `performanceBenchmark`, `performanceCompare`     |
| `src/modules/bytes.ts`              | ~4 处    | `bytes` 函数, Bytes 类方法                                                               |
| `src/modules/function.ts`           | ~3 处    | `debounce`, `throttle`, `createPolling`                                                  |
| `src/modules/regex/regexChecker.ts` | ~2 处    | `analyzePasswordStrength`, `calculatePasswordStrengthLevel`                              |
| `src/modules/env.ts`                | ~1 处    | `getEnvironmentInfo`                                                                     |
| `src/modules/logger.ts`             | ~1 处    | `createLogger`                                                                           |
| `src/modules/math.ts`               | ~1 处    | `randomInt`                                                                              |
| `src/modules/lang.ts`               | ~1 处    | `getTag`                                                                                 |
| `src/modules/proxy.ts`              | ~1 处    | `singletonProxy`                                                                         |
| `src/modules/style.ts`              | ~1 处    | `cn`                                                                                     |
| `src/modules/typed.ts`              | ~1 处    | `isEmpty`                                                                                |
| `src/modules/test.ts`               | ~1 处    | `tableTest`                                                                              |
| `src/modules/config/rollup.ts`      | ~1 处    | `vendorRollupOption` const                                                               |

**改动原则：**

- 优先使用精确的返回类型（如 `number[]`），避免 `any`
- 对于返回复杂对象字面量的函数（如 `debounce`, `createPolling`），抽取为 `interface` 或 `type`
- 每修改完一个文件运行 `pnpm test` 确保行为不变
- 改动完成后对比 rollup-plugin-dts 生成的 `.d.ts` 与手动标注是否一致

**验证：**

- [ ] `pnpm typecheck` 通过（含 `isolatedDeclarations`）
- [ ] `pnpm test` 全部通过
- [ ] `pnpm build` 成功（仍使用 Rollup，确认类型标注未破坏现有构建）

#### Phase 2: 安装 tsdown 并配置 ESM + CJS [预计 1-2 小时]

**目标：** 安装 tsdown，创建配置文件，实现 ESM + CJS 的正确输出。

- [ ] 运行 `pnpm add -D tsdown`
- [ ] 创建 `tsdown.config.ts`，先配置 ESM + CJS 双格式
- [ ] 配置 `unbundle: true`（等同 preserveModules）
- [ ] 配置 `external: ['clsx', 'tailwind-merge']`
- [ ] 配置 `target: 'es2017'`
- [ ] 显式禁用 sourcemap（与当前行为一致）

**关键验证点（GAP-01, GAP-02）：**

- [ ] **路径别名解析** — 源码中有 ~10 处使用 `@/types` 或 `@/modules/*` 路径别名。确认 tsdown 是否自动读取 tsconfig paths。如不支持：
  - 方案 A: 在 tsdown 配置中添加 `alias` / `resolve` 配置
  - 方案 B: 将所有 `@/` 别名替换为相对路径（约 10 处改动）
- [ ] **输出目录结构** — 对比 `dist/esm/` 和 `dist/cjs/` 下的文件树与基线快照
  - 确认无 `src/` 前缀（即 `dist/esm/modules/array.js` 而非 `dist/esm/src/modules/array.js`）
  - 确认 CJS 文件扩展名为 `.cjs`
  - 确认入口文件路径匹配 `package.json` 的 `exports` 字段

**临时构建脚本：**

```json
"build:tsdown": "tsdown",
"build:rollup": "rollup -c"
```

保留 `build:rollup` 用于对比和回滚。

#### Phase 3: 配置 UMD 输出 [预计 30 分钟 - 1 小时]

**目标：** 实现 UMD 单文件打包输出。

- [ ] 在 tsdown 配置中添加 UMD 配置块
- [ ] 配置 `globalName: 'utils'`
- [ ] 配置 `minify: true`
- [ ] 确认 UMD 构建**不设置 external**（内联 `clsx` 和 `tailwind-merge`）
- [ ] 对比 UMD 包大小（与 Rollup 基线差距应在 10% 以内）
- [ ] 验证 UMD 产物可在浏览器 `<script>` 标签中正确加载，`window.utils` 可用

**风险（GAP-05）：**

- 如果 tsdown UMD 输出缺少 Node.js globals/builtins polyfill，可能需要额外配置
- 当前 Rollup UMD 使用 `rollup-plugin-node-builtins` 和 `rollup-plugin-node-globals`，需确认 tsdown 如何处理

#### Phase 4: 配置类型声明生成 [预计 1 小时]

**目标：** 使用 tsdown 内置 dts 生成替代 rollup-plugin-dts。

- [ ] 配置 `dts: true`（或 `dts: { bundle: true }`），测试 ESM 类型声明输出
- [ ] 确认 `.d.ts` 文件输出路径匹配 `dist/types/index.d.ts`（或调整 exports）
- [ ] 确认 `.d.cts` 文件输出路径匹配 `dist/typescts/index.d.cts`（或调整 exports）

**路径策略决策（GAP-04）：**

| 策略     | 描述                                                        | 影响                                |
| -------- | ----------------------------------------------------------- | ----------------------------------- |
| **保守** | 通过 tsdown 配置精确匹配 `dist/types/` 和 `dist/typescts/`  | 无需改 package.json                 |
| **激进** | 使用 `fixedExtension: true` 输出 `.d.mts`/`.d.cts` 到同目录 | 需更新 exports + api-extractor.json |

- [ ] 选定路径策略后更新 `package.json` 的 `exports`、`typings` 字段（如需要）
- [ ] 更新 `api-extractor.json` 的 `mainEntryPointFilePath`（如路径变化）
- [ ] 对比新旧 `.d.ts` 文件的 diff，确认公共 API 签名无变化

#### Phase 5: 端到端验证 [预计 30 分钟]

**目标：** 全面验证迁移后的构建产物正确性。

**构建验证：**

- [ ] `pnpm qa` 通过（typecheck + lint + test + test:types）
- [ ] `pnpm build` 成功（使用 tsdown）
- [ ] `pnpm release:check` 通过（ci:strict + build + typedoc:gen）

**产物对比：**

- [ ] dist/ 文件树与基线快照对比，关键路径全部存在：
  - `dist/esm/index.js`
  - `dist/cjs/index.cjs`
  - `dist/umd/index.js`
  - `dist/types/index.d.ts`（或新路径）
  - `dist/typescts/index.d.cts`（或新路径）
  - `dist/style/scss/index.scss`

**消费者验证（TEST-GAP-01 补充）：**

- [ ] 在临时项目中 `import { range } from '@mudssky/jsutils'`（ESM），确认运行正常
- [ ] 在临时项目中 `const { range } = require('@mudssky/jsutils')`（CJS），确认运行正常
- [ ] 在浏览器中用 `<script src="dist/umd/index.js">` 加载，确认 `window.utils` 可用

**发布包检查：**

- [ ] `npm pack --dry-run` 检查发布包内容完整
- [ ] 确认 `sideEffects: false` 与 tsdown 输出兼容

#### Phase 6: 脚本更新与清理 [预计 30 分钟]

**目标：** 更新 package.json 脚本，清理旧配置和依赖。

**脚本更新：**

- [ ] `"build": "tsdown"`（替代 `rollup -c`）
- [ ] `"dev": "tsdown --watch"`（替代 `rollup -c rollup.config.dev.js`）
  - 或为开发模式创建精简配置（仅 ESM + dts，不含 UMD）
- [ ] `"dev:watch": "tsdown --watch"`（可能与 dev 合并）
- [ ] 移除 `build:rollup` 和 `build:tsdown` 临时脚本

**配置文件清理：**

- [ ] 删除 `rollup.config.js`
- [ ] 删除 `rollup.config.dev.js`
- [ ] 评估 `tsconfig.cts.json` 是否仍需要（tsdown 自动处理 CJS 类型），如不需要则删除

**依赖清理：**

移除以下 15 个 devDependencies：

```
@babel/core
@babel/preset-env
@rollup/plugin-babel
@rollup/plugin-commonjs
@rollup/plugin-node-resolve
@rollup/plugin-terser
@rollup/plugin-typescript
esbuild
rollup
rollup-plugin-dts
rollup-plugin-esbuild
rollup-plugin-node-builtins
rollup-plugin-node-globals
rollup-plugin-typescript2
tslib
```

- [ ] 运行 `pnpm remove` 批量移除上述依赖
- [ ] 运行 `pnpm install` 确认 lockfile 正确更新
- [ ] 再次运行 `pnpm release:check` 确认清理后仍可正常工作

## Alternative Approaches Considered

（see brainstorm: docs/brainstorms/2026-03-13-migrate-to-tsdown-brainstorm.md — Phase 2: Explore Approaches）

| 方案                   | 描述                               | 为何放弃                             |
| ---------------------- | ---------------------------------- | ------------------------------------ |
| 直接使用 Rolldown      | Rollup 的 Rust 重写，API 更低层    | 需要手写多入口配置，不如 tsdown 简洁 |
| Rolldown + tsdown 混合 | ESM/CJS 用 tsdown，UMD 用 Rolldown | 两套配置维护成本高                   |
| 保持 Rollup            | 不迁移                             | 无法解决插件膨胀和速度问题           |

## System-Wide Impact

### Interaction Graph

```
pnpm build
  → prebuild (PowerShell: clean:dist → copy:style)
    → tsdown (替代 rollup -c)
      → dist/esm/ (ESM, unbundle)
      → dist/cjs/ (CJS, unbundle)
      → dist/umd/ (UMD, minified)
      → dist/types/ (.d.ts)
      → dist/typescts/ (.d.cts)  [或新路径]
    → [dist/style/ 已由 copy:style 复制]

pnpm release:check
  → pnpm qa (typecheck + lint + test + test:types)
  → pnpm build (上述流程)
  → pnpm typedoc:gen (读取 src/, 不依赖 dist/)

CI release.yml
  → pnpm release:check
  → semantic-release → npm publish (dist/ + package.json)

api-extractor
  → 读取 dist/types/index.d.ts (路径依赖)
```

### Error & Failure Propagation

- **tsdown 构建失败** → `pnpm build` 失败 → `release:check` 中断 → CI 不发布
- **isolatedDeclarations 报错** → `pnpm typecheck` 失败 → `pnpm qa` 中断
- **路径别名未解析** → dist/ 中包含 `@/` import → 消费者运行时 `MODULE_NOT_FOUND`
- **dts 路径不匹配** → api-extractor 找不到入口 → `docs:extract` 失败

### State Lifecycle Risks

- **prebuild 时序** — `copy:style` 在 build 前执行。tsdown 的 `clean` 选项**必须禁用**，否则会清除已复制的样式文件
- **dist/ 残留** — 如果 tsdown 输出路径与 Rollup 不完全相同，dist/ 中可能残留旧文件。`prebuild: clean:dist` 已经处理了这个问题

### API Surface Parity

- **package.json exports** — `./dist/esm/index.js`, `./dist/cjs/index.cjs`, `./dist/types/index.d.ts`, `./dist/typescts/index.d.cts` 必须精确匹配
- **package.json main/module/typings** — 同上
- **api-extractor.json mainEntryPointFilePath** — `<projectFolder>/dist/types/index.d.ts`
- **`src/modules/config/rollup.ts`** — 这是公共 API（`vendorRollupOption`），不是构建配置，**不应修改或删除**

### Integration Test Scenarios

1. **ESM 消费** — `import { range } from '@mudssky/jsutils'` 在 Node.js ESM 项目中正常工作
2. **CJS 消费** — `require('@mudssky/jsutils')` 在 Node.js CJS 项目中正常工作
3. **UMD 浏览器加载** — `<script src="dist/umd/index.js">` 后 `window.utils.range` 可用
4. **Tree-shaking** — 消费端仅 `import { range }` 时，其他模块不被打包
5. **TypeScript 类型** — 消费端 IDE 能正确获得类型提示和自动补全

## Acceptance Criteria

### Functional Requirements

- [ ] ESM 输出：`dist/esm/` 目录下，unbundle 模式，文件结构与基线一致
- [ ] CJS 输出：`dist/cjs/` 目录下，`.cjs` 扩展名，unbundle 模式
- [ ] UMD 输出：`dist/umd/index.js`，全局变量 `utils`，minified
- [ ] 类型声明：`.d.ts` 和 `.d.cts` 正确生成，路径与 `exports` 匹配
- [ ] 外部依赖：ESM/CJS 排除 `clsx` + `tailwind-merge`；UMD 内联
- [ ] 样式资源：`dist/style/` 仍然正确复制
- [ ] 所有 `@/` 路径别名在产物中正确解析为相对路径

### Non-Functional Requirements

- [ ] 构建速度不慢于当前 Rollup 构建（预期显著提升）
- [ ] UMD 包大小与 Rollup 基线差距在 10% 以内
- [ ] source map 行为与当前一致（生产不生成，开发可选生成）

### Quality Gates

- [ ] `pnpm qa` 通过
- [ ] `pnpm release:check` 通过
- [ ] `npm pack --dry-run` 内容完整
- [ ] 迁移前后 `.d.ts` 公共 API 签名无变化

## Success Metrics

- **依赖数量**: 15 个构建相关依赖 → 1 个 (`tsdown`)
- **配置文件**: 2 个 Rollup 配置 → 1 个 tsdown 配置
- **构建时间**: 预期减少 50%+（需实际测量）
- **CI 流程**: 无中断，所有 workflow 正常通过

## Dependencies & Prerequisites

- **TypeScript 5.5+** — `isolatedDeclarations` 需要。当前 `^5.9.3`，满足要求
- **tsdown 稳定版** — 需确认当前可用版本和稳定性
- **GitHub Actions ubuntu-latest** — 已预装 `pwsh`，PowerShell 脚本可正常运行

## Risk Analysis & Mitigation

| #   | 风险                                              | 严重度   | 概率 | 缓解措施                                           |
| --- | ------------------------------------------------- | -------- | ---- | -------------------------------------------------- |
| R1  | `isolatedDeclarations` 改动破坏公共 API 类型签名  | Critical | 低   | 逐文件修改 + 每步测试 + 前后 .d.ts diff 对比       |
| R2  | `@/` 路径别名在产物中未解析                       | Critical | 中   | 优先在 tsdown 配置中解决；备选方案：替换为相对路径 |
| R3  | tsdown unbundle 输出结构与 preserveModules 不一致 | Critical | 中   | 构建后对比文件树；必要时调整 outDir/outExtensions  |
| R4  | tsdown UMD 缺少 node builtins/globals polyfill    | High     | 中   | 测试 UMD 产物；必要时使用 rolldown 插件补充        |
| R5  | dts 无法同时输出 .d.ts 和 .d.cts 到不同目录       | High     | 中   | 可能需要两次构建或后处理脚本；或简化路径结构       |
| R6  | tsdown beta 阶段可能有 edge case                  | Medium   | 中   | 保留旧配置到验证完成；全面 QA 测试                 |
| R7  | tsdown `clean` 与 `copy:style` 时序冲突           | Medium   | 低   | 显式禁用 tsdown clean，继续用 PowerShell           |
| R8  | source map 默认行为差异                           | Low      | 低   | 显式配置 `sourcemap: false`                        |

## Rollback Strategy

1. **分支隔离** — 在功能分支上进行全部迁移，不直接修改 main
2. **并行构建期** — 迁移初期保留 `build:rollup` 和 `build:tsdown` 两个脚本
3. **旧配置保留** — `rollup.config.js` 和 `rollup.config.dev.js` 在最终清理前保留
4. **npm 版本策略** — 迁移后先发布 patch/minor 版本（非 major），降低影响
5. **紧急回滚** — 如果已发布的版本有严重问题，恢复 Rollup 配置并发布修复版本

## Documentation Plan

- [ ] 更新 `AGENTS.md` 中 build 命令说明（如有变化）
- [ ] brainstorm 文档状态更新为"已实施"

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-13-migrate-to-tsdown-brainstorm.md](docs/brainstorms/2026-03-13-migrate-to-tsdown-brainstorm.md)
  - Key decisions: tsdown 作为构建工具、保留 UMD 格式、PowerShell 脚本不变、使用内置 dts

### Internal References

- 构建配置: `rollup.config.js`, `rollup.config.dev.js`
- 包配置: `package.json` (exports, scripts, devDependencies)
- TypeScript 配置: `tsconfig.json`, `tsconfig.cts.json`
- API Extractor: `api-extractor.json` (mainEntryPointFilePath → dist/types/index.d.ts)
- CI 发布: `.github/workflows/release.yml`
- prebuild 脚本: `scripts.ps1`
- 公共 API 入口: `src/index.ts`
- 公共 Rollup 配置工具（不修改）: `src/modules/config/rollup.ts`

### External References

- tsdown 文档: https://tsdown.dev/
- Rolldown 文档: https://rolldown.rs/
- TypeScript isolatedDeclarations: https://www.typescriptlang.org/tsconfig/#isolatedDeclarations
