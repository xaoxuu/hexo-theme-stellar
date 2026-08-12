---
title: 置顶文章封面宽高比与非置顶文章统一 执行计划
date: 2026-08-12
---

# 执行计划

## 实施步骤

1. [x] `_config.yml`：`pin_slider` 补充注释，明确轮播区比例统一由 `article.cover_ratio` 控制（不维护独立 ratio 配置）。
2. [x] `layout/_partial/main/pin_slider.ejs`：`postSlide()` 输出固定「标题 + 一行小字」结构（不再调用 `post_card`），标题/小字按优先级取值。
3. [x] `source/css/_components/pin-slider.styl`：幻灯片读取 `article.cover_ratio`；新增 `.pin-slide-text` 文字区样式（对齐 poster cover-info）+ 渐变模糊层；移除列表卡片复用样式。
4. [x] `docs/designs/2026-08-12-pin-slider-cover-ratio/` 方案文档就位。
5. [x] `docs/knowledge/`（configuration、知识库全量、VERIFICATION、client-side-overview）与主工程 `source/wiki/stellar/advanced-settings.md` 同步。
6. [x] 验证：`npm run check`、主工程 `npm run g`、无头浏览器检查 + 临时改 `article.cover_ratio` 验证单一入口。

## 风险与回退

- 置顶文章从列表卡片复用改为固定文字结构，观感变化较大：如不满意可回退；
- 小字缺失时回退到 excerpt 截断 50 字，可能与文章首段不一致（截断所致）；
- 轮播区比例随 `article.cover_ratio` 变化，属既有配置语义，无兼容性问题。
