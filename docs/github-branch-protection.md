# GitHub 分支保护配置

## 当前方案：Repository Rulesets

本项目 main 分支使用 **Repository Rulesets**（而非经典 Branch Protection）进行保护。

### 配置路径

Settings → Rules → Rulesets

### 规则内容

| 规则                                  | 说明                        |
| ------------------------------------- | --------------------------- |
| Require a pull request before merging | 所有变更必须通过 PR         |
| Require status checks to pass         | PR 必须通过 `pr-check` 检查 |

### Bypass 配置

Bypass list 中添加了 **Repository owner**（`mudssky`），使得：

- **CI/CD 自动化**：semantic-release 的 `sync-release-artifacts` workflow 使用 PAT（`DEPENDABOT_TOKEN`）认证，代表 owner 身份绕过保护规则，可直接 push main
- **日常开发**：其他开发者仍需通过 PR 提交变更

### CI Workflow 认证

`release-sync.yml` 中的 checkout 步骤使用 PAT 而非默认 `GITHUB_TOKEN`：

```yaml
- uses: actions/checkout@v6
  with:
    token: ${{ secrets.DEPENDABOT_TOKEN }}
```

原因：`GITHUB_TOKEN` 无法绕过分支保护规则，PAT 代表 owner 身份可触发 bypass。

### Secret 配置

`DEPENDABOT_TOKEN` 需要在仓库 Settings → Secrets and variables → Actions 中配置，使用 Fine-grained Personal Access Token，权限为 Contents: write。

### 常见问题

**Q: 为什么不用经典 Branch Protection？**

经典 Branch Protection 没有 bypass list 功能，无法让特定 actor（如 CI bot）绕过保护。迁移到 Rulesets 后可以精确控制谁可以绕过规则。

**Q: push 被拦截报 `GH006: Protected branch update failed`？**

检查：

1. Ruleset 的 bypass list 是否包含你的用户名
2. Workflow 的 checkout 是否使用了 PAT（而非默认 token）
3. PAT 是否有 `Contents: write` 权限且未过期
