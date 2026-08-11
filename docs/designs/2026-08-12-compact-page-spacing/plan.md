---
title: 压缩页面顶部与侧边栏间距 执行计划
date: 2026-08-12
---

# 执行计划

## 实施步骤

1. [x] 方案文档（本目录 `spec.md` / `plan.md` / `checklist.md`）
2. [x] `source/css/_defines/const.styl`：`$rightbar-bottom-margin` 96px→48px；`$leftbar-bottom-margin` 保持 32px 不变
3. [x] `source/css/_components/sidebar/sidebar.styl`：左右边栏上下 margin 与高度公式减半
4. [x] `source/css/_components/layout.styl`：吸顶 top、平板/移动浮动面板 top、max-height 公式
5. [x] `source/css/_components/main.styl`：`.l_main` 桌面 padding-top 减半
6. [x] `source/css/_components/partial/navbar.styl` 与 `_components/widgets/toc.styl`：navbar / TOC 吸顶 top 同步减半（移动端 navbar 对齐 8pt）
7. [x] `docs/knowledge/02-布局系统/sidebar-system.md` 与 `VERIFICATION.md` 同步
8. [x] 主工程 `npm run g` 全量构建验证 + 主题仓库 `npm run check`

## 风险与回退

- 风险：`pt` 单位在部分渲染环境按 96dpi 换算为 10.67px，若用户本意是 8px，仅需将 `8pt` 改为 `8px`（单行差异）。
- 回退：改动集中在 4 个 Stylus 文件，可整体 revert 后重新构建。
