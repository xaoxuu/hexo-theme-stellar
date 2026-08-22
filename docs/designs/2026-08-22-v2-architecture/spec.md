---
title: Stellar v2 领域内核、Blueprint 与 Extension 架构
date: 2026-08-22
status: 实施中
---

# Stellar v2 工程架构方案

## 1. 目标

在已有 v2 严格内容配置上建立可独立测试的领域内核，使生成器、模板、CLI 和浏览器扩展共享同一份规范化结果。首个架构阶段最终覆盖四类 Collection、三套 Blueprint、只读 doctor、布局原语和 ESM Extension 运行时，但按可独立验收、可在单个新上下文完成的纵向切片逐步交付。

Alpha 1 以构建期模型输出作为公开接缝：先用 post profile 贯通严格 Schema、CollectionModel、ContentItemModel 与冻结的 PageViewModel，再让 wiki、topic、notebook 生成同构结果，最后从已交付 Schema 生成 Reference 元数据。模板、导航、列表和 SEO 对 PageViewModel 的消费属于 Alpha 2，不在 Alpha 1 提前承诺。

## 2. 模块边界

- `scripts/lib/models/`：构建 `CollectionModel`、`ContentItemModel`、`PageViewModel`，只接收普通对象并返回冻结的普通对象。
- `scripts/schema/`：按切片定义已交付公开契约，是 Reference 生成器的唯一输入。Alpha 1 当前只包含四类 CollectionModel、共享 ContentItemModel 与 PageViewModel，尚未交付的 Blueprint、CLI、布局和 Extension 不入 Schema。
- `scripts/lib/blueprints/` 与 `blueprints/`：读取声明、生成文件计划、检测冲突并一次性写入。
- `scripts/commands/stellar.js`：提供 `stellar init` 与 `stellar doctor`，命令层只负责参数和输出格式。
- `source/js/core/`：ESM runtime、Extension registry 与 request/cache client，不暴露可变全局。
- `layout/_partial/primitives/`：Shell、Region、Section、Item、Navigation 五个可组合 partial。

Alpha 1 的首条公开构建期接缝为 `buildPostPageViewModel(input)`。它只接收普通配置投影和页面数据，输出 `{ collection, item }`；生成前事件把结果挂载到普通 Post 的 `page.viewModel`，但本阶段不让 EJS 消费该字段。`CollectionModel` 固定公开 `id`、`profile`、`identity`、`source`、`route`、`navigation`、`listing`、`presentation`、`visibility`，Post 的 `id` 与 `profile` 均为 `post`。

Wiki slice 复用同一接缝，由 `buildWikiPageViewModel(input)` 接收严格 Wiki 项目配置、页面 Front Matter 和 `doc_tree` 已解析状态。它保留 Wiki identity/source/route/listing/visibility，把 `sections` 投影为普通树形 navigation，并在构建期完成主题、Wiki profile、项目与页面级联。只有显式 `collection.type: wiki` 且 id 能解析到项目配置的页面会在 `doc_tree` 完成后获得冻结 `page.viewModel`；shelf 的项目可见性不隐式覆盖页面自身可见性。本阶段仍不让 EJS 消费该字段。

Topic slice 提供同构的 `buildTopicPageViewModel(input)`：集合身份与源码直接来自严格 `source/_data/topic/{id}.yml`，路由在构建期规范化，`navigation.series` 只收集显式归属同一 Topic 且允许列出的文章，并按集合 `listing.order_by` 稳定排序。Topic 索引可见性与单篇文章的 `visibility` 相互独立；本阶段仍不让 EJS 消费该字段。

`ContentItemModel` 只保留文章标识、标题、布局、正文与摘要、ISO 日期、字符串标签与分类、文件来源、规范化路由，以及已经完成级联的导航、列表、展示和可见性。全部模型均为深度冻结的普通对象，不保留 Hexo Document、Query、Moment 或输入配置引用。

各切片复用 `scripts/lib/content-config.js` 的严格校验、共享字段组与 `ContentConfigError`，复用 `scripts/lib/path_utils.js` 的路径规范化，不新增依赖或第二套字段表。`CONTENT_MODEL_FIELDS` 是页面配置校验器与模型投影共同消费的公开内容字段白名单；各 profile 的字段表只约束对应现有配置来源，不新增 YAML 字段或兼容别名。`visibility.listed/searchable: true` 表示页面未显式隐藏时参与聚合与搜索，`listing.priority: 0` 表示默认不置顶，列表样式与摘要长度缺失时使用 `null` 表示没有模型层覆盖。这些默认值只作用于构建期模型，不改变现有配置边界。

Alpha 1 的 Reference 接缝由 `scripts/schema/model-schema.js` 声明模型结构和字段注解，`scripts/lib/models/` 在冻结前用它校验输出，`scripts/lib/reference-metadata.js` 则直接遍历同一 Schema。`npm run reference:generate` 生成无时间戳、稳定排序的 `reference/v2-models.json`，`npm run reference:check` 在全量检查中阻止产物漂移。字段默认值以 `literal`、`derived`、`inherited` 或 `computed` 机器可读语义表示。

## 3. 兼容与迁移

v2 只接受 v2 字段。doctor 复用严格校验器，但收集并结构化问题，不改文件。Blueprint 生成器拒绝覆盖，`--dry-run` 与真实执行必须共享同一份文件计划。

客户端迁移分为可独立验证的切片：先建立 ESM 上下文和生命周期并接管页面级初始化，再逐个把现有官方插件迁入 Extension 契约；每个切片删除相应全局和补载逻辑，不保留双实现作为长期兼容层。

## 4. 验证

- 单测覆盖四类 Collection、级联、不可变 ViewModel、Blueprint 路径安全、冲突、dry-run、doctor text/json 和 Extension 生命周期。
- 静态约束模板不重新实现级联，浏览器入口使用 `type=module`，新增代码不引入裸全局。
- 运行 `npm run check`；修改 `scripts/` 后必须在主工程运行 `npm run g`。

## 5. 交付规则

- 每个切片从一种真实 profile 输入贯通到可检查的规范化输出，并包含相应测试与知识库同步。
- post reference slice 建立共享模型接缝；wiki、topic、notebook 只依赖该接缝，三者可并行交付。
- Reference 元数据只描述已经交付的公开字段，不提前公开 Blueprint、CLI、布局或 Extension 契约。
- 每个切片独立保持主题检查与主工程构建可通过；阶段完成仍以总蓝图门禁为准。
