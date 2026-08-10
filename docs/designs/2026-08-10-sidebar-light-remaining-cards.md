# 左栏剩余卡片补全侧栏光照效果

## 1. 背景

`sidebar-light()` mixin（`source/css/_defines/func.styl`）为侧栏 hover/active 高亮项叠加顶部白色光照渐变与高光边，此前已应用到：

- 左栏导航菜单 `.nav-item`（`sidebar/menu.styl`）
- 左栏列表类 widget（`widgets/list.styl`：recent / tree / related / tagtree 等）
- 左栏链接列表 `.linklist .link`（`widgets/components.styl`）
- 左栏 markdown 欢迎组件的链接（`widgets/markdown.styl`）

左栏仍有两类 hover/active 时使用 `--bg-a50` 纯色背景、尚未应用光照效果的卡片：

- 相关 Wiki 的 `post-card` 卡片项（`.widget-wrapper.post-card .widget-body .item`，来自 `layout/_partial/widgets/related.ejs` 的 relatedWiki 输出）
- 左上角「全部 Wiki」返回胶囊 `.wiki-home`（`sidebar/logo.styl`）

另外，widget 头部的小操作按钮 `.cap-action`（左栏 recent 的 RSS 按钮、右栏 TOC 的折叠按钮）hover 时使用纯色背景，一并复用该效果。

## 2. 方案

复用现有 `sidebar-light()` mixin，仅在 `.l_left` 作用域覆盖，通用规则保留原纯色高亮，与 list.styl / components.styl 的既有模式一致：

### `source/css/_components/widgets/related.styl`

- 移除 `.item` 的 `trans1 background`（光照效果按设计无过渡动画，与 `menu.styl` 中 `.nav-item` 的处理一致）
- 新增 `.l_left` 覆盖规则，`.item` 的 `:hover` / `.active` 使用 `sidebar-light()`（默认 `--bg-a50`）

### `source/css/_components/sidebar/logo.styl`

- `.wiki-home` 的 `&:hover` 由纯色 `background: var(--bg-a50)` 改为 `sidebar-light()`；默认态保持 `--bg-a50` 不变

### `source/css/_components/widgets/widgets.styl`

- `.cap-action` 的 `&:hover` 由纯色 `background: var(--bg-a100)` 改为 `sidebar-light()`（`a100` 背景下白色光照几乎不可见，故使用半透明的 `a50` 以获得可见的顶部光照）
- 过渡由 `trans2 opacity background` 调整为 `trans1 opacity`：光照效果无过渡动画（与 `menu.styl` 的 `.nav-item` 处理一致），保留图标透明度渐变

### `source/css/_components/widgets/toc.styl`

- 右栏 TOC 的 `.cap-action:hover` 与折叠态 `.collapse` 由纯色 `background: var(--block-border)` 改为 `sidebar-light(var(--bg-a50))`（与通用规则一致）

## 3. 影响范围

- 主题样式文件：`widgets/related.styl`、`sidebar/logo.styl`、`widgets/widgets.styl`、`widgets/toc.styl`
- 对使用该主题的站点：左栏相关 Wiki 卡片与「全部 Wiki」胶囊、各 widget 头部操作按钮（RSS / TOC 折叠）的 hover/active 高亮带顶部光照

## 4. 验证

- `npm run g && npx gulp minify` 全量构建
- `npm run s` 本地预览：浅色/深色模式下检查相关 Wiki 卡片、返回胶囊与 widget-header 操作按钮的悬停状态——顶部光照可见但不过曝，文字/图标对比度与布局不变
