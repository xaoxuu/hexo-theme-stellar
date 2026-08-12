# CLAUDE.md — Claude Code 项目指南

@AGENTS.md

> 本仓库的完整 AI 工程规范见 [AGENTS.md](AGENTS.md)，已通过 `@AGENTS.md` 导入；以下仅说明 Claude Code 环境差异，冲突以 AGENTS.md 为准。

- 主题开发、验证或发版：先调用 `stellar-theme-dev` skill（Claude 侧镜像位于 `.claude/skills/stellar-theme-dev/`，与 `.agents/skills/` canonical 逐字一致；修改 canonical 后运行 `node ci/check-skill-sync.js` 同步）
