---
title: Wiki Hero 最新版本加载状态
date: 2026-08-19
status: 已实施
---

# Wiki Hero 最新版本加载状态方案

## 1. 问题与目标

Wiki 项目首页的 Hero 在请求 GitHub tag 前会显示“正在获取最新版本”文案。该文案会造成视觉噪声，而 tag 回填时没有渐显过渡。

目标：

- 请求期间只保留版本标签的高度，避免后续显示时推动标题；
- 不显示任何文字、边框或其他视觉占位；
- 成功获取 tag 后淡入版本标签；无结果或请求失败时仍移除标签。

## 2. 技术方案

- `layout/_partial/cover/wiki_cover.ejs` 以外链按钮保留供 `ghinfo` 回填的空值容器，移除加载文案节点。
- `source/css/_components/partial/cover.styl` 为 `is-loading` 标签设置透明和禁用交互，保持原有最小高度；`loaded` 状态以 250ms `opacity` 过渡显示数据。
- `source/js/services/ghinfo.js` 继续负责在成功时从 `is-loading` 切换到 `loaded`，失败或无 tag 时移除元素；优先采用响应的 `html_url`，否则从现有 `repo` 与 tag 生成 GitHub tag 引用页，无需额外请求。

## 3. 影响范围

- 仅影响配置了 `repo` 的 Wiki Hero 最新版本标签的加载观感。
- 不改变 GitHub API、缓存、国际化配置或其他 `ghinfo` 小部件。
- 同步更新数据服务知识库和事实修正记录；站点 Wiki 现有 Hero 配置说明无需新增面向用户的配置内容。

## 4. 验证方式

- 检查模板初始 HTML 不含加载提示文本。
- 检查样式在 `is-loading` 状态保留高度且不可见、`loaded` 状态通过透明度过渡显示。
- 在 Wiki Hero 页面确认成功、无 tag 和请求失败三种路径。
