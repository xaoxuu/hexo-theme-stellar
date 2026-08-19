---
title: Collection Surface 交互统一执行计划
date: 2026-08-20
---

# 执行计划

1. [x] 收敛 surface hover/active 令牌，移除 grid/summary 静态背景。
2. [x] 移除 collection item 和 leading 图标的交互过渡。
3. [x] 移除 leading 图标灰阶滤镜，以 `var(--text-p2)` 统一未激活 SVG 颜色，外部图片保留原色。
4. [x] 未激活 `img` / `svg` 透明度设为 `0.5`，hover/active 恢复为 `1`。
5. [x] 同步主题知识库、核查登记与主工程 Wiki。
6. [x] 执行全量构建、知识库核查和静态回归。

## 风险与回退

- 移除静态背景后条目层次完全依赖交互态；如需回退，恢复变体背景变量与选择器即可。
- 动画为解决闪烁而暂时移除；后续若恢复，需避免直接过渡多层渐变背景。
- CSS `color` 仅影响使用 `currentColor` 的 SVG；外部图片取消滤镜后显示自身颜色，不尝试转为单色蒙版。
- 透明度直接作用于 `img` / `svg` 图标元素，不影响 leading 容器未来可能承载的其它内容。
