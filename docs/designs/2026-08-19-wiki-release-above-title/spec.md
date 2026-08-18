---
title: Wiki Hero 版本标签移至标题上方
date: 2026-08-19
status: 已实施
---

# Wiki Hero 版本标签移至标题上方方案

## 1. 问题与目标

Wiki Hero 的最新版本标签位于站点导航内，但它属于项目信息，与站点标题并列会混淆信息层级。

目标：

- 将 `.wiki-cover-release.ds-ghinfo` 移到 `.cover-title` 正上方；
- 保留既有 GitHub tag 请求、加载状态、链接和取色样式；
- 站点导航只保留返回首页的站点标题。

## 2. 技术方案

- `layout/_partial/cover/wiki_cover.ejs`：把版本链接从 `.wiki-navbar` 移入 `.wiki-cover-intro`，并在标题前渲染。
- `source/css/_components/partial/cover.styl`：移除仅为导航与版本标签并列而设置的 flex 布局和间距；版本标签的原样式继续复用。
- `docs/knowledge/03-内容系统/wiki-docs.md` 与 `docs/knowledge/VERIFICATION.md`：同步当前结构事实。

## 3. 影响范围

- 仅影响配置了 `repo` 的 Wiki 项目首页 Hero。
- 不改变数据服务、API、配置、文案或其他 `ds-ghinfo` 组件。
- 无需修改主工程面向用户的 Wiki 文档。

## 4. 验证方式

- 检查渲染源码中版本标签位于 `.cover-title` 之前。
- 检查版本标签的 `ds-ghinfo`、请求属性与加载类未变。
- 执行知识库硬事实核查，并在 Wiki Hero 页面预览结构。
