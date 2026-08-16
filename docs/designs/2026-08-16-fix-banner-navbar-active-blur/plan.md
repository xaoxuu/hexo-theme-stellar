---
title: 修复 banner 内导航激活项玻璃模糊执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] `source/css/_components/tag-plugins/banner.styl`：`.tag-plugin.banner .navbar a.active` 移除 `blur-effect()`，改为半透明白底并保留 hover 卡片色。
2. [x] 同步主题知识库：`link-grid-banner-tags.md` 补充说明，`VERIFICATION.md` 登记。

## 风险与回退

- 激活项失去玻璃模糊后观感变化：已与用户确认接受，回退方案为恢复 `blur-effect()` 或改结构（把 navbar 移出裁剪容器）保留模糊。
- 影响面极小：仅 `.tag-plugin.banner .navbar a.active` 一处样式；`blur-effect()` 其他使用处不受影响。
