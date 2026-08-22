---
title: Stellar v2 Wiki PageViewModel 检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## #698 验收

- [x] Wiki CollectionModel 顶层字段与 Post reference slice 同构。
- [x] Wiki identity、source、规范化 route、树形 navigation、listing 与 collection visibility 在构建期解析。
- [x] ContentItemModel 只接受严格 `collection.type: wiki` 与匹配的 `collection.id`，不存在 v1 字段或运行时 fallback。
- [x] PageViewModel 是深度冻结的普通对象，不保留 Hexo/WikiPage/输入配置引用。
- [x] 页面导航、展示（含 Wiki Hero 图片到页面 Banner 的默认值）、源码、列表与可见性级联已完成，后续模板无需重新访问原始项目配置。
- [x] 生成前事件只为能解析到严格 v2 项目的 Wiki 页面挂载同构 `page.viewModel`。

## 验证

- [x] `node --test test/page-view-model.test.js` 通过（13 项）。
- [x] `npm run check` 通过（基于已合入 #696 的远端 `v2` 共 212 项测试；完整混合工作区共 215 项）。
- [x] `python3 docs/knowledge/tools/verify.py` 通过硬门禁（版本不一致与行号越界均为 0）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] Standards / Spec 双轴 code review 无未处理发现（终审均为 0 项）。

## 文档与范围

- [x] `docs/knowledge/` 与 `VERIFICATION.md` 同步到真实实现。
- [x] v2 architecture spec/plan/checklist 与主工程总蓝图记录 Wiki slice 的真实状态。
- [x] EJS/UI 为 N/A：#698 明确不在本切片接入布局。
- [x] 主工程公开 Wiki 为 N/A：没有新增公开配置或已发布用户行为。
- [x] 迁移/SEO 为 N/A：没有兼容层、公开 URL、canonical、robots、sitemap 或索引策略变化。
