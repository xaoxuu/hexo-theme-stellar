---
title: 文章 AI 成分标签（ai_label）
date: 2026-08-14
status: 已实施
---

# 文章 AI 成分标签（ai_label）方案

## 1. 问题与目标

- 为文章增加「AI 成分」标记，区分纯手工 / AI 润色 / AI 生成
- 文案与颜色由 YAML 配置驱动（主题默认值 + 站点可覆盖），front-matter 只写稳定的英文键
- 不设置 `ai` 字段的文章不渲染任何标签，历史文章零变化

## 2. 技术方案

- 新增配置 `article.ai_label`（默认在主题 `_config.yml`，站点可在 `_config.stellar.yml` 覆盖）：`manual`（纯手工，绿）、`polished`（AI 润色，橙）、`generated`（AI 生成，红），每档含 `text`、`color` 与可选 `icon`（渲染在文案前）
- 文章 front-matter 新增可选字段 `ai_label: manual | polished | generated | reviewed`；未设置时取 `article.ai_label.default`（为空则不渲染）；值未知时构建期 `console.warn`，缺失 / 无配置 / 空文案均不渲染
- 新增纯函数 `scripts/lib/ai_label.js`（颜色规范化 + HTML 生成，文案转义）与 helper `scripts/helpers/ai_label.js`
- 文章页 `layout/_partial/main/navbar/article_banner.ejs`：面包屑行最右、阅读时长右侧（无阅读时长时自身靠右）
- 文章列表卡片不渲染 AI 标签
- 样式：`source/css/_components/partial/bread-nav.styl` 增加 `.ai-label` 彩色文字（无背景、nowrap）；banner 含图片时不用配置色，继承 `--text-banner` 默认文字色
- 不需要 `languages/`（文案来自 yml）与 `source/js/`

## 3. 影响范围

- 新增配置键 `article.ai_label` 与 front-matter 字段 `ai`（均可选，默认行为不变）
- 新增文件：`scripts/lib/ai_label.js`、`scripts/helpers/ai_label.js`、`test/ai_label.test.js`
- 修改：`_config.yml`、`article_banner.ejs`、`post_card.ejs`、`bread-nav.styl`
- 同步知识库：`configuration.md`、`content-overview.md`、`post-lists-cards.md`；`VERIFICATION.md` 登记
- 主工程同步：`source/wiki/stellar/advanced-settings.md`、`front-matter.md`、`docs/specs/ai-label/`

## 4. 验证方式

- 单测：`test/ai_label.test.js`（三档值、缺 `#` 补全、未知值 / 缺失 / 空文案、HTML 转义、extra class、icon 渲染）
- 主题仓库 `npm run check` + `python3 docs/knowledge/tools/verify.py`
- 主工程 `npm run g` 全量构建；本地检查文章页与列表卡片渲染、未标记文章不显示
