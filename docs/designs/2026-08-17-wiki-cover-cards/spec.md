---
title: Wiki 封面卡片布局改造方案
date: 2026-08-17
status: 已通过
---

# Wiki 封面卡片布局改造方案

## 1. 问题与目标

Wiki 索引页现为横向图标与文字布局，无法充分利用项目封面。改为统一的封面卡片，保留项目关键信息并复用文章 hero 卡片的渐变模糊视觉。

## 2. 技术方案

- `wiki_card.ejs` 输出独立的 `wiki-card` / `wiki-card-cover` / `wiki-card-info` 结构与项目识别底栏；仅 `cover` 用作卡片背景，未配置时保留纯色空背景；营销标题优先 `headline`，为空回退 `title` 再回退 `name`，字号为 `1.25rem`、字重为 `700`；项目 `icon` 缺失时使用内置 Solar `default:documents`，副标题沿用 `subtitle()` 的 ` | ` 左侧优先规则。
- `wiki-card.styl` 提供响应式铺满容器的多列、固定 3:4 的独立竖版封面布局，不调用 `cover-overlay()`；信息层仅以 `left/right/bottom: 0` 按内容高度贴底，通用内边距拆分为上方文案区与全宽项目底栏，后者使用 `rgba(black, .1)` 轻微遮罩。同图模糊层与主题色蒙版仅在封面原图加载且 `adaptive-text` 的平均主题色结果（含失败回退）确定后才淡入，避免默认主题色闪现；图片失败时降级为空封面。无封面卡片 hover 使用 `--block-border`，有封面 hover 边框同源但明度提高 20 个点并跟随全局连续曲率；标签、平台、star 统一复用 `.wiki-meta` 的主题文字样式与 `.5rem 1rem` 间距，平台无背景、无边框，项目区无顶部边框；项目图标使用 30% 圆角和 `var(--block)` 背景。
- Wiki 数据支持可选 `available` 字符串，输出由 `meta.available` 多语言键提供的“适用于”与内置 `default:platforms` 多设备图标；存在 `repo` 时由 `ghinfo` 数据服务填充 `stargazers_count`，成功前和失败后隐藏热度项，成功时使用内置 Solar `default:fire` 图标。

## 3. 影响范围

- 主题模板、列表样式与 `ghinfo` 服务。
- 用户站点 Wiki 数据可新增 `available`；未配置时不显示适用范围。
- 同步 `docs/knowledge/03-内容系统/` 与主工程 Stellar Wiki 文档。

## 4. 验证方式

- 主题 `npm run check`。
- 主工程 `npm run g`。
- 检查 Wiki 总列表、标签筛选、移动端、封面/图标回退和 GitHub 请求失败。
