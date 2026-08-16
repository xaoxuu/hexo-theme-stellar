---
title: 修复 timeline 组件页脚评论图标尺寸异常
date: 2026-08-16
status: 已通过
---

# 修复 timeline 组件页脚评论图标尺寸异常 方案

## 1. 问题与目标

- 问题：`_data/icons.yml` 中 `weibo:comment`（含 `weibo:repeat/like`）是固定 `width="32" height="32"` 的内联 SVG，`source/js/services/timeline.js` 将其原样注入页脚 `.footer .item`，而 `source/css/_components/tag-plugins/timeline.styl` 未约束该处 `svg` 尺寸，导致图标按 32px 渲染，与 `$fs-13`（13px）文字及 emoji 反应不一致。
- 目标：评论图标尺寸恢复正常，与页脚文字/emoji 视觉协调，文章内与侧边栏 widget 场景统一生效。
- 成功标准：`.tag-plugin.timeline[data-api] .body .footer .item svg` 计算尺寸为 1em（13px），徽章高度不再被图标撑大；`npm run g` 构建通过。

## 2. 技术方案

- 在 `source/css/_components/tag-plugins/timeline.styl` 的 `.tag-plugin.timeline[data-api] .body .footer .item` 块内新增 `svg { width: 1em; height: 1em }`，沿用主题「图标 1em、跟随字号」的既有约定（与 `func.styl` 复制按钮、`_common/svg.styl` 的 `svg.icon` 一致）。
- 一处修复同时覆盖：timeline 评论图标、weibo 数据服务（`ds-weibo`，与 timeline 共用 footer DOM）的转发/点赞/评论图标，以及文章内与侧边栏 widget 两种场景。
- 不改 `_data/icons.yml`（保留图标 32px 自然尺寸，尺寸约束由消费组件 CSS 负责）；不改 `source/js/services/timeline.js`。
- 涉及文件：`source/css/_components/tag-plugins/timeline.styl`、`docs/designs/2026-08-16-fix-timeline-footer-icon-size/`。

## 3. 影响范围

- 对外行为：仅修正页脚图标渲染尺寸，无配置项、无接口变化。
- 知识库：`docs/knowledge/04-标签插件/timeline-media-tags.md` 仅描述 footer 结构（`.footer .right`——反应、评论），未描述图标尺寸，无需同步。
- 主工程 wiki：`source/wiki/stellar/` 相关文档未描述该图标尺寸，无需同步。

## 4. 验证方式

- 主工程执行 `npm run g` 全量构建。
- `npm run s` 本地预览，用复现场景（文章页 `20221217 - 博客入门：每个人的独立博客.md` 的 timeline 标签）确认评论图标计算尺寸为 13px、与文字/emoji 基线对齐、徽章高度正常；抽查侧边栏 timeline widget（`source/_data/widgets.yml`）。
- 纯 CSS 改动，不涉及纯函数，无需新增单测。
