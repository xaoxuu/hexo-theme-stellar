---
title: Topic PageViewModel 构建期接缝
date: 2026-08-22
status: 实施中
---

# Topic PageViewModel 方案

## 问题与结果

严格 v2 Topic 已有配置校验、数据树和文章归集链路，但 Topic 文章仍只暴露可变 Hexo Document 与原始项目配置。#697 要让 Topic 复用 #695 的共享模型接缝，在构建期生成同构、深度冻结的 `CollectionModel`、`ContentItemModel` 与 `PageViewModel`，暂不改变 EJS 渲染。

## 可复用接缝

- 复用 `scripts/lib/models/index.js` 的普通对象投影、路径/日期/术语规范化、级联、Brand 图片原子替换和深度冻结逻辑。
- 复用 `CONTENT_MODEL_FIELDS`、`validateCollectionConfig()`、`validatePageConfig()`、Post profile 校验和 `ContentConfigError`，不新增第二套公开字段表或 v1 fallback。
- 复用 `normalize_path()` 规范化 Topic 与文章路由。
- 复用 `generateBefore` 的 `scripts/events/lib/content-config.js`，从 `source/_data/topic/{id}.yml` 解析严格集合输入并挂载 `page.viewModel`。

## 公开模型

`buildTopicPageViewModel(input)` 只接收主题配置、Topic 原始配置、Topic 全部严格成员、当前文章 Front Matter 与页面投影，输出继续固定为 `{ collection, item }`。

- `collection` 顶层字段与 Post reference slice 完全一致：`id`、`profile`、`identity`、`source`、`route`、`navigation`、`listing`、`presentation`、`visibility`。
- Topic `identity` 保留名称、标题、说明、受众和身份图标；`source` 保留仓库与分支；`route.path` 取显式 `routing.path`，缺失时由 `site_tree.index_topic.base_dir` 与严格集合 id 确定，并统一规范化。
- Topic `navigation.series` 只投影显式归属同一 Topic 且 `visibility.listed !== false` 的文章，按 `listing.order_by` 的日期方向稳定排序；每项只保留 id、标题、规范化路径、ISO 日期与当前项标记。
- Topic `listing` 保留集合优先级、排序、摘要长度、分页数和排序字段；未配置的专属字段使用模型层 `null`，默认顺序为 `-date`。
- Topic 的页面导航、普通文章侧栏、集合展示配置、全局文章配置、页脚、评论和页面 Front Matter 在构建时完成级联；页面 `listing.priority` 与 `visibility` 保留 `0`、`false` 等显式值。

## 新增定义与边界

- `TOPIC_PROFILE_FIELDS` 是模块级冻结字段表，只供 `validateTopicProfileConfig()` 校验 `site_tree.index_topic` 与 `site_tree.topic`。消费方是 Topic 纯模型入口；字段来源完全是现有主题默认配置，不新增公开 YAML 字段、别名或隐式来源。
- `validateTopicProfileConfig()` 是构建期严格校验入口，作用域仅为 Topic profile 会消费的索引路由、导航和侧栏；错误沿用 `ContentConfigError` 的配置来源与字段路径，不执行类型转换或降级。
- `buildTopicPageViewModel()` 的默认路由根来自现有 `site_tree.index_topic.base_dir`，集合未显式配置时使用主题现有 `topic` 根；`listing.order_by` 缺失时沿用 Topic tree 已有的 `-date` 语义。默认值只存在于构建期模型，不扩大配置边界。
- `generateBefore` 在单次事件内以页面对象为键缓存 Front Matter 解析结果；当前页与 Topic 成员均先经 `pageModelInput()` 投影为普通对象，Moment 日期转为 ISO 值，再交给纯模型入口。缓存不跨构建持久化，也不进入 ViewModel。

## 严格归属与事件接入

- Topic 文章必须显式声明 `collection.type: topic` 与非空 `collection.id`，且 id 必须能解析到 `data["topic/{id}"]`；不读取旧 `topic` 字段，不从路径、布局或 Topic 数据树运行时猜测。
- 系列成员同样只根据严格 collection 归属收集；其它 Topic、普通 Post、Wiki、Notebook 与 Page 不进入系列导航。
- 缺失集合以包含页面来源和 `collection.id` 的 `ContentConfigError` 失败，不静默跳过。
- 输入中的 Topic 配置、Hexo Query、Moment 和页面 Document 不得进入输出引用。

## 影响范围与 N/A

- 修改：`scripts/lib/models/index.js`、`scripts/events/lib/content-config.js`、聚焦测试、v2 架构计划/检查清单与主题知识库。
- 不修改：EJS、Stylus、浏览器 JS、公开 YAML Schema、迁移与 SEO；本切片不新增用户操作步骤，因此主工程公开 Wiki 同步为 N/A。
- 主工程总蓝图只在 Pre-alpha 里程碑状态需要变化时更新；#697 完成只是 M1 的局部能力证据，不等于 M1 或 Alpha 1 完成。

## 验收

- 聚焦测试证明模型同构、严格归属、系列导航、规范化路由、列表/可见性级联、普通对象与深度冻结。
- 主题 `npm run check`、知识库核查与主工程 `npm run g` 通过。
