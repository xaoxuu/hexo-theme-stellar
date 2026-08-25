---
title: 可选配色选择器与 Dropdown Action 执行计划
date: 2026-08-25
---

# 执行计划

## 实施步骤

1. [x] 扩展 Color Scheme Feature 与 Footer Action/Dropdown Schema、迁移目录和示例配置。
2. [x] 接入按需 Runtime Extension，删除 `theme.js`、旧内联文案与 `utils.dark`。
3. [x] 扩展 Dropdown link/button 渲染与关闭行为，迁移 Voice 配色监听和清理。
4. [x] 补充单测、知识库、Reference、配置审计与性能基线。
5. [x] 运行主题检查、候选包集成和主工程构建。

## 风险与回退

- `onclick` 是站点所有者的受信任代码，只做 HTML 属性转义；严格 CSP 禁止 inline handler 时由站点改用自定义脚本监听。
- 配色 Extension 加载前示例使用 `window.setColorScheme?.(...)`，避免早期点击抛错。
- 现有 `data-theme` 契约不改名，避免扩大到 CSS/DOM 全量迁移。
