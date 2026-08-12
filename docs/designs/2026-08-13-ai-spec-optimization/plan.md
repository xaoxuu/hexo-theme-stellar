---
title: AI 规范优化执行计划
date: 2026-08-13
---

# 执行计划

## 实施步骤

1. [x] 重写 stellar `AGENTS.md`（409 → 207 行，10 节：职责边界 / 技术定位 / 知识库与归档 / 编码规范 / 工作流程门禁 / 架构指针 / Git / 发版门禁 / 约束 / Issue）
2. [x] 精简 stellar `CLAUDE.md`（22 → 7 行，路由指针）
3. [x] 对齐 stellar `stellar-theme-dev` skill（§6/§7/§8 引用、验证门禁措辞）并同步 `.claude/` 镜像
4. [x] 重写主工程 `AGENTS.md`（256 → 198 行，§1-§9 编号不变，删除 §7.4 代理）
5. [x] 精简主工程 `CLAUDE.md`（37 → 7 行，删除代理命令块）
6. [x] 主工程 `copilot-instructions.md` 删除代理行
7. [x] 主工程 `stellar-theme-main` skill 移除对 stellar `CLAUDE.md` 的引用，两份镜像手动同步
8. [x] 运行验证：skill 镜像检查、`npm run check`、行数与引用 / 代理审计
9. [x] 本方案文档改写并归档为本次改动记录（原 `2026-08-13-ai-architecture-overview/` 内容已被本次优化取代，改写为 `2026-08-13-ai-spec-optimization/`）

## 风险与回退

- 章节重排导致引用失效：全部引用已用 `rg "§[0-9]"` 复核
- 镜像不同步：stellar 由 `ci/check-skill-sync.js` 强制；主工程两份镜像手动 diff 确认
- 代理内容误留：`rg "7890|http.proxy|socks"` 扫描为 0（知识库 `api_host` 功能描述除外，属主题功能保留）
