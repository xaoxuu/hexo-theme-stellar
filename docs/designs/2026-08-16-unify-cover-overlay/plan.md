---
title: 统一背景图观感执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [ ] 新增 `source/css/_common/cover-overlay.styl` mixin（URL 变量 + 方向 + 图片选择器参数，统一变量与 hover/过渡规则）
2. [ ] `list.styl` poster 封面重构接入 mixin（视觉不变）
3. [ ] `pin-slider.styl` post 幻灯片参数对齐 + wiki 幻灯片接入 bottom 覆盖层
4. [ ] `article-banner.styl` 模糊层常驻 + hover 放大/变暗
5. [ ] `scripts/tags/lib/banner.js` 注入 `--bg-url` 与蒙版元素；`tag-plugins/banner.styl` 接入双侧覆盖层
6. [ ] 同步知识库（post-lists-cards / link-grid-banner-tags / logo-navigation-headers / 知识库全量）并登记 VERIFICATION.md
7. [ ] 主仓库 `docs/specs/unify-cover-overlay/` 方案归档 + `source/wiki/stellar/` 文档同步
8. [ ] 验证：`npm run g`、`npm run s` 页面检查、`verify.py`

## 风险与回退

- 双侧覆盖层（both）依赖 `.banner-mask-top/bottom` 蒙版元素：banner 标签需在 `banner.js` 补结构，若渲染回归可回退为该组件保留旧 hover 实现。
- Safari 圆角裁剪：mixin 保留 `translateZ(0)` / `clip-path` / `isolation` 兼容机制，若出现漏角按 `docs/designs/2026-08-16-fix-cover-corner-leak/` 的既有处理回退。
