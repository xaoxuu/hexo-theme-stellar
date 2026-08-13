---
title: 置顶文章平铺样式检查清单
date: 2026-08-13
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 默认（carousel）全量构建通过，首页轮播正常（含全部 3 篇置顶）、列表不重复置顶
- [x] 临时 `article.pin_style: flat` 后 `npm run g`：首页/分类/标签/归档均无文章轮播；wiki 列表无置顶项目故不渲染（`nav_tabs_wiki` 机制未改动）
- [x] flat 下首页第一页顶部顺序：20260226(pin:10) > 20250602(pin:4) > 20250713(pin:0)，其后为常规文章，每篇仅出现一次
- [x] 分类（产研/技术）列表正常渲染、无轮播；首页第二页无轮播且列表无置顶文章（仅侧栏最近文章小部件出现）
- [x] 边界：置顶判定与权重与 `pin_slider.ejs` 完全一致（`true`=1、0/负数参与、非数字=0、权重相同保持原顺序）；`indexing: false` 过滤保留
- [x] `python3 docs/knowledge/tools/verify.py` 通过（exit=0，版本/行号零异常）
- [x] 验证后已移除主工程临时 flat 配置，默认 carousel 构建复验通过

## 文档同步

- [x] `docs/knowledge/00-总览与安装配置/configuration.md` 已更新（article 表 + 置顶内容轮播小节）
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 `source/wiki/stellar/advanced-settings.md`、`front-matter.md` 已同步
