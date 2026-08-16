---
title: 专栏列表最新文章卡片与公共文章列表组件检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] 在主工程执行 `npm run g` 全量构建通过
- [x] `npm run s` 渲染 `/topic/` 与 `/friends/` 检查（构建产物结构核对）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [x] 页面类型覆盖：专栏索引页（`/topic/`）、友链页（`/friends/`）、含 `friends posts:true` 的文章页
- [x] 移动端视口：上下布局与桌面一致（CSS 核对）
- [x] story 文章页 h2 样式回归（mixin 抽取不改变输出）

## 文档同步

- [x] `docs/knowledge/03-内容系统/post-lists-cards.md` 新增 topic 卡片变体
- [x] `docs/knowledge/04-标签插件/social-content-card-tags.md` 同步 friends_and_posts 结构
- [x] `docs/knowledge/知识库全量.md` 对应段落同步
- [x] `docs/knowledge/VERIFICATION.md` 已登记偏差修正
- [x] 主仓库 `source/wiki/stellar/topic.md` 布局说明同步
