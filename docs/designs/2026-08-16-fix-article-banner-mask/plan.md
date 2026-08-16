---
title: 修复页面顶部横幅黑色蒙版执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] `layout/_partial/main/navbar/article_banner.ejs`：蒙版类名改为 `banner-mask banner-mask-top` / `banner-mask banner-mask-bottom`。
2. [x] `source/css/_components/partial/article-banner.styl`：`.banner-mask` 常显（`opacity: 1`）、移除 `trans1 all`，变体选择器改名，渐变不变。
3. [x] 同步主题知识库：`content-overview.md` 补充页面横幅黑色蒙版说明，`VERIFICATION.md` 登记。

## 风险与回退

- 类名改名的风险极低：`banner-mask-top` / `banner-mask-bottom` 全仓库无冲突；若未来出现撞名，可在 CSS 中为 `.banner-mask` 显式重置 margin/padding 兜底。
- 蒙版常显若导致观感过重：回退方案为降低渐变系数（当前边缘 0.5），不改动结构。
