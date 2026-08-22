---
title: Stellar v2 Wiki PageViewModel
date: 2026-08-22
status: 实施中
---

# Wiki PageViewModel 方案

## 1. 问题与目标

[#698](https://github.com/xaoxuu/hexo-theme-stellar/issues/698) 要求 Wiki profile 复用 #695 的构建期模型接缝。当前 Wiki 页面虽然已使用严格 v2 `collection.type/id` 归属，也会在 `doc_tree` 中生成项目树，但仍只向后续模板暴露可变的 Hexo Page、WikiPage 实例与项目配置，尚未生成同构、冻结的 `PageViewModel`。

本切片交付 `buildWikiPageViewModel(input)`，并在 Wiki 树构建完成后为严格归属且能解析到项目配置的 Wiki 页面挂载 `page.viewModel`。输出继续使用 `{ collection, item }`，Collection 顶层字段与 Post reference slice 完全一致；本切片不接入 EJS，不增加 v1 字段、别名或运行时 fallback。

## 2. 公开接缝与模型契约

### 2.1 输入

`buildWikiPageViewModel(input)` 只从以下显式输入解析模型：

- `themeConfig` / `themeSource`：主题级 Wiki profile、全局文章与评论默认值。
- `collectionConfig` / `collectionSource`：`source/_data/wiki/<id>.yml` 的严格 v2 项目配置。
- `collectionState`：`doc_tree` 已解析的首页、分组与页面顺序；只投影为普通对象。
- `collectionListed`：项目是否位于 `source/_data/wiki.yml` shelf。
- `frontMatter` / `source`：页面严格 v2 Front Matter 与来源文件。
- `page`：Hexo 构建期页面值；日期、Query 与路径在模型边界内规范化。

页面必须显式声明 `collection.type: wiki` 与非空 `collection.id`，且该 id 必须与 `collectionConfig` 对应。缺少项目、类型不符或 id 不符均在构建期以带来源和字段路径的 `ContentConfigError` 失败。

### 2.2 输出

`CollectionModel` 的顶层固定为：

`id`、`profile`、`identity`、`source`、`route`、`navigation`、`listing`、`presentation`、`visibility`。

- `identity` 保留 Wiki 的 `name`、`headline`、`tagline`、`description`、`audience` 与 `identity.icon`。
- `source` 只保留 `repository`、`branch`。
- `route` 在构建期规范化 `routing.base_dir`，并投影已解析首页路径。
- `navigation` 完成 Wiki profile → 项目配置级联，并把 `doc_tree.sections` 投影为冻结的普通树节点。
- `listing` 保留 `priority`、`sort`、`excerpt_length`、`per_page`、`order_by` 的规范化值。
- `presentation` 完成主题全局 → Wiki profile → 项目配置的展示级联，包含 card、hero、sidebar、article、footer、comments；项目 `hero.background.image` 在构建期成为页面 banner 图片默认值，页面显式 banner 保持最高优先级。
- `visibility.listed` 表示项目是否位于 shelf；`searchable` 保持 Wiki collection 默认可搜索语义。

`ContentItemModel` 复用 Post reference slice 的字段结构，页面级配置覆盖已解析的 Wiki collection 默认值。页面源码继承项目 `source` 后再接受页面 `source` 覆盖；页面 `visibility` 独立从 `true/true` 起算，不因项目未上 shelf 而被隐藏。全部输出均为深度冻结的普通对象，不保留 Hexo Query、Document、Moment、WikiPage 实例或输入引用。

## 3. 复用与影响范围

- 复用 `scripts/lib/models/index.js` 的克隆、级联、路径/日期/术语规范化与深冻结能力。
- 复用 `scripts/lib/content-config.js` 的 `CONTENT_MODEL_FIELDS`、严格 Collection/Page 校验和 `ContentConfigError`；补充 Wiki profile 对 `site_tree.index_wiki` / `site_tree.wiki` 的字段白名单与类型校验。
- 新增 `scripts/lib/source-config.js` 统一事件层的 Front Matter 读取与来源路径，并由 `scripts/events/lib/content-config.js`、`scripts/events/lib/doc_tree.js` 共同消费，避免 Wiki 挂载重复内容校验事件的文件访问逻辑。
- 复用 `scripts/lib/doc_tree.js` 的 Wiki 树解析结果；`scripts/events/lib/doc_tree.js` 在树完成后挂载模型。
- 不修改 `layout/`、CSS、浏览器 JS、语言文件、公开配置或现有模板消费路径。
- 同步 `docs/knowledge/03-内容系统/content-schema-v2.md`、`wiki-docs.md`、`VERIFICATION.md` 与 v2 architecture 方案状态。
- 主工程公开 Wiki 为 N/A：本切片不新增用户配置或模板行为，用户文档不提前公开尚未被 EJS 消费的内部模型。

## 4. 验证方式

- 聚焦测试覆盖同构字段、身份/源码/路由/树/列表/可见性、页面级联、深冻结、输入引用隔离、严格归属与生成前挂载。
- 按 TDD 在 `buildWikiPageViewModel()` 和 `doc_tree` 事件两个公开接缝逐条执行 red → green。
- 运行单文件测试、主题 `npm run check`、知识库硬事实核查和主工程 `npm run g`。
- EJS/UI、迁移与 SEO 验收为 N/A；本切片不改变渲染、公开 URL 或索引输出。
