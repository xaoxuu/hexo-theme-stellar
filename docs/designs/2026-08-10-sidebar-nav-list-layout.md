# 左栏导航列表化与顺序调整

## 1. 背景

xaoxuu.com 左栏顶部固定区域当前顺序为 logo → 导航区（多列宫格）→ 搜索条。用户希望：

1. 导航区改为一行一条的列表样式（不再支持宫格布局）；
2. 导航区放到搜索条下方（logo → 搜索条 → 导航区）；
3. wiki 内容页隐藏导航区，且隐藏行为由每个 wiki 定义内的配置参数控制（默认显示）；wiki 列表页不隐藏。
4. 恢复旧版 wiki 侧边栏的「← 所有项目」返回按钮（旧版在 2024-01 sidebar refactoring 中被移除），所有 wiki 内容页默认显示，可通过开关关闭。

## 2. 方案

### 配置

- `menubar` 移除 `columns`，导航区统一为列表样式，不再有宫格/列表双布局。
- wiki 内容页默认隐藏导航区；`page.menu` 或 wiki 定义（`_data/wiki/{id}.yml`）的 `menu: true` 时显示。wiki 列表页（`index_wiki`）不受此参数影响，始终显示。

### 模板（layout/_partial/sidebar/index_leftbar.ejs）

- 搜索条从 `layoutWidgets()` 中拆出为 `layoutSearch()`。
- 输出顺序统一为：`layoutLogo()` → `layoutSearch()` → `layoutNavArea()` → `layoutWidgets()` → `layoutFooterDiv()`。
- `layoutNavArea()` 中：wiki 内容页（`page.wiki`）默认不输出导航区，`page.menu !== true && wiki?.menu !== true` 时返回空（`wiki = theme.wiki.tree[page.wiki]`；wiki 列表页无 `page.wiki`，不受影响）。

### 返回按钮（layout/_partial/sidebar/logo.ejs）

- wiki 内容页（`page.wiki`）在侧边栏 logo 上方渲染 `<a class="wiki-home cap">`：左箭头图标（`default:arrow-left`）+ `btn.all_wiki`（所有项目），链接到 `theme.site_tree.index_wiki.base_dir`（wiki 列表页）。
- 开关 `wiki_home`（page front-matter 优先，其次 wiki 定义 `_data/wiki/{id}.yml`）：`false` 时隐藏，默认 `true` 显示。
- wiki 列表页（`index_wiki`）、非 wiki 页面不渲染。

### 返回按钮样式（source/css/_components/sidebar/logo.styl）

- `.wiki-home`：顶部间距 `var(--gap-max)`，与 logo 区水平对齐；`--text-p2` 配色，hover 变 `--text-p1`；图标 `0.9em`。
- `.l_left .wiki-home + .header`：返回按钮下方 logo 间距 `0.5rem`（覆盖 `.l_left .header` 默认 `--gap-max` 顶部间距）。

### 样式（source/css/_components/sidebar/menu.styl）

- `.nav-area .menu` 改为单列 flex；
- `.nav-item` 改为横向行：图标左、文字右、左对齐、`min-height` 压缩、去掉居中的 column 布局；
- 未激活项统一使用 `--text-p1`，通过 `!important` 覆盖内联主题色；激活/悬停恢复各自主题色。
- 激活项使用左侧竖条指示 + 背景高亮。

### 布局间距（search.styl / sidebar.styl）

搜索条成为 `.leftbar-container` 直接子元素，需要横向边距与相邻间距；`.nav-area`、`.widgets` 的间距相应适配，保证搜索条、导航、组件区衔接自然。

## 3. 影响范围

- 主题导航区统一为列表样式，`menubar.columns` 不再生效，既有使用宫格布局的站点会变为列表样式（行为变更，需在发版说明中注明）。
- wiki 内容页默认隐藏导航，`menu: true` 时显示，wiki 列表页始终显示。
- 搜索 DOM 结构与 JS 选择器不变，仅顺序调整。

## 4. 验证

- `npm run g && npx gulp minify` 全量构建。
- `npm run s` 本地预览首页、文章页、wiki 内容页、wiki 列表页。
- 检查搜索输入、结果展示、无结果提示。
