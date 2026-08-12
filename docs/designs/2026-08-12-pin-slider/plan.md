---
title: 列表页置顶内容轮播 执行计划
date: 2026-08-12
---

# 执行计划

## 实施步骤

1. [x] 主题 `_config.yml` 新增 `pin_slider`（`enable: false`、`interval: 4000`）；主工程 `_config.stellar.yml` 开启。
2. [x] 新增 `layout/_partial/main/pin_slider.ejs`（收集 + 标记 + 内联脚本）。
3. [x] `nav_tabs_blog.ejs` / `nav_tabs_wiki.ejs` 顶部注入；`index.ejs` 首页第一页跳过置顶文章。
4. [x] 新增 `source/css/_components/pin-slider.styl`。
5. [x] 同步知识库：configuration、logo-navigation-headers、page-templates-routing、wiki-docs、content-overview、client-side-overview、`知识库全量.md`、`VERIFICATION.md`。
6. [x] 验证：`npm run check`、主工程 `npm run g`、临时测试数据 + 无头浏览器（CDP）交互检查。
7. [x] 还原测试数据、重新全量构建确认产物干净；按用户要求**不提交**，改动保留在工作区。

## 风险与回退

- `pin` 字段同时存在于文章/数据文件，命名冲突风险低（`pin ?? sticky` 归一化）；回退：删除配置与 partial 注入即恢复原行为。
- localStorage 读写可能被隐私模式拦截：全部 try/catch 兜底，失败仅回退为不缓存。
- 单张置顶内容不轮播（隐藏圆点、不自动播放），避免 Swiper 式单张报错；无需特殊回退。
