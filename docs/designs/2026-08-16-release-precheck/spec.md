---
title: 发版前文档核对与规范补强
date: 2026-08-16
status: 已实施
---

# 发版前文档核对与规范补强 方案

## 1. 问题与目标

- 发版前需要核对自上一 tag（1.41.0，`8e90803`）以来的 PR / 提交与文档覆盖情况，确保设计文档、知识库、`VERIFICATION.md`、CHANGELOG 无缺失或错位。
- 成功标准：`npm run check` 全绿；本周期涉及主题代码/配置/行为变化的非合并提交在 `VERIFICATION.md` 提交登记表登记（纯文档 / CI / 工具改动自动跳过）；已确认的文档缺口修正完毕；发版前漏登记的问题有门禁兜底。

## 2. 技术方案

- 提交清单以 `git log --format=%h %s --no-merges 1.41.0..HEAD` 实际输出为准（本周期 22 个），对照面为 `docs/designs/`、`docs/knowledge/`、`VERIFICATION.md`、`CHANGELOG.md`。
- 文档修正：`03-内容系统/post-lists-cards.md` 清除 auto_banner/auto_cover 移除后的 Unsplash 残留；`VERIFICATION.md` 补 3 行漏登记（#688、#689、`a198243`）、更新头部 HEAD 锚点、新增「提交登记（发版前核对）」表。
- 规范补强：新增零依赖脚本 `ci/check-release-docs.js` 并接入 `npm run check`（`release.js` 的 `runPreflightCheck` 已执行 `npm run check`，发版自动被门禁；不放入 `npm test`，避免 CI PR 负担）；同步 `AGENTS.md`、双份 skill 镜像、`docs/guides/release-process.md`。

## 3. 影响范围

- 涉及文件：`docs/knowledge/03-内容系统/post-lists-cards.md`、`docs/knowledge/VERIFICATION.md`、`CHANGELOG.md`、`package.json`、`ci/check-release-docs.js`（新增）、`AGENTS.md`、`.agents` / `.claude` skill 镜像、`docs/guides/release-process.md`、本方案目录。
- 对外行为：`npm run check` 新增提交登记完整性检查；发版前涉及主题代码/配置/行为变化的非合并提交须在 `VERIFICATION.md` 登记短 SHA（纯文档 / CI / 工具改动无需登记）。
- 无主题代码、配置项、文案行为变化；#688 / #689 按决定不补设计目录，仅登记。

## 4. 验证方式

- `npm run check` 全绿（lint + 单测 + 依赖声明 + check-spec-refs + 知识库硬事实核查 + 提交登记完整性）。
- 单独运行 `node ci/check-release-docs.js` 通过；`python3 docs/knowledge/tools/verify.py` 无新增阻断项。
