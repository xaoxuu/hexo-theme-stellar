---
title: v2 Site Shell 与 Layout 最终收敛
date: 2026-08-24
issue: 726
---

# 规格

## 问题

当前 Site Shell 与 Layout 已进入八根配置，但 Brand 仍允许 HTML/pipe 字符串，Footer 仍使用动态 map 与魔法条目，sidebar/tabs 还保留多余包装和弱类型。它们不是最终可维护契约。

## 接缝

- Brand 使用结构化图片、wordmark、名称、tagline 与链接；Hexo title/subtitle/avatar 只在缺省时派生。
- Menu 是有序、唯一 ID 的严格数组，active menu 在存在菜单时必须可解析。
- Footer action 是 `link|dropdown|spacer` 判别联合，section item 是 `{title,url}`。
- 13 个 Profile 保持固定；sidebar 直接承载左右 Widget 数组，tabs 使用对象数组，home comments 固定对象。
- Schema、doctor、Reference、Blueprint、ViewModel、EJS 与主站真实覆盖一次切换，不保留旧字段读取。

## 影响范围

- 配置目标、Schema、解析器、Reference、Blueprint 与 doctor。
- Brand/Menu/Footer helper、模型、模板、Widget resolver 和页面生成器。
- 主题默认配置、内部知识库、主站 `_config.stellar.yml` 与公开 Wiki。

SEO、preconnect、内容字段、Extension 和视觉契约均不在本 issue 修改。

## 复用

- 复用现有声明式 Schema、来源化诊断、深冻结和 Reference 生成入口。
- 复用现有 Brand resolver、Widget 注册数据、Markdown renderer、safe URL 与 icon helper。
- 不建立第二套配置解析或运行时 fallback。

## 验收

- 正反 Schema、级联、派生默认、菜单引用、联合类型与模板消费测试通过。
- 首页、文章、Wiki、Topic、Notebook、404 的 Brand/Menu/Footer/sidebar 输出可复查。
- 主题 `npm run check` 与主工程 `npm run g` 通过。
