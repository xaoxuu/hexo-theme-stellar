---
title: Topic PageViewModel 检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## 产品与实现

- [x] Topic collection 与 Post reference slice 顶层字段同构。
- [x] 身份、源码、规范化路由、系列导航、列表和可见性在构建期解析。
- [x] Topic 内容项只接受严格 `collection.type: topic` 归属，不读取 v1 字段或运行时 fallback。
- [x] `PageViewModel` 是深度冻结的普通对象，不保留输入引用。
- [x] EJS、迁移、SEO 与公开配置保持不变。

## 验证

- [x] 聚焦测试通过（3 项）。
- [x] `npm run check` 通过（215 项测试）。
- [x] `python3 docs/knowledge/tools/verify.py` 通过硬门禁（版本不一致与行号越界均为 0）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] Standards / Spec 双轴 code review 无未处理 finding。

## 文档

- [x] `docs/knowledge/03-内容系统/content-schema-v2.md` 与 Topic 模型接缝一致。
- [x] `docs/knowledge/VERIFICATION.md` 与 v2 architecture 验证记录已同步。
- [x] 主工程公开 Wiki 为 N/A：本切片不新增公开字段、模板消费或用户操作步骤。
