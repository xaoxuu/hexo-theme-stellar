---
title: Wiki 首页链接移除 start 锚点方案
date: 2026-08-18
status: 已实施
---

# Wiki 首页链接移除 start 锚点方案

## 1. 问题与目标

Wiki 项目列表卡片使用项目首页的纯路径，但左栏文档树的项目首页条目额外附加 `#start`。同时，初始化脚本会把不带 hash 的 Wiki Hero 首页自动滚到 `#start`。统一入口和初始位置：访问项目首页时 URL 不携带锚点，页面默认停在顶部。

## 2. 技术方案

- 删除 `tree.ejs` 对 `is_homepage` 条目的 `#start` 拼接，保留 `pretty_url()` 生成的规范化路径。
- 删除 `defines.ejs` 中无 hash 时的 Wiki Hero 特殊滚动；无 hash 一律滚到页面顶部。
- 保留 Wiki Hero “文档”按钮的 `#start`，它仍是明确的页内正文定位操作。

## 3. 影响范围

- 影响 Wiki 内容页左栏文档树中的项目首页链接，以及 Wiki Hero 首页的无 hash 初始滚动位置。
- 不新增配置项，不影响卡片、其它文档页链接或 Hero 按钮。
- 同步主题知识库、核查记录与主工程 Stellar Wiki 文档。

## 4. 验证方式

- 在浏览器中验证无 hash 初始打开停在页面顶部，显式 `#start` 仍定位正文。
- 静态检查首页与非首页条目生成的 href。
- 在主工程运行 `npm run g`，确认 Wiki 页面渲染正常。
