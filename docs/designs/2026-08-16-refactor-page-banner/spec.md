---
title: 页面 Banner 结构重构
date: 2026-08-16
status: 已通过
---

# 页面 Banner 结构重构方案

## 1. 问题与目标

页面顶部 banner（`layout/_partial/main/navbar/article_banner.ejs`）当前上块结构隐含、难维护：

- 面包屑、阅读时长、AI 标签挤在同一个 `#breadcrumb` 行内，右对齐靠 `margin-left:auto` 和条件 `cap right` 类实现；
- 日期信息（`#post-meta`）与面包屑共用 `.left` 容器，行与行之间没有显式边界；
- `breadcrumb: false` 时输出空的 `.top` 占位 div；
- 行内右对齐 hack 分散在模板与 CSS 两处，新增右侧元素时容易遗漏。

成功标准：

- 内容层保持上下两块（`.top` + `.bottom`），下块视觉与行为完全不变；
- 上块显式分为两行：第一行左侧面包屑、右侧阅读时长/AI 标签；第二行日期信息靠左；
- 删除 `cap right` / `margin-left:auto` hack，空 `.top` 不再输出；
- 页面 banner 继续复用 `.banner` 共享基类，视觉零回归。

## 2. 技术方案

保留 `.article-banner-wrap > .article.banner.top > .bg + .content` 与下块 `.bottom[.only-title]` 结构，仅重构上块：

```html
<div class="top bread-nav footnote">
  <div class="top-row">
    <div class="left" id="breadcrumb">…面包屑…</div>
    <div class="right">…阅读时长 / AI 标签（仅在非空时渲染）…</div>
  </div>
  <div class="meta-row">
    …dateinfo（#post-meta），靠左…
  </div>
</div>
```

- 模板：`layout/_partial/main/navbar/article_banner.ejs`
  - `layoutTop()` 替代 `layoutBreadcrumb()`；`breadcrumb: false` 时返回空串（不再输出 `<div class="top"></div>`）；
  - 阅读时长与 AI 标签统一拼入 `rightHtml`，非空才渲染 `.right`；
  - `#breadcrumb` id 移到 `.left` 上。
- 样式：
  - `source/css/_components/partial/article-banner.styl`：`.content .top` 改为纵向两行布局（`flex-direction: column`、`align-items: flex-start`），新增 `.top-row`（`space-between`、`width: 100%`）、`.top-row .right`（`flex-shrink: 0`、`white-space: nowrap`，阅读时长保留 `opacity: .8`）、`.meta-row`；
  - `source/css/_components/partial/bread-nav.styl`：删除 `#breadcrumb .reading.right` / `.ai-label.right` 的 `margin-left:auto` hack；`.left` 合并面包屑 flex 布局（`display:flex`、`align-items:baseline`、`flex:1`、`min-width:0`）；`.bread-nav` 不再承担行布局（交给 `.top-row`）。

## 3. 影响范围

- 对外行为/配置：无 front-matter、配置项、helper、语言文案变化；无 JS 依赖 `#breadcrumb` / `#post-meta`（已核实）。
- 影响页面类型：所有渲染 `article_banner` 的内容页（tech/story 文章、wiki、note、普通 page、作者归档）。
- 需要同步的知识库与文档：
  - `docs/knowledge/03-内容系统/content-overview.md`（AI 标签位置描述：面包屑行最右 → 顶部横幅第一行右侧）；
  - `docs/knowledge/VERIFICATION.md`（登记本次核查）；
  - 主工程 `source/wiki/stellar/advanced-settings.md`（阅读时长与 AI 标签位置描述）；
  - 主工程 `docs/specs/page-banner-refactor/`（方案归档）。

## 4. 验证方式

- 主工程 `npm run g` 全量构建，确认模板渲染无误；
- 页面矩阵 DOM 核对：tech 文章（含 `banner_info.color`，行 1 无右侧）、story 文章（行 1 右侧 AI 标签/阅读时长）、about（story + banner_info 头像，底部不居中）、wiki 页（行 2 仅更新日期）、作者归档（无 `.top`、底部原样）、普通 page；
- 知识库改动后运行 `python3 docs/knowledge/tools/verify.py`；
- 结果记录在 `checklist.md`。
