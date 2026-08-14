---
title: 1.40.0 issue 修复与低成本功能批次
date: 2026-08-14
status: 已通过
---

# 1.40.0 issue 修复与低成本功能批次

## 1. 问题与目标

基于 2026-08-14 的 issue 三态清理结果，将 9 个已确认 bug、4 个低成本功能与 #594 收尾合并为一个版本（1.40.0）交付：

- bug：#401 timeline 标题 markdown、#564 三级分类、#523 链接激活判断、#593 topbar 发光、#663 左栏亮暗不同步、#599 iOS 悬浮控件、#598 artalk 锚点、#630 waline 最近评论、#668 memos 新接口
- 功能：#302 阅读时长、#466 表格标签、#580 卡片标签、#602 tip 注解
- 收尾：#594 new-note 命令已验证存在，date 格式对齐

成功标准：全部 bug 修复可复现验证通过；新功能按配置开箱即用；`npm run check` 与主工程 `npm run g` 通过；1.40.0 正常发版。

## 2. 技术方案

### 模板与标签层
- `#401`：`scripts/tags/lib/timeline.js` 的 `layoutNodeTitle()` 与正文一致，用 `ctx.render.renderSync({text, engine:'markdown'})` 渲染并去除换行。
- `#564`：`layout/categories.ejs` 改为基于 `site.categories` 的 parent 关系递归构建嵌套树，兼容 2/3/4 级。
- `#523`：验证 `pretty_url`（`normalize_path` 已去除 `.html`/`index.html` 后缀）已兼容 `trailing_index`，补单测确认；不重复改代码。

### 样式层
- `#593` / `#663`：`func.styl`（`newblur`/`sidebar-light`/`bar-item-active` 等）、`sidebar.styl`、`search.styl` 中按 `prefers-color-scheme` 生效的暗色块改为 `:root:not([data-theme]) &` + media 兜底，显式 `data-theme` 时只跟随主题开关。
- `#599`：`device.styl` `.float-panel` 补充 `align-items: center` 并稳定按钮居中，修复 iOS Safari 下按钮在玻璃椭圆框内不对齐。

### 评论与动态数据
- `#598`：`layout/_partial/comments/artalk/script.ejs` 初始化后清理 `?atk_*` 查询参数，避免与目录定位冲突。
- `#630`：`source/js/services/waline_latest_comment.js` 兼容数组与 `{data: []}` 两种返回。
- `#668`：`source/js/services/memos.js` 新增 v1 分支（识别 `data.memos` + `createTime`），新增对应构建函数，旧分支不变。

### 低成本功能（零新增运行时依赖）
- `#302`：新增阅读时长 helper，文章页面包屑行右侧显示字数与预计阅读，配置 `article.reading_time`（默认关闭）。
- `#466`：新增 `{% table style:scroll|wrap|compact %}` 标签，注册到 `scripts/tags/index.js`，新增样式。
- `#580`：`post_card.ejs` 展示文章标签（最多 5 个），配置 `article.card_tags`（默认关闭）。
- `#602`：新增 `{% tip text:... %}词{% endtip %}` 气泡注解标签，纯 CSS（hover / focus 显示）。

### 收尾
- `#594`：`scripts/commands/new-note.js` 生成 front-matter 的 date 对齐为 `YYYY-MM-DD HH:mm`。

## 3. 影响范围

- 对外行为：新增 `article.reading_time`、`article.card_tags` 配置；新增 `table`、`tip` 标签；`prefers-color-scheme` 暗色兜底仅在不设置 `data-theme`（auto）时生效。
- 兼容性：全部向后兼容；`article.pin_style` 等既有配置不受影响。
- 需同步文档：`docs/knowledge/00-总览与安装配置/configuration.md`、`04-标签插件/`、`06-数据服务与组件/`、`VERIFICATION.md`；主仓库 `source/wiki/stellar/` 的 theme-settings / tag-plugins / comments 页面。

## 4. 验证方式

- 单测：path_utils（#523）、categories 树（#564）、waline payload（#630）、memos 识别（#668）、timeline markdown（#401）、reading_time（#302）。
- `npm run check`（lint + 单测 + 幽灵依赖 + 知识库核查）与主工程 `npm run g` 全量构建。
- 手动验收：artalk 邮件链接目录跳转、topbar/左栏亮暗切换、iOS 悬浮控件、三种表格样式、卡片标签、tip 悬浮、阅读时长数值。
- 受影响页面类型：首页、文章页、分类页、wiki 页、笔记页。
