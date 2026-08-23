---
title: Stellar v2 Wiki 完整渲染消费链检查清单
date: 2026-08-23
---

# 检查清单 / 验证记录

## 契约与实现

- [x] Wiki PageViewModel 必需 `render.document/layout/seo/cover/article/listing`。
- [x] Wiki 详情页缺少合法 render 时来源化失败。
- [x] Wiki 索引模板只消费生成器显式列表和标签导航。
- [x] Topic 与 Notebook 保持迁移期旧链。

## 验证

- [x] `npm run reference:check`
- [x] `npm run check`
- [x] `python3 docs/knowledge/tools/verify.py`
- [x] 主工程 `npm run g`
- [x] `/wiki/`、Wiki 标签页、`/wiki/stellar/` 与普通 Wiki 内页产物抽查
- [ ] Standards / Spec 双轨 review 无剩余 finding

## 文档与边界

- [x] 主题知识库与 `VERIFICATION.md` 已同步。
- [ ] 主工程 v2 蓝图已登记，M2 与 Alpha 1 保持未完成。
- [x] 公开 Wiki、迁移跳转、CSS、语言文案和客户端 API 变更为 N/A。
