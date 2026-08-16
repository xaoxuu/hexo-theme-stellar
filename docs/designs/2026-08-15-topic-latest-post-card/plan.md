---
title: 专栏列表最新文章卡片与公共文章列表组件执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] 模板：新增 `layout/_partial/main/post_list/latest_post_card.ejs`（公共组件）
2. [x] 模板：重写 `layout/_partial/main/post_list/topic_card.ejs`
3. [x] 模板：`layout/index_topic.ejs` 容器类与卡片外层标签改造
4. [x] 样式：新增 `source/css/_components/partial/post-panel.styl`（公共组件）
5. [x] 样式：`source/css/_components/tag-plugins/friends_posts.styl` 保留友链专属样式、迁移共享样式
6. [x] 脚本：`source/js/services/friends_and_posts.js` 类名切换
7. [x] 样式：`source/css/_components/list.styl` 泛化 `.cover` 覆盖层 + 新增 topic 区块
8. [x] 数据：主仓库 5 个 `source/_data/topic/*.yml` 新增 `cover`
9. [x] 文档：`docs/knowledge/` 相关页面与 `VERIFICATION.md` 同步，`verify.py` 核查
10. [x] 主仓库：`source/wiki/stellar/topic.md` 布局说明同步
11. [x] 验证：主工程 `npm run g` 与 `npm run s` 渲染检查

## 风险与回退

- 友链文章订阅类名改动影响既有页面：`/friends/` 与相关文章预览验证；异常时保留 `.previews` 别名类。
- `.cover` 规则从 `.post.photo` 泛化到全部 post-card：photo 卡片视觉需回归验证；异常时可把泛化规则改回 `.post.photo` 并在 topic 区块单独声明。
- 专栏卡片外层 `<a>` 改 `<div>` 后整卡不再跳转：最新文章卡片与文章列表链接均已提供独立入口。
