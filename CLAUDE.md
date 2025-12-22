# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@mudssky/jsutils`, a TypeScript utility library published as an npm package. The library provides comprehensive utility functions organized into modules, similar to lodash, but with full TypeScript support and modern JavaScript features.

## Key Development Commands

### Development Workflow

- `pnpm dev` - Development build with watch mode
- `pnpm build` - Production build (ESM, CJS, UMD, and type declarations)

### Code Quality & Testing

- `pnpm test` - Run all tests with type checking
- `pnpm typecheck` - TypeScript type checking
- `pnpm lint` - ESLint code checking
- `pnpm lint:fix` - Auto-fix ESLint issues

### CI/Quality Gates

- `pnpm qa` - Quick QA check (typecheck + lint:fix + test:silent)

### Single Test Execution

Use Vitest's filtering: `pnpm test --grep "test name"`

### Documentation

- `pnpm docs:dev` - Start documentation server
- `pnpm docs:build` - Build documentation
- `pnpm docs:extract` - Extract API documentation

## Architecture Overview

### Module Structure

The library follows a modular architecture where each utility category is its own module:

- **Core Modules** (`src/modules/`): Individual utility categories (array, string, object, etc.)
- **DOM Module** (`src/modules/dom/`): Browser-specific utilities with sub-modules
- **Types** (`src/types/`): Centralized TypeScript type definitions
- **Config** (`src/modules/config/`): Build and configuration utilities

### Build System Architecture

The project uses Rollup with multiple output formats:

- **ESM modules** (`dist/esm/`): Tree-shakable modules with `preserveModules: true`
- **CommonJS** (`dist/cjs/`): Node.js-compatible modules with `.cjs` extension
- **UMD** (`dist/umd/index.js`): Browser-compatible bundle with Babel transpilation
- **Type declarations**: Separate ESM (`dist/types/`) and CJS (`dist/typescts/`) formats

### Import Path Strategy

- Internal imports use `@/` alias mapped to `src/`
- Package exports configured for dual ESM/CJS support
- Path aliases in `tsconfig.json` and `vitest.config.ts` for consistent resolution

### Testing Architecture

- **Unit tests**: Located in `test/` directory matching source structure
- **Type tests**: `.test-d.ts` files for TypeScript type validation
- **Performance tests**: Dedicated performance benchmarking
- **Test environment**: Vitest with happy-dom for DOM utilities

### Code Organization Patterns

- Each module exports both functions and types
- TSDoc documentation required for all public APIs
- Centralized error handling with custom error types
- Functional programming style with immutable operations

## Development Guidelines

### Module Development

- Add new utilities to appropriate module files in `src/modules/`
- Export new functions from `src/index.ts`
- Include comprehensive TSDoc documentation
- Write corresponding tests in `test/` directory
- Add type tests for complex types in `test/types/`

### Type Safety

- Strict TypeScript mode enabled
- All public APIs must have explicit type definitions
- Use utility types from `src/types/` for common patterns
- Type exports separated from function exports

### Testing Requirements

- All utilities require comprehensive unit tests
- Include edge cases and error conditions
- Performance tests for computationally expensive functions
- Type tests to verify TypeScript definitions

### Build Considerations

- ESM modules preserve individual files for optimal tree-shaking
- UMD build includes Babel transpilation for browser compatibility
- External dependencies (clsx, tailwind-merge) not bundled
- Style files copied to dist for CSS utilities
