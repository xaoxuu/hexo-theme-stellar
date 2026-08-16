---
title: AI 规范引用一致性检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] `node ci/check-spec-refs.js` 通过
- [x] `node ci/check-skill-sync.js --check` 通过
- [x] `npm run check` 全绿（lint + 单测 + 新检查 + 知识库硬事实核查）
- [x] `rg "layout/_partial/sidebar" AGENTS.md` 无命中
- [x] skill「无需自检流程」仅 1 处
- [x] CONTRIBUTING § 引用指向 §4
- [x] `git status` 确认改动范围

## 文档同步

- [x] 本方案目录已归档（spec / plan / checklist）
- [x] `docs/knowledge/` 正文（不适用：无主题行为变更）
- [x] `docs/knowledge/VERIFICATION.md`（不适用：AGENTS.md 修正与知识库已有事实对齐，无偏差登记）
