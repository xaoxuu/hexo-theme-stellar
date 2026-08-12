---
title: 侧边栏底部间距改为仅手机端生效 执行计划
date: 2026-08-12
---

# 执行计划

## 实施步骤

1. [x] 方案文档（本目录 `spec.md` / `plan.md` / `checklist.md`）
2. [x] `source/css/_defines/const.styl`：两个常量重命名并改为 64px
3. [x] `source/css/_components/sidebar/sidebar.styl`：基础规则高度公式改为 `calc(100vh - var(--gap-margin) * 2)`
4. [x] `source/css/_components/layout.styl`：平板右栏 max-height 改为 `calc(100vh - var(--gap-margin) * 2)`；手机端左栏改用新变量、右栏新增显式 max-height
5. [x] `docs/knowledge/02-布局系统/sidebar-system.md` 与 `docs/knowledge/知识库全量.md` 同步
6. [x] `docs/knowledge/VERIFICATION.md` 登记变更
7. [x] 主题仓库 `npm run check` + 知识库 verify.py + 主工程 `npm run g` 验证

## 风险与回退

- 风险：`calc(100vh - var(--gap-margin) * 2)` 直接书写在 Stylus 中若被求值可能导致编译错误；若出现则以字符串插值形式改写（与现有 `'calc(%s - %s)'` 风格一致）。
- 回退：改动集中在 3 个 Stylus 文件与 3 个知识库文档，可整体 revert 后重新构建。
