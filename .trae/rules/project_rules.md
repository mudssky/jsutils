# jsutils 项目规范

## 项目简介

`@mudssky/jsutils` 是一个个人通用JavaScript工具库，采用TypeScript编写，提供了多种常用的工具函数。该库打包为ESM、CJS和UMD三种格式，并包含完整的类型声明，特别适合在TypeScript项目中使用。

## 代码风格规范

### TypeScript 配置

- 目标版本：ES2017
- 模块系统：ES2022
- 模块解析策略：Bundler

### 代码格式化

项目使用以下工具进行代码格式化和检查：

1. **Prettier**

   - 不使用分号 (semi: false)
   - 使用单引号 (singleQuote: true)
   - 使用插件：
     - prettier-plugin-organize-imports
     - prettier-plugin-packagejson

2. **ESLint**
   - 扩展：eslint:recommended, plugin:@typescript-eslint/recommended
   - 插件：@typescript-eslint, tsdoc

## 提交规范

### Commit 规范

项目使用 Angular 提交规范，通过 commitlint 进行检查。提交信息格式为：

```
{type}{scope}: {emoji}{subject}
```

#### 提交类型

- **feat**: 新功能 🎸
- **fix**: 修复bug 🐛
- **docs**: 文档更改 ✏️
- **style**: 代码风格更改（不影响代码运行的变动） 💄
- **refactor**: 代码重构（既不是新增功能，也不是修复bug的代码变动） 🔨
- **perf**: 性能优化 ⚡️
- **test**: 测试相关 💍
- **chore**: 构建过程或辅助工具的变动 🤖
- **ci**: CI相关变动 🎡

### 版本发布

项目使用 semantic-release 进行版本管理和发布，配置如下：

- 发布分支：main
- 插件：
  - @semantic-release/commit-analyzer
  - @semantic-release/release-notes-generator
  - @semantic-release/changelog
  - @semantic-release/npm
  - @semantic-release/github
  - @semantic-release/git

## 开发指南

### 项目结构

```
src/
├── index.ts          # 主入口文件
├── modules/          # 功能模块
│   ├── array.ts      # 数组相关工具函数
│   ├── async.ts      # 异步相关工具函数
│   ├── bytes.ts      # 字节处理工具函数
│   ├── config/       # 配置相关模块
│   ├── decorator.ts  # 装饰器相关工具函数
│   ├── dom.ts        # DOM操作工具函数
│   ├── enum.ts       # 枚举相关工具函数
│   ├── error.ts      # 错误处理工具函数
│   ├── fp.ts         # 函数式编程工具函数
│   ├── function.ts   # 函数相关工具函数
│   ├── lang.ts       # 语言相关工具函数
│   ├── logger.ts     # 日志工具函数
│   ├── math.ts       # 数学相关工具函数
│   ├── object.ts     # 对象操作工具函数
│   ├── proxy.ts      # 代理相关工具函数
│   ├── regex.ts      # 正则表达式工具函数
│   ├── storage.ts    # 存储相关工具函数
│   ├── string.ts     # 字符串操作工具函数
│   ├── style.ts      # 样式相关工具函数
│   ├── test.ts       # 测试相关工具函数
│   └── typed.ts      # 类型相关工具函数
├── style/            # 样式相关
│   └── scss/         # SCSS样式文件
└── types/            # 类型定义
    ├── array.ts      # 数组类型定义
    ├── class.ts      # 类类型定义
    ├── function.ts   # 函数类型定义
    ├── global.ts     # 全局类型定义
    ├── index.ts      # 类型入口文件
    ├── math.ts       # 数学类型定义
    ├── object.ts     # 对象类型定义
    ├── promise.ts    # Promise类型定义
    ├── string.ts     # 字符串类型定义
    ├── union.ts      # 联合类型定义
    └── utils.ts      # 工具类型定义
```

### 开发流程

1. 使用 `pnpm` 作为包管理工具
2. 开发前运行 `pnpm install` 安装依赖
3. 使用 `pnpm build` 构建项目

### 测试

使用vitest进行单元测试

- 测试文件位于 `test/` 目录下
- 运行 `pnpm test` 执行测试
- 类型测试文件使用 `.test-d.ts` 后缀

## 文档

- 项目文档使用 VitePress 生成，位于 `vitedocs/` 目录
- API文档自动从代码注释生成
