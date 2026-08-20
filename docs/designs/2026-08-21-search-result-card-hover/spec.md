---
title: 搜索结果可点击区域背景与 Hover 动效
date: 2026-08-21
status: 已通过
---

# 搜索结果可点击区域背景与 Hover 动效方案

## 1. 问题与目标

- 搜索结果链接使用已移除的 `--ui-summary-item-bg`，静止态背景失效。
- 本地搜索把页面标题放在链接外，Algolia 则放在链接内，两种服务的可点击范围不一致。
- 搜索结果是运行时反复替换的动态节点，现有 Card Hover 只负责挂载，无法按结果容器清理旧节点。
- 成功标准：两种服务均保持页面标题不可点击，仅章节名与摘要所在链接默认显示 surface 的玻璃高亮，并在启用 Card Hover 时只响应鼠标跟随光斑；替换或清空结果后不残留监听器。

## 2. 技术方案

### 复用现有能力

- 复用 `plugins.card_hover`、`.card-hover.card-hover--spotlight` 组合类和 `stellar.cardHover.mountAll(root)`。
- 复用搜索结果的 `.ui-collection-adapter` hover 背景/阴影令牌与 `$border-card-s`；链接静止态直接使用原 hover surface，glass 为半透明顶部光照和高光边，card 为 `var(--block)`。
- 保留页面标题、章节名、摘要、关键词高亮、跳转参数与焦点轮廓。

### 接口与生命周期

- 两种搜索服务统一输出 `li > .search-result-title + a.card-hover.card-hover--spotlight`，不声明 Tilt 修饰类。
- 新增 `stellar.cardHover.unmountAll(root)`：仅卸载 `root` 自身或后代中已挂载的卡片；省略 `root` 时卸载全部卡片，供插件销毁与媒体条件降级复用。
- 搜索结果替换或清空前对结果容器调用 `unmountAll(root)`，插入新列表后调用 `mountAll(root)`。
- 插件未加载、关闭、加载失败、粗指针或减少动态效果时，搜索仍正常渲染和跳转，仅保留静态背景。

## 3. 影响范围

- 客户端：本地搜索、Algolia 搜索与 Card Hover 生命周期。
- 样式：搜索结果链接默认显示 surface 玻璃高亮，hover 仅叠加 Spotlight，focus 保留原轮廓；标题保持在动效区域外。
- 文档：搜索功能、插件系统、前端交互知识库、核查记录与主工程 Stellar Wiki。
- 不涉及配置、语言文案、构建期脚本、数据迁移或新增依赖。

## 4. 验证方式

- 单测覆盖两种服务的 Spotlight-only DOM 契约、挂载/卸载调用和 Card Hover 容器级清理。
- 检查连续输入、清空、无结果以及插件关闭/减少动态效果降级。
- 执行 `npm run check`、知识库核查和主工程 `npm run g`。
