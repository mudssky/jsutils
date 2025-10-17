## Brief overview

这是一套针对 @mudssky/jsutils 项目的开发规范和指导原则，适用于个人 JavaScript 工具库的开发和维护。

## 项目架构

- 采用模块化设计，每个功能模块独立在 `src/modules/` 目录下
- 类型定义统一在 `src/types/` 目录下管理
- 使用 TypeScript 严格模式开发，target 设为 ES2017
- 支持 ESM、CJS、UMD 三种输出格式
- 使用 Rollup 作为构建工具
- 项目结构：`src/index.ts` 为主入口，`src/modules/` 为功能模块，`src/types/` 为类型定义，`test/` 为测试文件

## 代码规范

### TypeScript 规范

- 严格模式：启用所有严格类型检查
- 导入路径：使用相对路径，避免深层嵌套，使用 `@/*` 路径别名
- 类型导出：所有公共类型必须导出
- TSDoc：所有公共API必须包含完整的TSDoc注释
- 函数和类必须包含完整的 TSDoc 文档注释
- 导出时使用命名导出，在 `index.ts` 中统一 re-export
- 优先使用函数式编程风格，避免副作用

### 代码格式化

- 使用 ESLint + TSDoc 插件进行代码检查，TSDoc 语法错误会显示警告
- 扩展：eslint:recommended, plugin:@typescript-eslint/recommended
- 插件：@typescript-eslint, tsdoc
- 使用 Prettier 进行代码格式化，配置了 organize-imports 插件

## 测试策略

- 使用 Vitest 作为测试框架，配置了类型检查
- 每个模块都需要对应的测试文件，放在 `test/` 目录下
- 测试文件命名遵循 `模块名.test.ts` 格式
- 类型测试使用 `.test-d.ts` 后缀
- 运行测试时自动进行类型检查
- 追求高覆盖率，核心和复杂逻辑必须100%覆盖
- 单元测试：每个工具函数都需要对应测试
- 类型测试：使用 `.test-d.ts` 验证类型正确性
- 测试命名：使用 `describe` 和 `it` 的 BDD 风格
- 边界测试：包含异常情况和边界值测试

## 开发工作流

### 正常开发流程

1. 开发功能，并编写 TSDoc 注释
2. tests 目录下编写测试
3. 确保所有测试通过：`pnpm test`
4. 确保所有 ci 检查通过 `pnpm ci:check`
5. 在 aidocs 文件夹更新文档，之后更新 `Readme.md`
6. 构建验证：`pnpm build`

### 优化代码相关需求开发流程

1. 分析需求：确定优化的目标和范围
2. 设计方案：根据需求设计优化方案，保存到 `todos` 目录下
3. 之后和正常开发的流程一样

### 日常开发

- 使用 pnpm 作为包管理器
- 开发时使用 `pnpm dev:watch` 进行监听构建
- 提交代码前必须运行 `pnpm ci:check`（包含类型检查、测试、lint修复）
- 使用 git-cz 进行规范化提交
- 遵循 Angular 提交规范（Conventional Commits）

## 文档要求

- 所有公开的 API 必须包含完整的 TSDoc 文档
- 使用 `@public` 标记公开的函数和类
- 提供使用示例（@example）
- 文档使用中文编写，与项目语言保持一致
- API 文档通过 api-extractor 自动生成
- 在 TSDoc 中明确标注可能抛出的错误

## 性能规范

### 性能目标和优化指导

- 优先支持 Tree Shaking，使用 ESM 格式导出
- 避免在模块顶层执行复杂计算
- 使用生成器函数处理大数据集（如 rangeIter）
- 考虑浏览器兼容性，UMD 版本使用 Babel 转译
- 优先使用原生 JavaScript API
- 避免不必要的循环和递归
- 使用适当的数据结构（Map vs Object, Set vs Array）
- 实现懒加载和按需导入

### 性能测试和优化

- 使用 benchmark 测试关键函数性能
- 缓存计算结果
- 避免重复计算

## 错误处理规范

### 统一的错误处理和日志记录标准

- **参数错误**：输入参数类型或值不正确
- **运行时错误**：执行过程中发生的异常
- **系统错误**：环境或依赖相关的错误

## 安全规范

### 代码安全最佳实践

- 避免危险函数：禁止使用 `eval()`、`Function()` 构造函数
- 避免使用 `innerHTML`，优先使用 `textContent` 或 `createElement`
- 谨慎使用 `document.write()`
- 输入验证：所有外部输入必须进行验证和清理
- 使用类型检查确保参数类型正确
- 对字符串输入进行长度限制和格式验证
- 依赖安全：避免引入不必要的第三方依赖
- 敏感信息处理：不在代码中硬编码敏感信息，避免在日志中输出敏感数据

## 依赖管理

- 最小化外部依赖，只引入必要的库
- 生产依赖仅包含 clsx 和 tailwind-merge
- 所有开发依赖都固定版本号
- 使用 sideEffects: false 标记无副作用的模块

## 发布流程

- 使用 semantic-release 自动化版本管理和发布
- 发布前自动运行完整构建和测试流程
- 生成 CHANGELOG 和 Git 标签
- 发布到 npm registry，包名为 @mudssky/jsutils
