# 侧栏高亮项顶部光照

## 1. 背景

侧栏导航 `.nav-item` 激活或悬停时使用 `--bg-a50` 半透明背景高亮，但背景本身没有层次感。最初尝试在顶部加 1px 白色内阴影，实测浅色模式下顶部亮度差仅 +2.5，几乎不可见；改为顶部白色光照渐变后，浅色模式亮度差提升至 +11.7，深色模式 +49，光照感清晰但克制。经用户验证后，将该效果推广到左栏其它需要高亮的 item。

## 2. 方案

在 `source/css/_defines/func.styl` 新增公共 mixin `sidebar-light($bg = var(--bg-a50), ...)`：

- 浅色模式：`background: linear-gradient(180deg, rgba(white, 0.38), rgba(white, 0) 55%), $bg`，`box-shadow: inset 0 1px 0 rgba(white, 0.45)`
- 深色模式（`data-theme="dark"` 与 `prefers-color-scheme: dark` 双写）：渐变改为 `rgba(white, 0.09) → 0`，白边改为 `rgba(white, 0.1)`（约为浅色的一半）
- 不设置任何过渡/动画，hover 与 active 即时切换；不引入伪元素，`img/svg/span` 等保持原有样式

应用范围（均无动画）：

- `.nav-area .menu .nav-item` 的 `&:hover` / `&.active`（`source/css/_components/sidebar/menu.styl`，使用默认 `--bg-a50`）
- `.l_left .widget-wrapper.post-list .widget-body a` 的 `:hover` / `.active`（`source/css/_components/widgets/list.styl`，覆盖 recent / tree / related / tagtree 等左栏列表项；通用规则保留原纯色高亮）
- `.l_left .linklist .link` 的 `:hover` / `.active`（`source/css/_components/widgets/components.styl`）
- `.l_left .widget-wrapper.markdown .linklist .link:hover`（`source/css/_components/widgets/markdown.styl`，欢迎组件链接，hover 背景为 `--bg-a100`）

linklist 与 markdown linklist 的光照效果限定在 `.l_left`，右栏（如首页右栏的欢迎组件）保持原样。

## 3. 影响范围

- 主题样式文件：`func.styl`（新增 mixin）、`menu.styl`、`list.styl`、`components.styl`、`markdown.styl`。
- 对使用该主题的站点：左栏菜单、左栏列表类 widget（最近更新、页面树、相关文章、标签树、链接列表、欢迎组件链接）的 hover/active 高亮带有顶部光照；右栏不受影响。

## 4. 验证

- `npm run g && npx gulp minify` 全量构建。
- `npm run s` 本地预览：浅色/深色模式下分别检查左栏菜单与各列表项的激活/悬停状态——顶部光照可见但不过曝，文字/图标对比度不受影响，active 指示（圆点等）保持原样，右栏组件无变化。
