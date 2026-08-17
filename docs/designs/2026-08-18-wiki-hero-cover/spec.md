---
title: Wiki Hero 封面方案
date: 2026-08-18
status: 已实施
---

# Wiki Hero 封面方案

## 目标

将 Wiki 项目首页从单列启动封面升级为双栏 Hero，支持可复用的项目动作、安装指令和产品预览。

## 技术方案

- 项目 YAML 的 `background` 取 URL 图片或 `galaxy` Canvas 背景。
- 静态图在底部 20% 使用同图模糊层与站点背景色渐隐，避免与正文突变。
- 复用 GitHub 数据服务的 tags 请求取得最新版本；终端切换与复制、星空背景由 `main.js` 按页面元素初始化。

## 影响范围

- `layout/_partial/cover/wiki_cover.ejs`
- `source/css/_components/partial/cover.styl`
- `source/js/main.js`、`source/js/services/ghinfo.js`
- Wiki 使用文档与知识库。
