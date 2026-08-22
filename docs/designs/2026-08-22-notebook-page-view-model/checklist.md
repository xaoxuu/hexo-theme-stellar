---
title: Notebook PageViewModel 检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## 产品与实现

- [x] Notebook collection 与 Post reference slice 顶层字段同构。
- [x] 身份、源码、规范化路由、标签导航、列表和可见性在构建期解析。
- [x] Note 只接受严格 `collection.type: notebook` 归属，不读取 v1 字段或运行时 fallback。
- [x] `PageViewModel` 是深度冻结的普通对象，不保留输入引用。
- [x] EJS、迁移、SEO 与公开配置保持不变。

## 验证

- [x] 聚焦测试通过（6 项）。
- [x] `npm run check` 通过（215 项测试）。
- [x] `python3 docs/knowledge/tools/verify.py` 通过硬门禁（行号异常与版本不一致均为 0）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] Standards / Spec 双轴 code review 无未处理 finding。

## Code review

- Standards：修复知识库重复定义与成员输入命名问题；旧数据树复用、跨 profile builder 抽象属于非阻断判断项，本切片不扩大重构范围。
- Spec：修复 Hexo Document 越过普通对象边界、显式空 `headline` 被默认值覆盖的问题；复核无新增阻断项。

## 文档

- [x] `docs/knowledge/03-内容系统/content-schema-v2.md` 与 Notebook 模型接缝一致。
- [x] `docs/knowledge/03-内容系统/notebook-system.md` 的构建期模型说明与真实实现一致。
- [x] `docs/knowledge/VERIFICATION.md` 与 v2 architecture 验证记录已同步。
- [x] 主工程公开 Wiki 为 N/A：本切片不新增公开字段、模板消费或用户操作步骤。
