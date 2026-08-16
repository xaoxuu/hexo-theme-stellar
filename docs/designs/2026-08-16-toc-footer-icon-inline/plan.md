---
title: TOC 底部按钮图标内联修复 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 方案文档（`docs/designs/2026-08-16-toc-footer-icon-inline/`）
2. [x] `layout/_partial/widgets/toc.ejs`：upup/tocomment 改 `inline=true`
3. [x] `source/css/_components/widgets/toc.styl`：footer svg/img 拆分 + `flex-shrink:0` 守卫
4. [x] 文档同步（`docs/knowledge/performance.md`、`icon-tag.md`、`VERIFICATION.md`、主仓库 `express.md`）
5. [x] 主题 `npm run check` 验证
6. [x] 主工程 `npm run g` 全量构建 + 产物断言
7. [x] 无头 Chrome 布局对照验证

## 风险与回退

- 内联使含 TOC 页 HTML 增加约 4KB（两个按钮图标），可接受；如后续需要可改用单文件 SVG 引用。
- 守卫 CSS 仅影响 `.widget-footer` 内的 svg/img，无全局副作用。
