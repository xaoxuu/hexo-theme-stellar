---
title: Topic Brand 继承站点品牌
date: 2026-08-22
status: 已完成
---

# Topic Brand 继承站点品牌

## 问题

Topic 是博客文章的组织方式，不是像 Wiki 或 Notebook 那样拥有独立导航身份的项目。根据 `identity.icon`、`name`、`tagline` 自动生成 Topic Brand，会让普通博客文章在加入专栏后无意切换品牌。

## 方案

- 复用现有 `resolveBrand()`、根字段合并和图片原子替换规则。
- 自动 Brand 只适用于 Wiki 与 Notebook。
- Topic 默认直接使用全局 `brand`，忽略 Topic 的 `identity`、文案和路由。
- Topic 显式配置 `sidebar.left.brand` 时，仍按集合覆盖层合并；页面 `sidebar.left.brand` 保持最高优先级。
- `identity.icon`、`card.cover` 等 Topic 内容字段继续服务各自组件，不参与 Brand 默认解析。

## 影响范围

- `scripts/lib/brand.js` 与 `test/brand.test.js`
- Brand / v2 schema 知识库与 `VERIFICATION.md`
- 主站 v2 spec
- 公开 Wiki 的 Topic 与侧边栏说明

不修改模板、样式、配置结构或手机端显示矩阵。
