---
title: Stellar v2 Wiki PageViewModel 执行计划
date: 2026-08-22
---

# 执行计划

## 实施步骤

1. [x] 核对 #698、#695、两个仓库工作区与 v2 architecture 契约，锁定不接入 EJS 的 Wiki 纵向切片。
2. [x] 为 `buildWikiPageViewModel()` 增加首个失败测试，定义与 Post 同构的 CollectionModel、ContentItemModel 和冻结 PageViewModel。
3. [x] 最小实现 Wiki identity、source、route、tree navigation、listing、presentation 与 visibility 构建期解析。
4. [x] 为严格 v2 Wiki 归属和 `doc_tree` 事件挂载增加失败测试，再完成事件接入。
5. [x] 同步主题知识库、v2 architecture 和主工程总蓝图的部分交付状态。
6. [x] 运行聚焦测试、`npm run check`、知识库核查与主工程 `npm run g`。
7. [x] 对工作区改动执行 Standards / Spec 双轴 code review，修复本 issue 内发现并复验。

## 风险与回退

- Wiki 树当前包含 `WikiPage` 实例；模型只投影约定字段，避免把实例或可变引用带入 ViewModel。
- shelf 是项目聚合可见性，不应隐式隐藏项目内页面；Collection 与 ContentItem 的 `visibility` 分开解析。
- 事件接入发生在 `doc_tree` 完成之后，不改变现有树构建顺序与 EJS 数据源。回退时可独立移除 Wiki 模型构建和挂载，不影响 Post reference slice。
- 既有主仓库与主题仓库未提交改动不属于 #698，实施与评审均按文件和 hunk 隔离保留。
