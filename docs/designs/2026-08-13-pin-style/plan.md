---
title: 置顶文章平铺样式执行计划
date: 2026-08-13
---

# 执行计划

## 实施步骤

1. [x] 主题 `_config.yml`：`article.pin_style: carousel` 默认值 + 注释
2. [x] `layout/_partial/main/navbar/nav_tabs_blog.ejs`：flat 时跳过 post 轮播
3. [x] `layout/index.ejs`：flat 模式置顶文章靠前展示 + 去重，carousel 模式保持现状
4. [x] 文档与知识库同步：`docs/designs/2026-08-13-pin-style/`、`configuration.md`、`VERIFICATION.md`
5. [ ] 验证：主工程 `npm run g`（默认 + 临时 flat）、知识库 `verify.py`
6. [ ] 清理：移除主工程临时 flat 配置

## 风险与回退

- 风险：flat 模式首页第一页置顶文章数量超过单页数量时，首页条数会略多于 `per_page`；与轮播展示全部置顶文章的现状一致，可接受。
- 回退：删除 `article.pin_style` 或改回 `carousel` 即恢复轮播现状；模板改动均为可逆小改动。
