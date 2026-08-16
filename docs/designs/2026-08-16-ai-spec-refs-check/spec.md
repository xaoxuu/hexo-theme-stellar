---
title: AI 规范引用一致性自动化检查
date: 2026-08-16
status: 已实施
---

# AI 规范引用一致性检查

## 1. 问题与目标

- 上一轮（2026-08-13）AI 规范优化后，手工审计不可持续：AGENTS.md §2 小部件路径过期（`layout/_partial/sidebar/`，实际为 `layout/_partial/widgets/`）、CONTRIBUTING.md 章节引用过期（§6 → §4）、skill §3 存在重复行；`check-skill-sync.js` 只保证 skill 双镜像一致，AGENTS.md ↔ skill ↔ CONTRIBUTING 之间没有机器防线。
- 成功标准：三处漂移已修正；新增 `ci/check-spec-refs.js` 校验章节引用、门禁措辞同步、路径存在性并接入 `npm test`；本地 `npm run check` 与 CI unit job 均强制执行。

## 2. 技术方案

- 文档修正：AGENTS.md §2 小部件路径、CONTRIBUTING.md §6→§4 与 CI 检查表补行、skill §3 删除重复行并同步 `.claude/` 镜像。
- 新增零依赖 Node 脚本 `ci/check-spec-refs.js`（风格同 `ci/check-skill-sync.js`）：
  1. `§N` 引用必须指向 AGENTS.md 中存在的章节号；
  2. 关键门禁短语（`npm run g`、`npm run check`、`docs/knowledge/tools/verify.py`、`不自动提交`、`docs/guides/tag-plugins-style-guide.md`）必须同时出现在 AGENTS.md 与 skill canonical；
  3. 反引号路径命中仓库根前缀时必须存在（占位符 / 通配符、主工程与 demo 路径除外）。
- 接入 `package.json` 的 `test` 脚本末尾，CI unit job 与本地 `npm run check` 都会运行。

## 3. 影响范围

- 涉及文件：`AGENTS.md`、`CONTRIBUTING.md`、`.agents/skills/stellar-theme-dev/SKILL.md`（+ `.claude/` 镜像）、`ci/check-spec-refs.js`（新增）、`package.json`、本方案目录。
- 对外行为 / 配置项：无（纯文档与 CI 检查）。
- 需同步的知识库页面：无（AGENTS.md 小部件路径与知识库已有事实对齐，知识库正文不改写）。

## 4. 验证方式

- `node ci/check-spec-refs.js` 通过；`node ci/check-skill-sync.js --check` 通过。
- `npm run check` 全绿（lint + 单测 + 新检查 + 知识库硬事实核查）。
- `rg` 抽查：AGENTS.md 无 `layout/_partial/sidebar` 残留；skill「无需自检流程」仅 1 处；CONTRIBUTING § 引用为 §4。
