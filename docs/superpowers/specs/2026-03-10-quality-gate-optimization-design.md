# 质量闭环优化设计

**日期：** 2026-03-10  
**状态：** 已确认  
**主题：** 在保持 `pnpm qa` 快速反馈的前提下，为当前仓库建立严格质量闭环

---

## 背景

当前仓库已经具备基础质量门禁，但闭环仍有三个明显缺口：

1. `pnpm qa` 使用 `test:silent`，没有显式覆盖 `test/types/*.test-d.ts` 这类类型断言测试。
2. PR 工作流实际只跑到 `qa`，没有把 coverage 与阈值校验纳入主门禁。
3. release 与 pages 流程各自可运行，但与“发布前必须经过完整质量验证”的关系还不够清晰。

同时，用户已明确两项约束：

- 质量闭环优先。
- `pnpm qa` 必须保持较快，不接受把所有重检查都塞进日常开发回路。

---

## 目标

1. 建立开发、PR、发布三层清晰的质量门禁。
2. 把运行时测试、类型断言测试、coverage 校验纳入统一流程。
3. 保持 `pnpm qa` 为高频可执行的快路径。
4. 让 release 在真正发布前完成严格校验，而不是边发布边发现问题。

## 非目标

1. 本轮不做大规模架构重构。
2. 本轮不把所有低覆盖模块一次性补到理想值。
3. 本轮不引入过重的矩阵 CI、产物兼容矩阵或额外平台测试。

---

## 方案对比

### 方案 1：轻分层

- `qa` 保持快速，只补类型测试。
- PR 额外跑 coverage。
- release 直接复用 PR 结果。

优点是改动最小。缺点是发布前缺少独立校验层，`build/docs` 这类问题可能拖到最后才暴露。

### 方案 2：标准分层（采用）

- `qa`：开发快反馈。
- `ci:strict`：PR 严格门禁。
- `release:check`：发布前专用校验。

优点是速度与严格性平衡最好，职责最清晰，也最符合本次约束。

### 方案 3：重度分层

- 在方案 2 基础上，再加 Node 版本矩阵、打包产物 smoke test、导出路径兼容性检查。

优点是信心最高，缺点是对当前仓库过重，CI 成本和维护噪音都偏高。

---

## 最终设计

### 1. 三层质量门禁

#### `pnpm qa`

定位：开发中与提交前的快路径。

应包含：

- `pnpm typecheck`
- `pnpm lint:fix`
- `pnpm test:silent`
- `pnpm test:types`

不包含：

- coverage 生成与阈值校验
- `build`
- 文档构建

设计原则是“开发必需最小全集”，保证开发者愿意高频执行。

#### `pnpm ci:strict`

定位：PR 与主分支严格门禁。

应包含：

- `pnpm qa`
- `pnpm test:coverage`
- coverage threshold 校验

这样 PR 可以覆盖五类信号：格式/Lint、TypeScript、运行时测试、类型断言测试、覆盖率退化。

#### `pnpm release:check`

定位：发布前校验。

应包含：

- `pnpm ci:strict`
- `pnpm build`
- 文档链路校验

文档链路优先建议使用与最终发布目标一致的命令。如果 Pages 继续部署 Typedoc 产物，则应优先验证 Typedoc 相关生成链路；如果未来改为 VitePress 站点，则切换为 `docs:build`。

---

### 2. 脚本设计

建议新增或调整以下脚本：

- `test:types`
  - 使用 Vitest 的 typecheck 模式，专门执行 `test/types/**/*.test-d.ts`。
- `ci:strict`
  - 组合执行 `qa + coverage threshold`
- `release:check`
  - 组合执行 `ci:strict + build + docs`

保留现有 `test:silent` 作为 runtime 快路径，不把 coverage 混入其中。

---

### 3. Vitest 配置策略

#### 类型测试

使用 Vitest 官方 typecheck 能力，并通过 `typecheck.include` 明确只匹配 `test/types/**/*.test-d.ts`，避免与 `tsc --noEmit` 重复覆盖整仓源码检查。

#### Coverage 统计口径

coverage 需要先“去噪”再设阈值。应排除：

- `src/types/**`
- 纯 barrel 文件，如 `src/modules/dom/index.ts`、`src/modules/regex/index.ts`
- 纯配置/样式导出或非核心运行时代码
- `src/**/*.html`

目标是让 coverage 数字只反映真正需要维护的运行时代码，而不是被类型文件和汇总文件污染。

---

### 4. Coverage 阈值策略

当前实时基线约为：

- Statements: `90.4%`
- Branches: `83.94%`
- Functions: `88.88%`
- Lines: `90.65%`

第一阶段阈值建议：

- `statements: 90`
- `lines: 90`
- `functions: 88`
- `branches: 83`

这些阈值的目标不是追求理想值，而是先防止质量继续后退。等 `storage.ts`、`env.ts` 等低覆盖模块补测后，再逐步抬升。

---

### 5. CI / Release 职责划分

#### PR Workflow

从当前的 `pnpm ci:check` 切换到 `pnpm ci:strict`，使 PR 真正成为严格门禁。

#### Release Workflow

在 `semantic-release` 前增加 `pnpm release:check`，确保发布动作之前已经通过严格验证。

#### Pages Workflow

保留页面部署职责，但 workflow 名称、步骤名和构建命令应能明确表达当前发布的是 Typedoc 产物，而不是泛化的“网站”。

---

## 风险与控制

### 风险 1：`qa` 变慢导致开发者规避执行

控制方式：不把 coverage、build、docs 放进 `qa`。

### 风险 2：coverage 阈值一步设太高，CI 变成噪音源

控制方式：先清理统计口径，再按当前基线设初始阈值。

### 风险 3：例外文件长期豁免，形成新技术债

控制方式：所有豁免都需要显式记录在配置或文档中，并在后续测试补齐后回收。

### 风险 4：发布链路与页面链路职责重叠

控制方式：在 workflow 与脚本命名上明确“PR 校验”“发布前校验”“文档部署”三种责任边界。

---

## 成功标准

满足以下条件即可视为本轮设计达成：

1. `pnpm qa` 保持快速，且显式覆盖类型断言测试。
2. PR 默认执行 `pnpm ci:strict`。
3. release 在发布前执行 `pnpm release:check`。
4. coverage 报告对运行时代码有更高信噪比，并具备基础阈值防回退能力。
5. 相关命令职责清晰，开发者能分辨何时跑 `qa`、何时跑 `ci:strict`、何时跑 `release:check`。
