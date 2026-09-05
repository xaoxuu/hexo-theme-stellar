---
title: 布局系统
domain: 布局系统
tags:
  - 布局
  - shell
  - region
---

# 布局系统

Stellar v2 使用一个统一 Shell 渲染所有页面。普通 Post、Wiki、Topic、Notebook 的严格 PageViewModel 路径与其它过渡页面虽然数据来源不同，但最终都把命名槽交给同一个 `_partial/primitives/shell.ejs`，不再维护两套外层 DOM。

相关实现：

- [layout/layout.ejs](../../../layout/layout.ejs)
- [layout/_partial/primitives/shell.ejs](../../../layout/_partial/primitives/shell.ejs)
- [layout/_partial/primitives/region.ejs](../../../layout/_partial/primitives/region.ejs)
- [layout/_partial/regions/widgets.ejs](../../../layout/_partial/regions/widgets.ejs)
- [source/css/_components/layout.styl](../../../source/css/_components/layout.styl)
- [source/js/main.js](../../../source/js/main.js)

## Shell 职责

Shell 接受 `topbar`、`leftbar`、`main`、`rightbar`、`cover`、`controls` 和 `scripts` 等显式命名槽。Cover 和 Main 是页面骨架，不是用户可配置 Region；公开 Region 只有 `topbar`、`leftbar`、`rightbar`。

```text
body[data-page-*]
├── .site-background
├── #site-cover.site-cover
├── #start.site-shell[data-regions][data-drawer?]
│   ├── #topbar-region.site-region--topbar
│   ├── .site-workspace
│   │   ├── #leftbar-region.site-region--leftbar
│   │   ├── #main.site-main
│   │   └── #rightbar-region.site-region--rightbar
│   ├── .site-scrim
│   └── .site-dock
└── .site-scripts
```

Topbar 位于内容工作区之外，因此不会参与正文三列宽度计算。Scrim 和 Dock 也位于 Grid 外，不占据任何轨道。

Shell 根据最终有效 Widget 计算 `data-regions`。某个 Region 为空或其中实例都因能力不支持而被跳过时，该 Region 不生成 DOM。

## 内容工作区

`.site-workspace` 只负责 Leftbar、Main、Rightbar 三列。列组合随实际 Region 自动变化：

| 实际 Region | 桌面轨道 |
| --- | --- |
| 无左右栏 | `main` |
| 仅 Leftbar | `leftbar main` |
| 仅 Rightbar | `main rightbar` |
| Leftbar + Rightbar | `leftbar main rightbar` |

Main 使用 `minmax(200px, var(--width-main))`，会先从 720px 上限向内收缩。Leftbar 与 Rightbar 保持独立轨道，不会覆盖正文，也不会把正文推到另一侧栏下面；不得通过隐藏全局横向溢出来掩盖尺寸错误。

Leftbar 折叠为 Rail 时仍保留展开态的 Grid 轨道，只把 Region 自身缩成 64px 图标栏，因此 Main 和 Rightbar 不发生横向跳动。

## 响应式优先级

公开断点不允许用户配置：

| 视口 | Topbar | Leftbar | Main | Rightbar |
| --- | --- | --- | --- | --- |
| `> 1180px` | 已启用则显示 | 展开或 Rail | 可收缩 | 普通 Grid Item |
| `769–1180px` | 已启用则显示 | 保持同行 | 可收缩 | Drawer |
| `≤ 768px` | 已启用则显示 | Drawer | 使用完整可用宽度 | Drawer |

Drawer 复用原 Region 节点，只切换 presentation，不复制 Widget DOM。`data-drawer="leftbar|rightbar"` 记录当前临时打开的抽屉；两个 Drawer 互斥。

## 滚动与 Sticky

Rightbar 本身是普通文档流 Grid Item，会随正文一起滚动。只有 `.widget-instance--toc` 在桌面 Rightbar 中使用 Sticky；Recent、Related、Markdown 等普通 Widget 会自然离开视口。Rightbar 进入 Drawer 后，TOC 也取消 Sticky，整个 Drawer 统一滚动。

Topbar 使用 Sticky Header。Leftbar 桌面态可以 Sticky，但其高度和内部滚动被约束在可用视口内。

## 页面元数据

页面状态写入标准 `data-page-*` 属性：

| 属性 | 含义 |
| --- | --- |
| `data-page-type` | `content` 或 `index` |
| `data-page-layout` | Hexo 页面布局 ID |
| `data-article-style` | `tech` 或 `story` |
| `data-text-indent` | 存在时启用正文首行缩进 |

`#start`、`#main` 和三个 Region 的 ARIA 控制 ID保持稳定。旧的裸 `layout`、`type`、`text-indent` 属性不再输出。

## 视觉职责

`appearance.preset: card | glass | minimal | flat` 统一控制所有 Region 表面与整站视觉 Token，不改变 Shell DOM、Region 组合或首页内容。`flat` 保留原 Topbar 的半透明、轻模糊和分隔线风格。`appearance.backgrounds.leftbar` 只负责 Leftbar 的装饰背景，不再承担独立表面风格。

首页固定使用标准文章 Feed，不额外引入首页视图模式。

## 交互与无障碍

客户端通过 `data-shell-action` 事件代理处理 Drawer、Rail 和 TOC，不使用内联 `sidebar.*()`：

- 关闭的 Drawer 设置 `inert` 与 `aria-hidden`。
- 按钮同步 `aria-controls` 和 `aria-expanded`。
- 打开 Drawer 后焦点进入第一个可操作元素。
- Escape 或 Scrim 关闭 Drawer并恢复触发按钮焦点。
- Resize 会清理过期 Drawer 状态。
- `prefers-reduced-motion: reduce` 禁用 Rail 和 Drawer 过渡。

## 自定义 CSS 迁移

| 旧选择器/属性 | 新契约 |
| --- | --- |
| `.l_body` | `#start.site-shell` 与 `.site-workspace` |
| `.l_topbar` | `.site-region--topbar` |
| `.l_left` / `.l_sidebar` | `.site-region--leftbar` |
| `.l_main` | `.site-main` |
| `.l_right` / `.l_context` | `.site-region--rightbar` |
| `#l_cover` | `#site-cover.site-cover` |
| `.leftbar-container` / `.context-sticky` | `.site-region__viewport` |
| `.sidebg` | `.site-region__decoration` |
| `.main-mask` | `.site-scrim` |
| `.float-panel` | `.site-dock` |
| `[leftbar]` / `[rightbar]` | `[data-drawer="leftbar|rightbar"]` |
| `[layout]` / `[type]` / `[text-indent]` | `[data-page-layout]` / `[data-article-style]` / `[data-text-indent]` |

Region 配置、级联与 Widget presentation 见[Region 与 Leftbar 系统](sidebar-system.md)。
