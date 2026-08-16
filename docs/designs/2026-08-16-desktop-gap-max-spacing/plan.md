---
title: 桌面侧边栏与内容区上下间距恢复为 var(--gap-max) 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 方案文档（本目录 `spec.md` / `plan.md` / `checklist.md`）
2. [x] `source/css/_components/sidebar/sidebar.styl`：左栏 margin（四周 gap-max）、右栏 margin、header margin、高度公式
3. [x] `source/css/_components/layout.styl`：吸顶 top 与 max-height 公式（桌面 + 平板）
4. [x] `source/css/_components/main.styl`：`.l_main` 桌面 padding-top
5. [x] `source/css/_components/partial/navbar.styl` 与 `_components/widgets/toc.styl`：navbar / TOC 吸顶 top 同步
6. [x] `docs/knowledge/02-布局系统/sidebar-system.md`、`05-前端交互/client-side-overview.md` 与 `VERIFICATION.md` 同步
7. [x] 主题仓库 `npm run check` + 主工程 `npm run g` 验证

## 风险与回退

- 风险：间距增大后若漏改某处 `top` / 高度公式会导致吸顶错位或视口内溢出；按本计划成对修改。
- 回退：改动集中在 5 个 Stylus 文件与知识库文档，可整体 revert 后重新构建。
