---
title: Stellar v2 工程架构检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## Alpha 1

- [x] post profile 贯通严格 Schema、CollectionModel、ContentItemModel 与冻结的 PageViewModel。
- [ ] wiki、topic、notebook profile 都生成同构模型，并保留各自的身份、路由、导航、列表与可见性语义。
- [ ] Reference 元数据包含已交付字段的类型、默认值、作用域、消费方和最小示例。
- [ ] Alpha 1 未提前公开 Blueprint、CLI、布局或 Extension 字段。

## 后续阶段

- [ ] 模板可从 `PageViewModel` 获取布局、文章与集合状态。
- [ ] 三套 Blueprint dry-run 与写入计划一致，已有文件不会被覆盖。
- [ ] doctor 的 text/json 输出包含文件、字段、实际类型、期望结构和迁移章节。
- [ ] Extension 支持 mount、unmount、按需 import 和失败隔离。
- [ ] request/cache 不修改原生 fetch/XHR。
- [ ] `npm run check` 通过。
- [ ] 主工程 `npm run g` 通过。

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
