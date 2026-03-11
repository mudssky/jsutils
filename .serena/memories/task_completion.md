# 完成任务前的校验

- 默认至少运行 `pnpm qa`。
- 若改动涉及 CI、coverage、发布链路或跨模块质量门禁，还要运行 `pnpm ci:strict`，必要时运行 `pnpm release:check`。
- 在声称完成之前，必须基于最新命令输出确认结果。
