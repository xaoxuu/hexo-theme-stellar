---
title: Notebook PageViewModel 构建期接缝
date: 2026-08-22
status: 已通过
---

# Notebook PageViewModel 方案

## 问题与结果

严格 v2 Notebook 已有配置校验、数据树、标签树和列表生成链路，但 Note 页面仍只暴露可变 Hexo Document 与原始配置。#696 要让 Notebook 复用 #695 的共享模型接缝，在构建期生成同构、深度冻结的 `CollectionModel`、`ContentItemModel` 与 `PageViewModel`，暂不改变 EJS 渲染。

## 可复用接缝

- 复用 `scripts/lib/models/index.js` 的普通对象投影、路径/日期/术语规范化、级联、Brand 图片原子替换和深度冻结逻辑。
- 复用 `CONTENT_MODEL_FIELDS`、`validateCollectionConfig()`、`validatePageConfig()` 与 `ContentConfigError`，不新增第二套公开字段表或 v1 fallback。
- 复用 `normalize_path()` 规范化 Notebook 与 Note 路由。
- 复用 `generateBefore` 的 `scripts/events/lib/content-config.js`，从 `source/_data/notebooks/{id}.yml` 解析严格集合输入并挂载 `page.viewModel`。

## 公开模型

`buildNotebookPageViewModel(input)` 只接收普通对象：主题配置、Notebook 原始配置、Note Front Matter 与页面投影。输出继续固定为 `{ collection, item }`。

- `collection` 顶层字段与 Post reference slice 完全一致：`id`、`profile`、`identity`、`source`、`route`、`navigation`、`listing`、`presentation`、`visibility`。
- Notebook `identity` 保留名称、标题、说明和身份图标；`source` 保留仓库与分支；`route.baseDir` 归一化。
- Notebook `navigation.tags` 是从 Note 标签构造的冻结标签导航；每项保留规范化 `id`、完整标签名、末段显示名、规范化路径与父级。
- Notebook `listing` 保留 `sort`、`excerptLength`、`perPage`、`orderBy`；默认值来自已存在的主题 `notebook.listing`、Hexo `per_page` 与 `site_tree.notebooks.base_dir`。
- Note `listing.priority`、`visibility`、导航与展示均在模型构建时完成级联。

## 严格归属与事件接入

- Note 必须显式声明 `collection.type: notebook` 与非空 `collection.id`，且 id 必须能解析到 `data["notebooks/{id}"]`；不读取旧 `notebook` 字段，不从路径或布局猜测。
- 事件只为严格归属的页面挂载 Notebook ViewModel；Post 行为保持不变，Topic、Wiki 与普通 Page 不提前接管。
- 输入中的 Notebook 配置、Map/Set、Hexo Query、Moment 和页面 Document 不得进入输出引用。

## 影响范围与 N/A

- 修改：`scripts/lib/models/index.js`、`scripts/events/lib/content-config.js`、聚焦测试、v2 架构计划/检查清单与主题知识库。
- 不修改：EJS、Stylus、浏览器 JS、公开 YAML Schema、迁移与 SEO；本切片不新增用户可操作能力，因此主工程公开 Wiki 同步为 N/A。

## 验收

- 聚焦测试证明模型同构、严格归属、标签导航、规范化路由、列表/可见性级联、普通对象与深度冻结。
- 主题 `npm run check`、知识库核查与主工程 `npm run g` 通过。
