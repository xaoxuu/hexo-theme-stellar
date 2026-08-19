---
title: 侧边栏集合组件重构
date: 2026-08-19
status: 已通过
---

# 侧边栏集合组件重构方案

## 1. 问题与目标

- 侧栏菜单、最近更新、相关内容、文档树、标签树与链接列表重复维护条目布局、状态和环境覆盖，并复用正文的 `post-list` / `post-card` 及宽泛的 `item` / `title` / `link` / `grid` 类名。
- 新增独立的 widget frame 与 collection 原语，使同一列表或网格可以放在左栏 glass、左栏 card、右栏或正文容器；允许统一间距、圆角、文字层级与 hover/active 反馈。
- 不迁移正文文章/Wiki 大卡片、标签插件网格、timeline、tagcloud、GitHub 卡片和用户卡片；不保留旧 DOM 类名或旧 linklist 隐式配置语义。

## 2. 复用基础与技术方案

### 现有能力

- 继续复用 `icon()`、`pretty_url()`、`escape_html()`、`scrollreveal()` 与 `grad-def.ejs`。
- 继续复用 `$border-bar`、`$border-card-s`、`--gap-base`、`--text-p1/p2/p3`、`--block`、`--block-border`、`--theme` 与 `x-theme-gradient()`。
- 本次重构内新增或修改的普通间距优先使用 `2 / 4 / 8 / 12 / 16 / 24 / 32px`；16px 组件内间距复用 `--gap-base`，页面级留白复用 `--gap-page`。不为数值刻度新增通用变量，不追溯未迁移的旧组件，不机械替换尺寸、描边、圆角、动画与光学对齐值。
- 保留 TOC、tagtree、搜索和侧栏开关的客户端初始化与销毁行为；本次不修改 JavaScript。

### 新增接口

- `layout/_partial/components/widget-frame.ejs`：接收 `className`、`title`、`action`、`body`、`attrs`、`reveal`，统一输出 widget header/body；空 body 返回空字符串。
- `layout/_partial/components/collection.ejs`：接收 `layout`（list/grid）、`variant`（nav/summary/icon）、`density`、`columns`、`className` 与 `items`。
- `layout/_partial/components/collection-item.ejs`：条目接收 `href`、`title` 及可选 `icon`、`prefix`、`description`、`meta`、`theme`、`active`、`className`、`before`、`after`；普通字段转义，`before/after` 只用于主题内部受信任 HTML。
- collection DOM 使用 `ui-collection` 命名空间；容器以 `data-layout` / `data-variant` / `data-density` 表达变体，条目状态使用 `is-active`。
- `.l_left`、`.l_right`、`.l_main` 分别声明 `data-ui-surface`。公共 surface 变量定义 item 默认/hover/active 背景、阴影、文字、卡片填充与密度；collection 不再通过页面位置选择器适配。

### 配置契约

- linklist 显式使用 `view: list | grid`；`columns` 仅表示 grid 最大列数；`show_title` 默认 `true`。
- Grid 以 `auto-fit/minmax` 根据可用宽度降列，标题是否显示不再由列数推断。
- 删除文档和主工程中已经不生效的 `menubar.columns`。

## 3. 影响范围

- 模板：公共组件、页面 surface 标记、menu、recent、related、tree、tagtree、linklist、TOC adapter 与开发预览 layout。
- 样式：新增 collection/surface 样式，移除已迁移组件对 sidebar `post-list` / `post-card` 与位置选择器的依赖；搜索结果接入 surface 变量。
- TOC 状态：静止激活项不使用 adapter active 背景与阴影，仅保留激活文字色和左侧指示条；激活项悬停时仍复用普通 hover 效果。该规则不改变其它 collection 的 active 令牌。
- 间距：collection 密度、文档树 section、TOC 标记/层级缩进与开发预览控件收敛到上述刻度；共享 widget header 操作按钮的 `6px/-6px` 光学对齐保持不变。
- 配置与文档：主题默认配置、知识库、主工程 widgets 配置、Stellar Wiki 与开发草稿。
- TOC 与搜索脚本只为运行时生成的列表补充 adapter 类；tagtree 与左栏滚动恢复同步到新的状态类选择器。数据、事件与浏览器交互协议保持不变，不涉及 `scripts/`、`languages/` 或依赖变更。

## 4. 验证方式

- 主工程 `npm run g` 全量构建；主题 `npm run lint`；知识库 `python3 docs/knowledge/tools/verify.py`。
- `npm run s` 打开开发草稿，检查 glass/card/sidebar/content 四种 surface、list/grid/summary/tree 以及长标题、描述、active/hover/focus 和多宽度。
- 回归首页、文章、Wiki、笔记本中的菜单、recent、related、tree、tagtree、TOC、搜索和 linklist。
- 静态搜索确认迁移组件不再依赖 `.l_left .widget...`、`.l_right .widget...` 或正文 `.post-list`。
