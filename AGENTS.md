# Repository Guidelines

- 默认用简体中文回复（除非我明确要求英文/其他语言）。
- 代码/命令/报错信息保留原样，不要翻译代码块内容。
- 需要查官方文档或库用法时，使用 `context7` tools。
- 写代码时，请用中文写注释。重点解释复杂的业务逻辑和设计意图，不要解释显而易见的语法，所有函数都需要包含标准的参数和返回值说明

任务开发完成后，必须执行pnpm qa (format,lint,typecheck,test)，确保通过

## Project Structure & Module Organization

`src/index.ts` is the public barrel; only export new utilities there after the
API is stable. Runtime helpers live in `src/modules/*`, grouped by domain such
as `array.ts`, `math.ts`, `dom/`, and `regex/`. Type utilities live in
`src/types/*` and are re-exported with `export type *`.

Runtime tests live in `test/*.test.ts`, DOM-specific coverage lives in
`test/dom/*.test.ts`, and type assertions live in `test/types/*.test-d.ts`.
Keep examples and docs in sync with code changes under `examples/`, `aidocs/`,
and `vitedocs/`.

## Build, Test, and Development Commands

Use `pnpm` for all local work.

- `pnpm build` builds `dist/` with Rollup after cleaning artifacts and copying
  styles.
- `pnpm dev` builds the development bundle once; `pnpm dev:watch` rebuilds on
  file changes.
- `pnpm test` runs Vitest in run mode with type-aware checks.
- `pnpm test:silent` is the fast dot-reporter variant used by `pnpm qa`.
- `pnpm typecheck`, `pnpm lint`, and `pnpm biome:check` validate TypeScript,
  ESLint, and formatting rules.
- `pnpm qa` is the pre-PR gate: typecheck, lint fix, and silent tests.
- `pnpm docs:dev` starts the local VitePress site.

## Coding Style & Naming Conventions

This repository uses TypeScript ESM. Follow the existing formatter settings: 2
spaces, single quotes, no semicolons, trailing commas, LF line endings, and an
80-column target. Keep files focused and named like existing modules:
`storage.ts`, `domHelper.ts`, `regexChecker.ts`.

Prefer named exports and update the nearest barrel file when adding public API.
ESLint warns on `console` usage in source and test files, and TSDoc syntax is
checked for `src/**/*.ts`; document public functions when behavior is not
obvious.

## Testing Guidelines

Mirror source names in tests, for example `src/modules/math.ts` ->
`test/math.test.ts`. Put type-only expectations in `test/types/*.test-d.ts`.
Use the configured aliases `@mudssky/jsutils` and `@/` inside tests. Run
`pnpm test:coverage` when touching multiple modules or cross-cutting behavior.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commits such as `chore:`, `build:`, and
`docs:`. Keep messages short and imperative, or use `pnpm commit` to go through
Commitizen and commitlint.

PRs should include a concise summary, linked issue when available, affected
modules, and the verification command you ran, usually `pnpm qa`. Add
screenshots only when changing DOM helpers, examples, or VitePress pages.
