---
title: Stellar v2 首批 Reference 元数据检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## #699 验收

- [x] 四类已交付 profile 的 `CollectionModel`、`ContentItemModel`、`PageViewModel` 字段均有类型、默认值、作用域、消费方与最小示例。
- [x] 模型结构校验与 Reference 生成共同消费 `scripts/schema/model-schema.js`，不存在第二份手写字段表。
- [x] `npm run reference:generate` 重复运行输出稳定，`npm run reference:check` 可只读检查漂移。
- [x] 输出不包含 Blueprint、CLI、布局原语或 Extension Schema。
- [x] 第三方参数袋保持开放边界，不复制上游字段。

## 验证

- [x] `node --test test/reference-metadata.test.js` 通过（5 项测试）。
- [x] `npm run check` 通过（220 项测试）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] `python3 docs/knowledge/tools/verify.py` 通过硬门禁（行号异常与版本不一致均为 0）。
- [x] 现有 post、wiki、topic、notebook PageViewModel 回归测试通过。
- [x] Standards / Spec 双轴 code review 通过，无未解决发现。

## 文档同步

- [x] `docs/knowledge/03-内容系统/content-schema-v2.md` 已记录 Reference 接缝。
- [x] `docs/knowledge/VERIFICATION.md` 已登记实现事实。
- [x] `docs/designs/2026-08-22-v2-architecture/` 的 Pre-alpha M1 状态已同步。
- [x] 主工程 `docs/specs/stellar-v2-blueprint/` 的 Pre-alpha M1 与 #699 状态已同步。
- [x] 主工程公开 Wiki、迁移、SEO、EJS/UI 为 N/A，并已在验收记录说明原因。
