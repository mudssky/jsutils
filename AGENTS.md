# Repository Guidelines

- 默认用简体中文回复（除非我明确要求英文/其他语言）。
- 代码/命令/报错信息保留原样，不要翻译代码块内容。
- 需要查官方文档或库用法时，使用 `context7` tools。
- 写代码时，请用中文写注释。重点解释复杂的业务逻辑和设计意图，不要解释显而易见的语法，所有函数都需要包含标准的参数和返回值说明

任务开发完成后，如果代码有改动必须执行 `pnpm qa`，确保通过

<!-- TRELLIS:START -->

# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:

- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->
