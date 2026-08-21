---
title: Brand 头像光环与 Topic 身份图回归修复
date: 2026-08-22
status: 已完成
---

# Brand 头像光环与 Topic 身份图回归修复

## 问题

1. `brand-image--avatar img` 的带引号 `calc()` 被浏览器判为无效值，图片保持 48×48 后再叠加 2px margin，图片中心相对光环向右下偏移 2px。
2. 主站 v2 数据迁移把 Topic 旧 `icon` 机械写入 `identity.icon`；这些资源与 `card.cover` 相同，导致专栏文章 Brand 把封面当成身份图显示。

## 方案

- 复用现有 48×48 `.brand-image` wrapper 和 2px 光环留白；头像图片改用绝对定位 `inset: 2px`，不再依赖 margin 与字符串形式 `calc()`。
- Brand resolver 保持既定边界：只读取 `identity.icon`，缺失时使用 `theme.default.project`，不读取 `card.cover`。
- 删除主站 Topic 配置中由迁移误判产生的 `identity.icon`，保留 `card.cover` 和 Hero 背景原角色。
- 增加头像层中心定位静态测试，并在验证清单记录 Topic 数据与最终 HTML 审计。

## 影响范围

- `source/css/_components/sidebar/brand.styl`
- `test/brand_markup.test.js`
- 主站 `source/_data/topic/*.yml`
- Brand 知识库与 `VERIFICATION.md`

公开配置契约不变，无需兼容旧字段或修改公开 Wiki。
