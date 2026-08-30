---
title: Topic Brand 继承站点品牌
date: 2026-08-22
status: 已被双 Brand 契约取代
---

# Topic Brand 继承站点品牌

## 问题

Topic 是博客文章的组织方式，不是像 Wiki 或 Notebook 那样拥有独立导航身份的项目。根据 `identity.icon`、`name`、`tagline` 自动生成 Topic Brand，会让普通博客文章在加入专栏后无意切换品牌。

## 方案

本方案关于“合并 Brand”的实现已被 Region/Widget 双 Brand 契约取代：站点与 Collection 分别产出 `site_brand`、`collection_brand`，不再互相继承或合并。Topic 仍默认选择 `site_brand`，但可通过 `leftbar.brand: collection_brand` 或 Region Widget 显式展示由 Topic `identity` 派生的 Collection Brand。

`identity.icon`、`card.cover` 等 Topic 内容字段继续服务各自组件；其中只有 `identity` 会参与 `collection_brand` 建模。

## 影响范围

- `scripts/lib/brand.js` 与 `test/brand.test.js`
- Brand / v2 schema 知识库与 `VERIFICATION.md`
- 主站 v2 spec
- 公开 Wiki 的 Topic 与侧边栏说明

不修改模板、样式、配置结构或手机端显示矩阵。
