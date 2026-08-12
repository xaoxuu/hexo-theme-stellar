---
title: AI 规范优化（stellar 主题仓库 + xaoxuu.com 主工程）
date: 2026-08-13
status: 已通过
---

# AI 规范优化方案

## 1. 问题与目标

- 要解决的问题：
  - stellar 仓库 `AGENTS.md` 409 行，始终加载的上下文过重；架构总览（§8）与知识库 `overview.md` 高度重复、发版规范（§10）与 `docs/guides/release-process.md` 双份维护、工作流程与 skill 重复
  - `CLAUDE.md` 在 `@AGENTS.md` 导入后仍复述大量要点，形成缓存式重复
  - 主工程 `AGENTS.md` 同样存在 §5/§9 规则重复、目录树等可自行发现的内容
  - 代理（端口 7890）等本地环境内容混入仓库文档
- 成功标准：两份 `AGENTS.md` 均降至约 200 行；两份 `CLAUDE.md` 精简为路由指针（≤10 行）；同一规则只在一处维护；架构与发版细节由知识库与 `release-process.md` 担任单一事实来源；仓库文档中无代理相关描述。

## 2. 技术方案

- 实现思路（遵循 `writing-for-agents` 原则）：
  - 单一事实来源：架构细节指向 `docs/knowledge/00-总览与安装配置/overview.md`，发版细节指向 `docs/guides/release-process.md`，删除 AGENTS.md 内的复述
  - 流程归 skill：Codex/Claude 按 `$stellar-theme-dev` 完整清单执行，AGENTS.md 只留硬性门禁（方案 / 验证 / 提交 / 文档同步）
  - CLAUDE.md 退化为 `@AGENTS.md` 导入 + 环境差异说明
  - 主工程保持 §1-§9 编号不变，内容去重压缩；删除 §7.4「网络与代理」
  - skill 章节引用与验证门禁措辞与 AGENTS.md 对齐；两个镜像逐字一致
- 涉及文件：
  - stellar：`AGENTS.md`、`CLAUDE.md`、`.agents/skills/stellar-theme-dev/SKILL.md`（+ `.claude/` 镜像）
  - 主工程：`AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`、`.agents/skills/stellar-theme-main/SKILL.md`（+ `.claude/` 镜像）
- 不改动：知识库正文、`docs/designs/_template/`、`docs/guides/release-process.md`、主题代码（`layout/`、`scripts/`、`source/`、`languages/`）

## 3. 影响范围

- 对外行为 / 配置项 / 兼容性影响：无（纯文档规范变更）
- 需要同步的知识库页面：正文无需更新（`overview.md` 已覆盖原 §8 内容）
- 入口同步：两份 `CLAUDE.md` 精简、两份 skill 对齐；`.github/copilot-instructions.md` 保持纯入口（主工程删除代理行）

## 4. 验证方式

- `node ci/check-skill-sync.js --check`（stellar skill 镜像一致）
- `npm run check`（lint + 单测 + 知识库硬事实核查）
- 行数目标：两份 `AGENTS.md` ≤ 210，两份 `CLAUDE.md` ≤ 10
- `rg` 审计：章节引用有效、代理残留为 0、关键短语单一来源
