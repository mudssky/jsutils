# 项目目录结构

> `@mudssky/jsutils` — TypeScript 工具库的代码组织方式。

---

## 目录布局

```
src/
├── index.ts                  # 主入口（barrel re-export）
├── modules/                  # 所有运行时模块
│   ├── array.ts              # 单文件模块（大多数）
│   ├── string.ts
│   ├── math.ts
│   ├── object.ts
│   ├── function.ts
│   ├── lang.ts
│   ├── error.ts
│   ├── enum.ts               # 大型单文件模块（~1100 行）
│   ├── dom/                  # 多文件模块（复杂领域）
│   │   ├── index.ts          # barrel 导出
│   │   ├── domHelper.ts
│   │   ├── debugger/
│   │   │   ├── index.ts
│   │   │   ├── core.ts
│   │   │   └── type.ts
│   │   └── highlighter/
│   │       ├── index.ts
│   │       └── type.ts
│   ├── storage/
│   │   ├── index.ts
│   │   ├── base.ts
│   │   ├── types.ts
│   │   └── adapters/
│   ├── stateMachine/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── ...
│   └── ...
├── types/                    # 纯类型模块（无运行时代码）
│   ├── index.ts              # 类型 barrel
│   ├── array.ts
│   ├── function.ts
│   ├── utils.ts
│   └── ...
└── style/                    # SCSS 样式（非 TS）
    └── scss/

test/                         # 测试目录（独立于 src）
├── array.test.ts             # 单元测试
├── dom/
│   ├── domHelper.test.ts     # 子目录测试镜像模块结构
│   └── debugger.test.ts
├── stateMachine/
│   └── createMachine.test.ts
└── types/                    # 类型级测试
    ├── array.test-d.ts
    └── utils.test-d.ts
```

---

## 模块组织规则

### 何时用单文件模块

简单工具函数集合（array、string、math、object 等）放在 `src/modules/` 下的单个 `.ts` 文件中。

**条件**：模块 < 500 行，职责单一，无子模块依赖。

### 何时用目录模块

复杂领域模块放在 `src/modules/<name>/` 下，满足以下任一条件：
- 超过 500 行
- 有多个子文件（adapters、子模块）
- 有独立的类型定义文件

### 目录模块结构

```
src/modules/<name>/
├── index.ts          # barrel 导出（必须）
├── types.ts          # 或 type.ts — 类型定义
├── core.ts           # 核心逻辑（可选，分离实现和导出）
└── adapters/         # 适配器模式（如 storage 的 taro、uni、web）
```

---

## 文件命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 单文件模块 | 小写无分隔符 | `array.ts`, `string.ts`, `math.ts` |
| 多词文件 | camelCase | `domHelper.ts` |
| 目录名 | camelCase 或 kebab-case | `stateMachine/`, `storage-extras/` |
| barrel | `index.ts` | 每个目录模块必须有 |
| 类型文件 | `types.ts` 或 `type.ts` | 两种都有使用 |
| 测试文件 | `<module>.test.ts` | `array.test.ts` |
| 类型测试 | `<module>.test-d.ts` | `array.test-d.ts` |

---

## 参考示例

| 模式 | 文件 |
|------|------|
| 单文件模块 | `src/modules/array.ts`, `src/modules/string.ts` |
| 目录模块 | `src/modules/storage/`, `src/modules/dom/debugger/` |
| 纯类型模块 | `src/types/utils.ts`, `src/types/function.ts` |
| 大型单文件 | `src/modules/enum.ts`（~1100 行，EnumArray 类） |
