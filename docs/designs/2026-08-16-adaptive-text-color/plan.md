---
title: 文字自适应颜色通用能力执行计划
date: 2026-08-16
---

# 执行计划

1. `source/js/color.js`：颜色解析、WCAG 亮度、HSL 明度调整、`adaptiveTextColor`（contrast/theme，默认阈值 0.6 偏向浅色文字）、`getAverageColor`（canvas 平均色 + 缓存）。
2. `source/js/plugins/adaptive-text.js`：`[data-text-adaptive]` 扫描、背景来源解析、`split`（大字 contrast + 小字 theme）写入 `--text-banner` / `--text-banner-theme`、用户覆盖跳过。
3. `layout/_plugins/adaptive_text.ejs` + `_config.yml`：`plugins.adaptive_text.enable: true`，按需懒加载。
4. 模板接入：`post_card.ejs`、`latest_post_card.ejs`、`pin_slider.ejs`、`article_banner.ejs`、`banner.js` 加 `data-text-adaptive="split"`。
5. 样式：`list.styl` / `article-banner.styl` / `bread-nav.styl` / `tag-plugins/banner.styl` 小字改 `var(--text-banner-theme, …)`，大字沿用 `var(--text-banner)`。
6. 单测 `test/color.test.js` 并跑 `npm run check`。
7. 知识库同步 + `VERIFICATION.md` 登记 + 合并版 `知识库全量.md` 同步。
8. 主工程 `docs/specs/adaptive-text-color/` 方案与 Wiki 同步；`npm run g` 全量构建验证。
