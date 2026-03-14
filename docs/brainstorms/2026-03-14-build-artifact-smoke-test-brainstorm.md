---
title: 构建产物 Smoke Test
date: 2026-03-14
tags:
  - testing
  - build-artifacts
  - smoke-test
  - esm
  - cjs
  - umd
  - ci
---

# 构建产物 Smoke Test

## 背景

在完成 Rollup → tsdown 迁移后，项目的 672 个运行时测试全部通过 Vitest alias 直接引用 `src/index.ts` 源码，而非 `dist/` 构建产物。这意味着构建产物（ESM / CJS / UMD）的可用性缺乏自动化验证，理论上存在"测试通过但产物不可用"的风险。

之前的质量门禁设计中，smoke test 方案曾被否决（认为"太重"），但在构建工具迁移后，补充一个轻量级验证是合理的。

## 我们要做什么

### 目标

在 `ci:strict` 门禁中添加一个轻量级的构建产物 smoke test，验证：

1. **ESM 导入正确性** — `dist/esm/index.js` 可以通过动态 `import()` 加载，核心导出存在且可调用
2. **CJS 导入正确性** — `dist/cjs/index.cjs` 可以通过 `createRequire` 加载，核心导出存在且可调用
3. **UMD 可加载性** — `dist/umd/index.umd.js` 可以通过 `createRequire` 加载，导出对象不为空
4. **类型声明文件存在** — `dist/esm/index.d.ts` 和 `dist/cjs/index.d.cts` 存在且非空
5. **package.json exports 指向有效路径** — 所有 exports 条目指向的文件实际存在

### 不做什么

- **不做** 完整 API 表面测试（每个导出函数逐一验证）
- **不做** 浏览器环境 UMD 测试（happy-dom 模拟）
- **不做** 类型声明内容正确性验证（tsc 编译检查）
- **不做** 产物体积回归检测

## 为什么选这个方案

### 选择理由

- **独立 Node.js 脚本**（非 Vitest 测试文件）：真实模拟消费端行为，不受 Vitest 转换管线影响
- **单个 .mjs 文件**：使用 `createRequire` 统一处理 CJS/UMD，零额外依赖，维护成本最低
- **轻量 smoke test**：挑选 5~10 个核心导出做存在性和基本调用验证，不做深度功能测试（功能正确性已由 672 个单测覆盖）
- **集成到 ci:strict**：不影响日常 `pnpm qa` 速度，但在 PR 合并前和发布前都会验证

### 放弃的方案

- Vitest 测试文件方案：受框架转换影响，不够"真实"
- 分文件方案（esm.mjs + cjs.cjs）：维护两个文件，同步更新成本高
- 每次提交执行（qa 集成）：需要先 build，拖慢日常开发循环

## 关键决策

| 决策     | 结论                   | 理由                               |
| -------- | ---------------------- | ---------------------------------- |
| 实现方式 | 独立 Node.js .mjs 脚本 | 真实模拟消费端，零依赖             |
| 文件数量 | 单文件                 | 用 createRequire 统一 CJS/UMD      |
| 测试深度 | 轻量 smoke test        | YAGNI，功能正确性由单测覆盖        |
| 运行时机 | ci:strict 中执行       | 平衡安全性和开发速度               |
| UMD 测试 | Node.js require        | 满足基本可加载验证，不做浏览器模拟 |

## 实现细节

### 文件位置

`scripts/smoke-test.mjs` — 放在 scripts/ 目录下，与现有的 `scripts.ps1` 保持一致。

### 集成方式

当前 `ci:strict` 的定义是 `pnpm qa && pnpm test:coverage`，不含 build。
`release:check` 的定义是 `pnpm ci:strict && pnpm build && pnpm typedoc:gen`。

建议调整为：

```
pnpm ci:strict（修改后）
  └── pnpm qa（不变：typecheck + lint + test + type-test）
  └── pnpm test:coverage（不变）
  └── pnpm build（新增）
  └── pnpm test:smoke（新增：node scripts/smoke-test.mjs）
```

这样 `release:check` 可以简化为 `pnpm ci:strict && pnpm typedoc:gen`（因为 build 已在 ci:strict 中）。

### 核心导出候选

从 `src/index.ts` 挑选覆盖不同模块的代表性导出，建议 5~8 个：

- `clamp`（math 模块，纯函数）
- `sleep`（function 模块，Promise 返回值）
- `deepClone`（object 模块，复杂逻辑）
- `isString`（typed 模块，类型守卫）
- `chunk`（array 模块，数组操作）
- `cn`（依赖 clsx + tailwind-merge 的包装函数，验证外部依赖未被错误内联/外部化）

验证方式：检查 `typeof export === 'function'`，并对简单函数做一次基本调用断言。

## 核心验证项

| 格式    | 验证方式                                 | 检查内容                 |
| ------- | ---------------------------------------- | ------------------------ |
| ESM     | `import('dist/esm/index.js')`            | 模块可加载、核心导出存在 |
| CJS     | `createRequire()(dist/cjs/index.cjs)`    | 模块可加载、核心导出存在 |
| UMD     | `createRequire()(dist/umd/index.umd.js)` | 模块可加载、导出非空     |
| .d.ts   | `fs.statSync`                            | 文件存在且非空           |
| exports | `JSON.parse(package.json).exports`       | 所有路径指向存在的文件   |

## 成功标准

- `pnpm test:smoke` 在构建后 < 3 秒内完成
- 覆盖 ESM / CJS / UMD 三种格式的基本可加载性
- 验证 package.json exports 路径有效性
- 不引入新的 devDependencies
