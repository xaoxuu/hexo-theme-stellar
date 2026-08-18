---
title: 网站卡片复用 siteinfo 补充圆形图标
date: 2026-08-18
status: 已实施
---

# 网站卡片复用 siteinfo 补充圆形图标

## 1. 问题与目标

- `{% sites %}` 条目缺少 `icon` / `avatar` 时，卡片下方信息区只能显示默认图标。
- 复用现有 `siteinfo` API 异步获取图标；不自动获取网站截图。

## 2. 技术方案

- `sites` 标签和动态 sites 服务仅为缺少图标的卡片写入 siteinfo 请求地址。
- `siteinfo.js` 增加网站卡片图标填充，并通过 `stellar:sites-ready` 处理动态卡片加载时序。
- 已有图标、默认封面、卡片布局及失败兜底保持不变。

## 3. 影响范围

- `source/js/services.js`、`source/js/services/siteinfo.js`、`source/js/services/sites.js`
- `scripts/tags/lib/sites.js`、sites 与 siteinfo 知识库

## 4. 验证方式

- 本地模式、动态 API 模式分别确认已有图标和缺失图标场景。
- 执行主题检查及主工程 `npm run g` 全量构建。
