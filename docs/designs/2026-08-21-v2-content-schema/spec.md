---
title: Stellar v2 内容配置体系
date: 2026-08-21
status: 已通过
---

# Stellar v2 内容配置体系方案

## 1. 问题与目标

现有 `icon`、`cover`、`coverpage`、`background`、`animation` 以及页面级 `banner`、`header`、`leftbar` 等字段混合了资源类型、组件位置和历史命名，必须依靠额外说明才能判断生效位置。v2 以组件边界重新组织公开配置，并在构建期严格校验。

成功标准：Wiki、Topic、Notebook 与页面共享一致的组件词汇；不保留 v1 别名；错误配置包含文件与字段路径；主题不存在跨角色资源兜底。

## 2. 技术方案

- 新增可复用的内容配置 schema 和解析入口，在生成 Wiki/Topic/Notebook 数据树之前校验项目数据，在渲染前校验页面 Front Matter。
- 集合采用 `identity`、`card`、`hero`、`sidebar.left/right`；页面采用 `collection`、`card`、`banner`、`sidebar.left/right`、`navigation`、`article`、`footer`、`comments`、`visibility`、`listing`。
- 站点、页面和集合统一使用 `brand` / `sidebar.left.brand`。`brand.image` 是包含 `src`、`style`、可选 `url/background` 的原子对象，覆盖时不继承上级图片子字段。
- Brand 图片提供 `avatar`、`icon`、`plain` 三种样式：头像正圆裁剪，图标使用卡片小圆角，透明原图不裁剪、不设圆角且禁止背景；未显式配置背景时始终透明。
- Wiki / Notebook 自动 Brand 只从 `identity.icon`（或 `theme.default.project`）取得图片，不读取 `card.cover`；Topic 默认直接继承站点 Brand，仅在显式配置 `sidebar.left.brand` 时覆盖。页面覆盖、集合覆盖、类型默认和全局值按顺序合并。
- 删除 `navigation.mobile_header`。手机端 Brand 只根据页面类型显示，不提供页面或集合开关。
- Stellar YAML 字段使用 snake_case，JS 符号使用 camelCase，CSS 与文件名使用 kebab-case。
- `hero.background.effect.options` 和评论服务配置是第三方协议边界，保持上游字段，不参与 Stellar 命名转换。Galaxy 支持的参数按固定的 React Bits 版本白名单校验。
- 保留有文档依据的同角色默认：`headline -> name`、卡片说明 `tagline -> description -> excerpt`、身份图标使用主题默认。删除 `cover -> icon` 等跨角色默认。
- `visibility.listed` 只控制博客、Wiki、Topic、Notebook 的聚合入口，`visibility.searchable` 只控制搜索索引，两者互不隐式联动。
- 复用现有事件系统、数据树构建器、模板 partial、搜索生成器、SEO helper 与评论 partial；不新增依赖。

## 3. 影响范围

- 数据处理：配置事件、Wiki/Topic/Notebook 构建器、搜索索引与严格校验。
- 渲染：集合卡片、Hero、文章 Banner、左右侧栏、面包屑、评论、文章页脚与 SEO。
- 客户端：Galaxy 参数适配；暂停、销毁和 reduced-motion 行为保持现状。
- Brand：严格校验、解析 helper、统一 partial、DOM class 与 Stylus；删除旧 Logo 解析和 Markdown 链接语法。
- 文档：配置系统、Wiki/Topic/Notebook、页面 Front Matter、侧栏、SEO 与评论页面。

## 4. 验证方式

- schema 单测覆盖有效配置、旧字段、未知字段、错误类型、第三方命名和错误来源。
- Brand 单测覆盖三种样式、图片原子替换、集合 URL、默认项目图、Markdown 链接拒绝和手机端页面矩阵；静态测试约束模板与样式 class。
- 搜索与聚合测试覆盖 `listed/searchable` 的四种组合。
- `npm run check`、知识库核查和主工程 `npm run g` 全量构建。
- 抽查首页、文章、Wiki、Topic、Notebook 与错误页。
