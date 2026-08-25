---
title: 侧边栏圆角层曲率对齐方案
date: 2026-08-25
status: 已实施
---

# 侧边栏圆角层曲率对齐方案

## 1. 问题与目标

Glass 侧栏移除背景图后，`.sidebg` 以 `var(--card)` 绘制连续曲率背景，`.leftbar-container:after` 继续绘制遮罩。全局 `*` 规则不会匹配伪元素，导致底层为 `superellipse(1.25)`、覆盖层仍为普通 `round`，暗色模式的四个角会露出较亮底色。

目标是让侧栏背景、容器和两个覆盖层共享同一曲率，消除四角亮沿，同时保持现有圆角半径、遮罩、模糊和透明度不变。

## 2. 技术方案

- 复用 `.leftbar-container` 已有的 `appearance.shape.corner` 计算结果，不新增令牌或配置。
- 在 `:before/:after` 共用规则中声明 `corner-shape: inherit`，让伪元素随容器曲率变化。
- 通过真实 `hexo-renderer-stylus` 编译无背景图的 glass 配置，断言最终 CSS 显式包含伪元素曲率继承。

## 3. 影响范围

- 影响桌面与移动端的 glass 侧栏伪元素；card surface 仍隐藏这些覆盖层。
- 有背景图时的顶部高光、内阴影和遮罩几何同步对齐；无背景图时不再出现圆角亮沿。
- 不改变公开配置接口，不调整 `appearance.backgrounds.sidebar.backdrop.overlay`。
- 同步 `docs/knowledge/02-布局系统/sidebar-system.md`、`docs/knowledge/VERIFICATION.md` 与公开 Wiki 的连续曲率说明。

## 4. 验证方式

- 定向回归测试先失败后通过。
- 主题 `npm run check` 与知识库硬事实核查通过。
- 主工程 `npm run g` 通过。
- Chrome 桌面端验证浅色/暗色 × 有图/无图四种组合。
