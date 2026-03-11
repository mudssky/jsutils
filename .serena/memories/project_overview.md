# jsutils 项目概览

- 项目：`@mudssky/jsutils`
- 目的：个人通用 JS/TS 工具库，产出 ESM/CJS/类型声明，文档站使用 VitePress。
- 技术栈：TypeScript ESM、Vitest、ESLint、Biome、Rollup、Typedoc、pnpm。
- 主要结构：`src/modules/*` 为运行时工具，`src/types/*` 为类型工具，`src/index.ts` 为公开 barrel；`test/*.test.ts` 与 `test/dom/*.test.ts` 为运行时测试，`test/types/*.test-d.ts` 为类型测试；文档/示例位于 `examples/`、`aidocs/`、`vitedocs/`、`docs/`。
- 当前系统：Windows + PowerShell。
