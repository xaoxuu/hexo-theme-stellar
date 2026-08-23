---
title: Stellar v2 工程架构检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## Pre-alpha M1

- [x] post profile 贯通严格 Schema、CollectionModel、ContentItemModel 与冻结的 PageViewModel。
- [x] wiki、topic、notebook profile 都生成同构模型，并保留各自的身份、路由、导航、列表与可见性语义。
- [x] Reference 元数据包含已交付字段的类型、默认值、作用域、消费方和最小示例。
- [x] M1 未提前公开 Blueprint、CLI、布局或 Extension 字段。
- [x] M1 完成只表示领域模型与 Reference 元数据能力已交付，不建立 Alpha 版本。

## #699 Reference 元数据验证记录

- [x] post、wiki、topic、notebook 的 `CollectionModel`、共享 `ContentItemModel` 与 `PageViewModel` 都由同一声明式 Schema 约束。
- [x] 每个输出字段包含机器可读的类型、默认值语义、作用域、消费方和最小示例。
- [x] 模型构建在冻结前拒绝 Schema 外字段、缺失的必需字段与错误类型；现有四类模型回归通过。
- [x] `npm run reference:generate` 重复运行输出稳定，`npm run reference:check` 已纳入主检查。
- [x] `reference/v2-models.json` 不包含 Blueprint、CLI、布局原语或 Extension Schema；`ContentItemModel.layout` 仅表示已交付模型字段。
- [x] `npm run check` 通过（#699 工作区，220 项测试）。
- [x] 主工程 `npm run g` 通过（#699 工作区，生成并压缩 254 个文件）。
- [x] Standards / Spec 双轴 code review 通过，无未解决发现。
- [x] 公开 Wiki、迁移/SEO、EJS/UI 验收为 N/A：本切片只交付供后续文档和工具消费的构建期元数据，不新增公开配置、URL 或模板行为。

## Pre-alpha M2–M5

- [x] 普通 Post 的根布局、侧栏、Brand、菜单、面包屑与 SEO 从 `PageViewModel` 获取，五类布局原语已建立（#700，M2 部分交付）。
- [x] 普通 Post 的文章内容/标签/评论/相关推荐/列表，以及 Wiki、Topic、Notebook 消费链完成迁移；M2 已完成。
- [x] 三套 Blueprint dry-run 与写入计划一致，已有文件不会被覆盖（#716）。
- [x] doctor 的 text/json 输出包含文件、字段、实际类型、期望结构和迁移章节（#716）。
- [ ] Extension 支持 mount、unmount、按需 import 和失败隔离。
- [ ] request/cache 不修改原生 fetch/XHR。
- [ ] 后续阶段完整实现后 `npm run check` 通过。
- [ ] 后续阶段完整实现后主工程 `npm run g` 通过。

## Alpha 1 端到端门禁

- [ ] M1–M5 全部完成。
- [ ] 预发布包可安装到干净的 Hexo 8 / Node.js 22 工程。
- [x] 三套 Blueprint 可初始化且生成结果独立构建，doctor 检查通过（#716）。
- [ ] 四类 Collection profile 通过 ViewModel 消费链渲染，Extension 生命周期可验证。
- [ ] Reference、主题检查、主工程构建与预发布安装演练全部通过。
- [ ] Alpha 发布说明列出仍不稳定的契约与未交付范围。

## #695 Post PageViewModel 验证记录

- [x] `buildPostPageViewModel()` 输出固定结构、深度冻结的普通对象，不保留 Hexo Document、Query、Moment 或输入配置引用。
- [x] 页面、Post profile、主题全局配置级联通过测试，`false`、`0`、空字符串与 Brand 图片原子替换语义保持正确。
- [x] v1 字段、未知字段与错误类型继续严格失败，错误包含配置来源和字段路径。
- [x] 生成前事件只为普通 Post 挂载 `page.viewModel`，Topic、Wiki、Notebook 与普通 Page 未提前接管。
- [x] `npm run check` 通过（202 项测试）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] `python3 docs/knowledge/tools/verify.py` 通过硬门禁（版本不一致与行号越界均为 0）。
- [x] 主题知识库与 `VERIFICATION.md` 已同步。
- [x] 公开 Wiki、迁移/SEO、布局/UI 验收为 N/A：本切片只建立内部构建期接缝，不新增公开配置或模板消费。

## #696 Notebook PageViewModel 验证记录

- [x] `buildNotebookPageViewModel()` 与 Post reference slice 输出同构的 `CollectionModel`、`ContentItemModel` 和深度冻结 `PageViewModel`。
- [x] Notebook 身份、源码、规范化路由、标签导航、集合列表配置，以及 Note 的列表优先级和可见性均在构建期解析。
- [x] Note 只接受严格 `collection.type: notebook` 与可解析的 collection id；不存在的 Notebook 会给出来源可定位错误。
- [x] 主题、Notebook、Note 页面级联保留 `false`、`0` 与空字符串，不保留 Hexo Document、Query、Moment、Map/Set 或配置输入引用。
- [x] `generateBefore` 只为严格 Notebook Note 挂载模型；Post 行为不变，Topic 与普通 Page 未提前接管。
- [x] `npm run check` 通过（基于已合入 #696 的远端 `v2` 共 212 项测试；完整混合工作区共 215 项）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] `python3 docs/knowledge/tools/verify.py` 通过硬门禁（行号异常与版本不一致均为 0）。
- [x] 公开 Wiki、迁移/SEO、EJS/UI 验收为 N/A：本切片不新增公开配置或模板消费。

## #698 Wiki PageViewModel 验证记录

- [x] `buildWikiPageViewModel()` 与 Post reference slice 输出同构的 `CollectionModel`、`ContentItemModel` 和深度冻结 `PageViewModel`。
- [x] Wiki 身份、源码、规范化路由、树形导航、列表配置与 shelf 可见性均在构建期解析。
- [x] Wiki 页面只接受严格 `collection.type: wiki` 与可解析、匹配的 collection id；不存在的项目给出来源可定位错误。
- [x] 主题、Wiki profile、项目与页面级联不保留 Hexo Document、Query、Moment、WikiPage 或配置输入引用；项目与页面可见性保持独立。
- [x] `doc_tree` 完成后只为严格 Wiki 页面挂载模型，现有 EJS 数据源和 Post/Topic/Notebook 接缝不变。
- [x] `npm run check` 通过（215 项测试）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] `python3 docs/knowledge/tools/verify.py` 通过（版本不一致与行号越界均为 0）。
- [x] 公开 Wiki、迁移/SEO、EJS/UI 验收为 N/A：本切片不新增公开配置或模板消费。

## #697 Topic PageViewModel 验证记录

- [x] `buildTopicPageViewModel()` 与 Post reference slice 输出同构的 `CollectionModel`、`ContentItemModel` 和深度冻结 `PageViewModel`。
- [x] Topic 身份、源码、规范化路由、系列导航、集合列表配置与可见性均在构建期解析。
- [x] Topic 文章与系列成员只接受严格 `collection.type: topic` 和匹配 id；不存在的 Topic 会给出页面来源与字段语义可定位错误。
- [x] 系列导航稳定遵循 `listing.order_by` 并排除 `visibility.listed: false` 的成员；Topic 索引可见性与文章可见性保持独立。
- [x] 页面导航、普通 Post 侧栏、Topic 展示、全局文章、页脚、评论和页面 Front Matter 级联保留 `false`、`0` 与空字符串。
- [x] `npm run check` 通过（215 项测试）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] `python3 docs/knowledge/tools/verify.py` 通过硬门禁（版本不一致与行号越界均为 0）。
- [x] 公开 Wiki、迁移/SEO、EJS/UI 验收为 N/A：本切片不新增公开配置或模板消费。
