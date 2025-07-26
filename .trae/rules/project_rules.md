# jsutils 项目规范

## 代码风格规范

### TypeScript 规范

- 严格模式：启用所有严格类型检查
- 导入路径：使用相对路径，避免深层嵌套
- 类型导出：所有公共类型必须导出
- TSDoc：所有公共API必须包含完整的TSDoc注释

### 代码格式化

项目使用以下工具进行代码格式化和检查：

1. **Prettier**
2. **ESLint**
   - 扩展：eslint:recommended, plugin:@typescript-eslint/recommended
   - 插件：@typescript-eslint, tsdoc

## 性能规范

### 性能基准和优化指导

1. **性能目标**
   - 内存使用：避免内存泄漏和不必要的内存占用

2. **代码优化原则**
   - 优先使用原生 JavaScript API
   - 避免不必要的循环和递归
   - 使用适当的数据结构（Map vs Object, Set vs Array）
   - 实现懒加载和按需导入

3. **性能测试**
   - 使用 benchmark 测试关键函数性能

4. **优化策略**
   - 缓存计算结果
   - 避免重复计算

## 错误处理规范

### 统一的错误处理和日志记录标准

1. **错误分类**
   - **参数错误**：输入参数类型或值不正确
   - **运行时错误**：执行过程中发生的异常
   - **系统错误**：环境或依赖相关的错误

2. **错误文档**
   - 在 TSDoc 中明确标注可能抛出的错误

## 提交规范

项目使用 Angular 提交规范

## 开发指南

### 开发流程

1. 开发功能，并编写tsdoc注释
2. tests目录下编写测试
3. 确保所有测试通过：`pnpm test`
4. 确保所有ci检查通过 `pnpm ci:check`
5. 在docs文件夹更新文档，之后更新`Readme.md`
6. 构建验证：`pnpm build`

### 优化代码相关需求开发流程

1. 分析需求：确定优化的目标和范围
2. 设计方案：根据需求设计优化方案，保存到`todos` 目录下
3. 之后和正常开发的流程一样

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
│   │   ├── helper.ts # DOM操作助手函数
│   │   └── highlighter.ts # 文本高亮器
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

### 测试规范

使用vitest进行单元测试

- 测试文件位于 `test/` 目录下
- 运行 `pnpm test` 执行测试
- 追求高覆盖率，核心和复杂逻辑必须100%覆盖
- 单元测试：每个工具函数都需要对应测试
- 类型测试：使用 `.test-d.ts` 验证类型正确性
- 测试命名：使用 `describe` 和 `it` 的 BDD 风格
- 边界测试：包含异常情况和边界值测试

## 安全规范

### 代码安全最佳实践

1. **避免危险函数**
   - 禁止使用 `eval()`、`Function()` 构造函数
   - 避免使用 `innerHTML`，优先使用 `textContent` 或 `createElement`
   - 谨慎使用 `document.write()`
2. **输入验证**
   - 所有外部输入必须进行验证和清理
   - 使用类型检查确保参数类型正确
   - 对字符串输入进行长度限制和格式验证
3. **依赖安全**
   - 避免引入不必要的第三方依赖
4. **敏感信息处理**
   - 不在代码中硬编码敏感信息
   - 避免在日志中输出敏感数据
