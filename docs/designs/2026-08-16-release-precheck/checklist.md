---
title: 发版前文档核对与规范补强 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 核对矩阵

覆盖矩阵以 `docs/knowledge/VERIFICATION.md`「八、提交登记（发版前核对）」表为准（本周期 22 个非合并提交；2 个 merge 提交 `71a0880` / `a174f93` 由脚本跳过），本目录不复制矩阵本体。

## 验证

- [x] `npm run lint` 通过（含新脚本 `ci/check-release-docs.js`）
- [x] `npm test` 通过（check-require-decls + node:test + check-spec-refs）
- [x] `node ci/check-skill-sync.js --check` 通过（.agents / .claude 镜像一致）
- [x] `node ci/check-release-docs.js` 通过（自 1.41.0 以来 22 个非合并提交全部登记）
- [x] `python3 docs/knowledge/tools/verify.py` 通过（`post-lists-cards.md` 无新增硬事实告警；既有未解析文件/配置键告警为非阻断噪音）
- [x] `npm run check` 全绿（2026-08-16 验证）

## 文档同步

- [x] `docs/knowledge/03-内容系统/post-lists-cards.md` 已修正 Unsplash 残留
- [x] `docs/knowledge/VERIFICATION.md` 已登记（3 行补登 + 提交登记表 + 头部锚点）
- [x] `CHANGELOG.md` 1.42.0 章节已起草
- [x] 规范文档已同步（AGENTS.md / skill 镜像 / release-process.md）
- [x] `languages/` 无需改动
