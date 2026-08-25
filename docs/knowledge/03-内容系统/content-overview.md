---
title: 内容组织
domain: 内容系统
tags:
  - Collection
  - Pipeline
  - ViewModel
---

# 内容组织

Stellar v2 保留 Post、Wiki、Topic、Notebook 四种产品形态，但它们共用同一条构建期 Collection Pipeline。公开配置与 Front Matter 以 [v2 内容配置契约](content-schema-v2.md)为准；模板只消费冻结的 `PageViewModel` 或生成器 listing 投影，不读取原始 YAML、Hexo Query 或运行时树。

## 四类内容的产品语义

| Profile | 内容来源 | Collection 来源 | 用户旅程 | 导航与排序差异 |
| --- | --- | --- | --- | --- |
| `post` | `source/_posts/` | 主题 Post profile | 博客索引 → 文章详情 | 分类、标签、分页与全站上下篇 |
| `wiki` | `source/` 页面 | `source/_data/wiki/*.yml` | Wiki 索引/标签 → 项目首页 → 文档页 | 手工章节 tree、项目内前后页、相关项目 |
| `topic` | `source/_posts/` | `source/_data/topic/*.yml` | Topic 索引 → 系列文章 | series 默认按日期排序，只服务侧栏；正文仍用 Hexo 全站上下篇 |
| `notebook` | `source/notebooks/<id>/` 或显式归属页面 | `source/_data/notebooks/*.yml` | 笔记本索引 → 单本/标签列表 → Note 详情 | 标签树、置顶、最近更新与分页 |

Post 不声明 `collection`。Wiki 与 Topic 页面使用严格的 `collection.profile/id`。`stellar new note` 创建到 `source/notebooks/<id>/` 的 Note 可由路径唯一确定 Notebook，因此不重复写归属字段；其它位置的 Note 仍需显式声明。

## Collection Pipeline

`scripts/lib/collection-pipeline/` 是唯一构建编排入口，`before_generate` 不再分别调用四套派生事件：

```text
配置解析
  → 一次内容发现与普通对象快照
  → profile / collection 归属分组
  → Collection 状态（tree / series / tags）
  → 基础 ViewModel
  → 集合级导航与 listing 聚合
  → 最终 ViewModel
  → 生成器路由投影
```

- `registry.js` 封闭登记 `post`、`topic`、`wiki`、`notebook` 四个 profile adapter。
- `shared.js` 提供单遍发现、稳定排序、`listed`/tag 过滤、分页输入和 two-stage 生命周期原语。
- adapter 只保留内容来源、归属、导航、默认排序、首页与路由差异；页面身份、来源、可见性、优先级、摘要、SEO、Footer、评论和列表模型由共享模型事实来源提供。
- 所有 Post/Page 在发现阶段各访问一次，再按 `profile:id` 分组；Wiki 与 Notebook 的树构建也保持单遍线性分组，不按 Collection 重扫全部页面。

Topic 和 Notebook 共用 two-stage 协议。Topic 先建立全部成员的 collection base/series，再完成文章模型；Notebook 先用标签树生成临时 listing，聚合 `notebookIndex` 后把 `tagTree` 与 `recentItems` 写入最终详情模型。Wiki 同样在 tree 完成后构造纯对象 ViewModel，但保留手工章节导航语义。

## 模型边界

四类详情页都输出：

- `collection`：固定字段的 `CollectionModel`；
- `item`：规范化的 `ContentItemModel`；
- `render`：模板所需的文档、布局、SEO、正文辅助区和列表投影。

`scripts/lib/models/index.js` 与 `scripts/schema/model-schema.js` 是字段与校验事实来源。`scripts/lib/page-view-model-registry.js` 按 profile 保存 input/base/final，Post/Topic 在 `after_post_render` 使用最终正文、关系和相关文章结果完成模型；Wiki/Notebook 在树与聚合 barrier 后完成。

## 列表、过滤与路由

- 博客分页与当前分类/标签查询状态继续由 Hexo 提供，卡片只消费 `render.listing`。
- Wiki 索引与 Notebook 标签列表共用 `listed + tag membership` 过滤原语，导航模型仍分别是 tree 与 tag tree。
- Topic 索引按最新成员日期稳定排序；相同值保留发现顺序。
- Notebook 先按 `listing.priority` 降序，再按 Collection `listing.sort` 稳定排序；`visibility.listed: false` 不进入列表或 recent，但详情路由仍生成。
- 生成器只向 EJS 传冻结 listing/index locals；原始 `hexo.stellar.data.wiki/topic/notebooks` 只作为构建期状态，不是模板公共接口。

## 相关文档

- [v2 内容配置契约](content-schema-v2.md)
- [文档系统（Wiki）](wiki-docs.md)
- [笔记本系统](notebook-system.md)
- [文章列表与卡片](post-lists-cards.md)
- [相关内容与导航](related-content.md)
