---
title: 列表页置顶内容轮播
date: 2026-08-12
status: 已实施
---

# 列表页置顶内容轮播 方案

## 1. 问题与目标

当前置顶（`sticky`）仅作用于博客文章：hexo-generator-index 把置顶文章排到首页列表顶部，列表内以 pin 图标标记。没有统一的“置顶展示位”，wiki / 专栏也没有置顶机制。

目标：在所有带 `navbar top` 的列表页上方预留通用置顶位，自动轮播置顶内容（横幅 Banner 风格），无置顶内容时不占位；轮播进度按内容类型分组缓存到 localStorage，切换导航 tab 或浏览器标签页不重置。

成功标准（可验收）：

- 首页 / 归档 / 标签 / 分类 / 专栏 / 自定义 nav_tabs 页、wiki 全量页与 tag 筛选页（含分页页）在存在置顶内容时，navbar top 上方显示轮播。
- 博客类列表（首页/归档/标签/分类/专栏等）放置顶文章（`pin`/`sticky`），wiki 列表放置顶 wiki 项目（`pin`）。
- 无置顶内容时全站不渲染轮播，现有列表行为不变。
- 圆点可点击切换；自动播放；滚轮/触控板切换（横向 deltaX 与鼠标滚轮 deltaY 均映射，阈值 + 400ms 冷却）；触摸松手滑动；hover/focus/页面隐藏时暂停；`prefers-reduced-motion` 时不自动播放。
- localStorage 按内容类型分组缓存进度，内容或张数变化后自动失效。

## 2. 技术方案

- 新 partial `layout/_partial/main/pin_slider.ejs`：按类型收集置顶内容、渲染横幅幻灯片与分页圆点，并内联自研轮播脚本（经 `utils.initPlugin` 注册，返回清理函数）。
- 在 `nav_tabs_blog.ejs` 与 `nav_tabs_wiki.ejs` 顶部注入该 partial，自动覆盖所有渲染 navbar top 的列表页；类型由导航栏上下文判定（nav_tabs_wiki → `wiki`，其余 → `post`）。
- 置顶字段统一命名为 `pin`（`true | number`，只要设置即置顶，按数值降序排序，`true` 视作 1，0/负数同样参与），代码层兼容 `sticky` 别名（读取 `pin ?? sticky`），与笔记本逻辑一致。
- 首页第一页列表跳过置顶文章避免重复；归档/标签/分类等不按置顶排序的列表保留原状；wiki/专栏网格中 `pin` 项目仅出现在轮播。
- 新增 `source/css/_components/pin-slider.styl`：文章幻灯片完全复用列表文章卡片（`post_card`）的标记与样式（photo 卡片 / 默认卡片），唯一区别是固定宽高比（2:1）；wiki/专栏项目幻灯片保留封面横幅样式；圆点指示器、`transform: translateX` 过渡。
- 轮播进度缓存：localStorage 键 `stellar.pin-slider.<group>`（`post` 组覆盖博客与专栏，`wiki` 组独立），组内按内容指纹（类型 + 各幻灯片 href）记录各自进度。

涉及文件：

- `layout/_partial/main/pin_slider.ejs`（新增）
- `layout/_partial/main/navbar/nav_tabs_blog.ejs`、`nav_tabs_wiki.ejs`（注入）
- `layout/index.ejs`（首页第一页跳过置顶）
- `source/css/_components/pin-slider.styl`（新增）
- `_config.yml`（新增 `pin_slider` 配置）
- 主工程 `_config.stellar.yml`（开启）
- `docs/designs/2026-08-12-pin-slider/` 与 `docs/knowledge/` 同步

## 3. 影响范围

- 对外行为：新增 `pin_slider` 配置项（默认关闭）；wiki/专栏数据文件新增可选 `pin` 字段；博客文章 `pin` 作为 `sticky` 的别名被轮播读取。
- 兼容性：主题默认关闭，未配置置顶内容时无任何渲染差异；`pin`/`sticky` 均不改变 wiki/专栏现有顺序（仅在轮播启用时参与收集）。
- 需要同步的知识库页面：`00-总览与安装配置/configuration.md`、`02-布局系统/logo-navigation-headers.md`、`02-布局系统/page-templates-routing.md`、`03-内容系统/wiki-docs.md`、`03-内容系统/content-overview.md`、`05-前端交互/client-side-overview.md`，以及合并版 `知识库全量.md` 与 `VERIFICATION.md`。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）。
- 主工程 `npm run g`（hexo clean && generate && gulp minify）全量构建。
- 临时在主工程添加测试数据（文章 `sticky`/`pin`、wiki/专栏 `pin`）验证页面覆盖与交互后还原。
- 浏览器检查：自动播放、圆点点击、滚轮/触控板切换（方向/冷却/微小增量忽略）、触摸松手滑动、hover 暂停、缓存续播、深色模式、窄屏。
