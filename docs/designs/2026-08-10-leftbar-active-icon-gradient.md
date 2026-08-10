# 左栏激活彩色图标使用主题色渐变

## 1. 背景

菜单栏（`layout/_partial/sidebar/menu.ejs`）的激活/悬停图标与圆点已支持可配置角度的主题色渐变（commit `3f6f76b`）：每个导航项内嵌一个隐藏 SVG `<linearGradient>`，通过 `--item-grad:url(#...)` 与 `fill:var(--item-grad)` 让 `currentColor` 图标呈现「右上角淡色 → 底部中间主色」的渐变。

但左栏其它需要显示彩色图标的场景仍是纯 `var(--theme)` 色，视觉上与菜单栏不一致：

- wiki 目录树激活项右侧的书签图标（`layout/_partial/widgets/tree.ejs`）
- 专栏相关文章激活项右侧的书签图标（`layout/_partial/widgets/related.ejs`）
- 链接列表激活项右侧的书签图标、以及激活/悬停时的彩色 item 图标（`layout/_partial/widgets/components/link.ejs`）

## 2. 方案

### 2.1 提取可复用的渐变定义 partial

新增 `layout/_partial/sidebar/grad-def.ejs`，接收参数 `id`，输出隐藏 SVG 渐变定义：

```ejs
<svg class="grad-def" width="0" height="0" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="{id}" x1/y1/x2/y2 ...>
      <stop offset="20%" style="stop-color:var(--item-theme-light)"/>
      <stop offset="60%" style="stop-color:var(--item-theme)"/>
    </linearGradient>
  </defs>
</svg>
```

- 角度换算逻辑（`style.gradient.angle`，CSS 角度 0=向上、顺时针，默认 225deg）从 `menu.ejs` 原样移入该 partial，保证菜单栏与左栏共用同一套换算。
- 颜色仍使用 CSS 变量 `--item-theme` / `--item-theme-light`（`:root` 默认等于站点主题色），同一份定义可被任意元素复用。
- `menu.ejs` 改为调用 `partial('grad-def', {id: 'menu-grad-' + item.id})`，渲染结果与现状完全一致。

### 2.2 左栏输出共享渐变定义

`layout/_partial/sidebar/index_leftbar.ejs` 的 `layoutWidgets()` 在 `.widgets` 容器顶部输出一份共享定义：

```ejs
el += partial('grad-def', {id: 'leftbar-active-icon-grad'})
```

### 2.3 样式接入

在左栏列表/链接项的 hover 与 active 状态设置 `--item-grad`，并对 `currentColor` 子元素应用渐变填充：

- `source/css/_components/widgets/list.styl`：`.l_left .widget-wrapper.post-list .widget-body a`（覆盖 wiki 目录树、专栏相关文章等 post-list 场景）
- `source/css/_components/widgets/components.styl`：`.l_left .linklist .link`（覆盖链接列表激活书签与彩色 item 图标）

```styl
&:hover, &.active
  --item-grad: url(#leftbar-active-icon-grad)
  > svg [fill="currentColor"]
    fill: var(--item-grad)
  > svg [stroke="currentColor"]
    stroke: var(--item-grad)
```

`svg.active-icon { color: var(--theme) }` 保持不变，作为未接入渐变场景的回退色。

## 3. 影响范围

- 主题模板：`menu.ejs`（改用 partial）、`index_leftbar.ejs`（输出共享渐变定义）、新增 `grad-def.ejs`。
- 主题样式：`list.styl`、`components.styl`。
- 使用该主题的站点：左栏 wiki 目录树、专栏相关文章、链接列表的激活书签与彩色图标改为主题色渐变；菜单栏渲染结果不变；右栏与未接入场景不受影响。

## 4. 验证

- `npm run g && npx gulp minify` 全量构建通过。
- `npm run s` 本地预览：wiki 内容页（目录树激活书签渐变）、专栏文章页（相关文章激活书签渐变）、链接列表页（激活书签与 item 图标渐变），浅色/深色模式均正常。
