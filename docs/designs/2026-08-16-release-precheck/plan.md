---
title: 发版前文档核对与规范补强 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 修正 `post-lists-cards.md` 的 3 处 Unsplash 残留
2. [x] `VERIFICATION.md`：补 3 行漏登记、更新头部 HEAD 锚点、新增「提交登记（发版前核对）」表
3. [x] 起草 `CHANGELOG.md` 1.42.0 章节
4. [x] 新增 `ci/check-release-docs.js` 并接入 `npm run check`
5. [x] 完善规范：`AGENTS.md`、双份 skill 镜像、`docs/guides/release-process.md`
6. [x] 创建本方案目录（spec / plan / checklist）
7. [x] 运行 `npm run check` 与单独检查，修复直至全绿，结果写入 `checklist.md`

## 风险与回退

- 提交清单数量以 git 实际输出为准（登记表共 22 行：19 个涉及主题行为的提交 + 3 个纯文档提交；早前口头估算 24 有误，已按命令输出登记；纯文档 / CI 提交由检查自动跳过）。
- `check-spec-refs` 对 `AGENTS.md` 与 skill 有章节引用/门禁措辞同步要求，改动后必须通过 `npm run check`。
- 检查脚本只要求登记短 SHA，不判断覆盖说明措辞；说明列由人工维护，发现漂移按 `VERIFICATION.md` 既有流程修正。
