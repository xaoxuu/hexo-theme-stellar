---
title: 置顶文章封面宽高比与非置顶文章统一 检查清单
date: 2026-08-12
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check` 通过
- [x] 主工程 `npm run g` 全量构建通过
- [x] 无头浏览器检查：幻灯片宽高比与非置顶文章一致（2:1）、封面铺满；标题 = poster.headline / title、小字 = poster.caption / description / excerpt 截断 50 字回退均正确；文字区模糊层 filter/mask、底部渐变与四周间距（padding 1rem）与 poster cover-info 实测一致（cover-info padding 已同步改为 1rem）；无封面卡片无模糊层、纯白底 + 普通文字颜色
- [x] 临时改 `article.cover_ratio` 验证列表卡片与轮播区整体生效后还原

## 文档同步

- [x] `docs/designs/2026-08-12-pin-slider-cover-ratio/` 方案文档已就位
- [x] `docs/knowledge/VERIFICATION.md` 已登记；`configuration.md`、`知识库全量.md` 已注明轮播区随 `article.cover_ratio`（无独立 ratio 配置）
- [x] `docs/knowledge/05-前端交互/client-side-overview.md` 已补充置顶卡片固定文字结构说明
- [x] 主工程 `source/wiki/stellar/advanced-settings.md` 已补充 `article.cover_ratio` 与置顶卡片「标题 + 一行小字」结构说明
