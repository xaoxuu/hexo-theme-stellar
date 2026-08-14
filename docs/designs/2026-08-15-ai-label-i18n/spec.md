---
title: AI 标签文案多语言化方案
date: 2026-08-15
status: 已实施
---

# AI 标签文案多语言化方案

## 1. 问题与目标

- 现状：`article.ai_label` 各档的 `text` 直接写在 `_config.yml`，站点无法随页面语言切换，多语言站点（en / zh-TW）会显示中文文案。
- 目标：AI 标签文案改由多语言系统提供（`languages/*.yml` 的 `meta.ai_label.*`），配置只保留 `default` / `color` / `icon`。
- 成功标准：文章页在 zh-CN / en / zh-TW 语言下分别显示对应文案；配置 `text` 字段移除；缺失翻译时不渲染。

## 2. 技术方案

- `languages/zh-CN.yml`、`en.yml`、`zh-TW.yml` 的 `meta` 下新增 `ai_label` 四档文案（`manual` / `reviewed` / `polished` / `generated`）。
- `scripts/helpers/ai_label.js`：经模板 locals 的 `__()`（回退 `hexo.theme.i18n.__(hexo.config.language)`）解析 `meta.ai_label.<key>`，文案传入纯函数库渲染；翻译缺失或返回原始 key 时不渲染。
- `scripts/lib/ai_label.js`：`buildAiLabel(value, labelConfig, text, extraClass, iconHtml, noColor)`，文案改为参数传入，仍做 HTML 转义。
- `_config.yml`：移除各档 `text`，保留 `default` / `color` / `icon`，更新注释。
- 涉及文件：`languages/`、`_config.yml`、`scripts/lib/ai_label.js`、`scripts/helpers/ai_label.js`、`test/ai_label.test.js`、`docs/knowledge/`、`docs/designs/`。

## 3. 影响范围

- 对外行为：`article.ai_label` 配置不再接受 `text`；文案随语言切换；语言文件缺 key 时标签不渲染。
- 需要同步的知识库页面：`00-总览与安装配置/configuration.md`、`03-内容系统/content-overview.md`、`知识库全量.md`、`VERIFICATION.md`。
- 主工程同步：`source/wiki/stellar/advanced-settings.md`、`front-matter.md`、`docs/specs/ai-label/`。

## 4. 验证方式

- 单测更新并跑 `npm test`（文案参数传入、转义、缺失返回空）。
- `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建，抽查 zh-CN / en 语言下的文章页标签。
