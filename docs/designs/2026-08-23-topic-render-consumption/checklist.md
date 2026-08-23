---
title: Stellar v2 Topic 完整渲染消费链检查清单
date: 2026-08-23
---

# 检查清单 / 验证记录

## 契约与实现

- [x] Topic PageViewModel 必需 `render.document/layout/seo/article/listing`。
- [x] Topic 详情页缺少合法 render 时来源化失败。
- [x] Topic Hero 只作为成员 Banner 回退，正文上下篇保持 Hexo 全站关系。
- [x] Topic 索引、博客卡片和置顶轮播只消费显式 listing。
- [x] Notebook 保持迁移期旧链。

## 验证

- [x] `npm run reference:check`
- [x] `npm run check`
- [x] `python3 docs/knowledge/tools/verify.py`
- [x] 主工程 `npm run g`
- [x] `/topic/`、Topic 首页成员与普通 Topic 成员产物抽查
- [x] Standards / Spec 双轨 review 无剩余 finding

## 文档与边界

- [x] 主题知识库与 `VERIFICATION.md` 已同步。
- [x] 主工程 v2 蓝图已登记，M2 与 Alpha 1 保持未完成。
- [x] 公开 Wiki、迁移跳转、CSS、语言文案和客户端 API 变更为 N/A。
