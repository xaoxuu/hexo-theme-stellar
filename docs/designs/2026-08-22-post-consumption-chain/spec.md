---
title: Stellar v2 普通 Post 内容与列表消费链
date: 2026-08-22
status: 已完成
---

# 普通 Post 内容与列表消费链方案

## 1. 问题与目标

[#701](https://github.com/xaoxuu/hexo-theme-stellar/issues/701) 延续 #700 的 Pre-alpha M2 渲染内核。普通 Post 的根布局、侧栏、面包屑和 SEO 已消费 `PageViewModel`，但正文后的标签、Footer、上下篇、相关推荐、评论，以及博客卡片、置顶和归档仍从 `page`、`post` 与 `theme` 推断配置和显示状态。

本切片保持 DOM、class、CSS、URL 与可见行为等价，把普通 Post 的详情内容和列表条目决策收敛到构建期 `PageViewModel`。Wiki、Topic、Notebook 继续使用迁移期旧链；本切片完成后 M2 仍为部分交付。

## 2. 技术方案

### 2.1 Post render 投影

保持 `CollectionModel` 与 `ContentItemModel` 不变，在 Post `PageViewModel.render` 增加：

- `article`：标签链接、最终 Footer、上下篇、相关推荐结果和最终评论配置。
- `listing`：详情页对应文章在卡片、置顶和平铺归档中的规范化显示输入。

构建边界在 `after_post_render` 阶段投影 Hexo 标签关系、prev/next 和可选 `hexo-related-popular-posts` 结果；模型构建器继续只接收普通对象。启用相关推荐但插件不存在时，按源文件给出可定位构建错误。

### 2.2 模板消费边界

- 普通 Post 的 `page.ejs` 分支只把显式 `viewModel` locals 传给正文、标签、Footer、上下篇、相关推荐与评论 partial。
- 评论服务 partial 读取已解析的服务名和参数袋，不再合并页面、集合与主题配置；浏览器初始化方式保持不变，ESM 生命周期留给 M4。
- 首页、分类、标签、归档、置顶轮播与 Post 卡片只从每篇文章的 `PageViewModel.collection/item/render.listing` 判断条目展示；分页和当前 Hexo 查询状态仍由列表页面提供。
- Topic Post 不因 `layout: post` 进入普通 Post 链；Wiki 与 Notebook 继续执行 legacy 分支。

## 3. 影响范围

- 修改 `scripts/lib/models/`、Post render Schema、构建期 filter 与相应测试。
- 修改 Post 详情、评论、文章卡片、置顶与归档 EJS；不修改 Stylus、浏览器 JS、语言文件或公开 YAML。
- 同步内容模型、文章页脚、相关内容、评论系统、文章列表知识库与 `VERIFICATION.md`。
- 公开 Wiki、迁移和 SEO 为 N/A：本切片不新增公开配置、URL 或索引行为。

## 4. 验证方式

- 单测覆盖新增 Schema、深冻结、标签链接、Footer、上下篇、相关推荐、评论与列表投影。
- 模板测试覆盖显式 locals、缺模型失败与未迁移 profile 隔离。
- 运行 `npm run check`、知识库核查与主工程 `npm run g`。
- 抽查普通 Post `/blog/20260226/`、首页/分类/标签/归档，以及 Topic Post `/blog/20260815/` 与 Wiki 页面。
