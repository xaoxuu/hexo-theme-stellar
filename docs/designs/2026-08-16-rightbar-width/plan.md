---
title: 右边栏加宽 32px 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 方案文档（本目录 `spec.md` / `plan.md` / `checklist.md`）
2. [x] `source/css/_custom.styl`：新增 `--rightbar-width-extra`
3. [x] `source/css/_components/layout.styl`：`.l_body .l_right` 宽度覆盖
4. [x] 知识库同步：sidebar-system / responsive-design / design-tokens / VERIFICATION + CHANGELOG
5. [x] 主题仓库 `npm run check` + 主工程 `npm run g`
6. [x] CDP 布局实测（1000–2048px）：右栏 320px、左栏 288px、无横向溢出

## 风险与回退

- 风险：右栏加宽挤压内容列约 32px；实测各断点无横向溢出。
- 回退：删除 `.l_body .l_right` 的宽度覆盖与 `--rightbar-width-extra` 即可恢复。
