---
title: Stellar v2 Layout Profile 配置消费链检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## 契约与实现

- [x] 13 个 Profile 与全部子节点具有唯一状态化契约。
- [x] Schema 默认、覆盖、路径规范化、数组替换与深冻结通过测试。
- [x] 旧根、旧 ID、旧子字段、未知字段和错误类型被结构化拒绝。
- [x] 生成器、ViewModel 与模板不再读取 `site_tree`。
- [x] 当前 Collection / Front Matter 覆盖保持既有行为。
- [x] 配置 Reference 只投影已交付节点且可重复生成。

## 验证

- [x] `npm run check` 通过（274 项测试）。
- [x] `python3 docs/knowledge/tools/verify.py` 通过硬门禁。
- [x] 主工程 `npm run g` 通过（254 个文件）。
- [x] 首页、普通文章、Topic、Wiki、Notebook、Note、Author、404 与通用页面抽查通过；近期文章首页继续由 Hexo 生成在 `/`，`blog_index.path` 的 Collection 消费由单测覆盖。
- [x] Standards review 无剩余 finding。
- [x] Spec review 无剩余 finding。

## 文档与闭环

- [x] 配置、布局、路由、侧栏知识库已同步。
- [x] `docs/knowledge/VERIFICATION.md` 已登记偏差修正与发布验证。
- [x] 主工程蓝图三件套已同步且保持未提交。
- [ ] 主题提交已推送 `origin/v2`。
- [ ] #707 已评论证据并通过 `resolved` 标签关闭。

## N/A

- [x] CSS 与浏览器 JavaScript：配置迁移不改变视觉和客户端行为。
- [x] 语言文件：不新增用户文案。
- [x] 公开 Wiki、URL 与 SEO：不改变公开文档、生成 URL 或索引语义。
- [x] 依赖：不新增依赖。
