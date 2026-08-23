---
title: Stellar v2 Notebook 完整渲染消费链检查清单
date: 2026-08-23
---

# 检查清单 / 验证记录

## 契约与实现

- [x] Notebook PageViewModel 必需 `render.document/layout/seo/article/listing`。
- [x] Note 详情页缺少合法 render 时来源化失败。
- [x] Notebook 树完成后以纯对象两阶段构建并深度冻结。
- [x] Notebook 总索引、集合首页和标签分页只消费显式投影。
- [x] Post、Wiki、Topic 不会误入 Notebook 分支。

## 验证

- [x] `npm run reference:check`
- [x] `npm run check`（307 项测试）
- [x] `python3 docs/knowledge/tools/verify.py`
- [x] 主工程 `npm run g`（254 个生成文件）
- [x] Notebook 总索引、集合首页、标签筛选与普通 Note 由事件/生成器/模板回归覆盖；主工程当前无严格 Notebook fixture，以全站生成验证其它 profile 隔离
- [x] Standards / Spec 双轨 review 无剩余 finding

## 文档与边界

- [x] 主题知识库与 `VERIFICATION.md` 已同步。
- [x] 主工程 v2 蓝图已登记，M2 完成、Alpha 1 保持未完成。
- [x] 公开 Wiki、迁移跳转、CSS、语言文案和客户端 API 变更为 N/A。
