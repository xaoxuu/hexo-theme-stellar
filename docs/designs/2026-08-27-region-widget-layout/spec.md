---
title: Stellar v2 Region、Widget 与统一 Shell
date: 2026-08-27
status: 实施中
---

# Region、Widget 与统一 Shell

## 问题

固定三栏、Brand/Search 特殊渲染、旧 `.l_*` 外层 DOM 和 `sidebar/context` 命名无法稳定支撑 Topbar-only、Leftbar Rail 与文档三栏。把三个实际 Region 宽度直接组成并居中 Grid，还会使 Rightbar 出现或消失时 Leftbar 和 Main 一起横移；Rail 保留展开轨道则让图标栏悬在大块空白中。

## 最终契约

- 公开 Region：`topbar`、`leftbar`、`rightbar`。
- Widget presentation：`topbar`、`leftbar`、`leftbarRail`、`rightbar`、`drawer`。
- Region 接受空值、Widget 数组简写和完整对象；空值等同未配置。
- 全局 → Profile → Collection → Page 中最后一个显式 `widgets` 数组整体生效；空数组清空内容，`inherit` 已删除并严格拒绝。
- Leftbar 是固定外壳：`enabled`、`brand`、`menu` 与 `footer.actions` 按字段继承，`widgets` 只接收中间内容；`brand` 选择 `site_brand`、`collection_brand` 或 `false`，Profile、Collection 与 Page 额外以 `null` 继承。
- `site_brand` 与 `collection_brand` 是数据来源独立、共享同一 Brand partial 的系统 Widget；外观由位置和来源决定，Brand、Menu、Actions、Settings 不允许进入 Leftbar 内容数组，Search 退出 Region Catalog，改由唯一的 `site.menu.items[].type: search` 提供。
- Spacer 仅支持 Topbar，并严格按用户声明的位置分配剩余空间。
- Appearance、Region 与 Blueprint 保持正交；首页固定使用标准文章 Feed。

## Appearance 与表面能力

`appearance.preset` 只用于 Stylus 构建期选择。最终产物只导入 `card/glass/minimal/flat` 中当前一份 Appearance 实现；预设名称不进入 `<html>`、PageViewModel 或其它运行时数据。Appearance 是通用组件与插件之后的最终视觉层，负责实现稳定的语义视觉类以及 Collection、Markdown Widget、Navbar 等已有语义组件类；通用组件只保留结构、尺寸、滚动、响应式状态与可访问性。

稳定表面能力只有两种：`.ui-surface` 表示节点始终需要容器表面，挂载于 Topbar、Leftbar Surface 和其它明确表面；`.ui-drawer-surface` 表示只在对应断点进入 Drawer 后启用表面，挂载于桌面透明的 Rightbar Surface。Main 与不需要表面的节点不挂视觉类。构建期只编译当前 Appearance，它直接输出这些能力以及正文、列表、Widget、Navbar 等语义选择器的完整 CSS；未来组件通过稳定语义 class 接入当前 Appearance，不需要查询 preset，也不建立根级 Appearance 参数表。Glass 可以独有伪元素、多层阴影和滤镜，Flat/Minimal 不生成这些代码。组件只保留布局/状态所需的局部接口；真正相同的完整算法可由无参数 mixin 复用，不用“同一实现 + 不同根值”模拟差异。

Leftbar 背景由当前 Appearance 独立实现，通用 Sidebar 不生成背景或装饰层视觉。Flat、Minimal 的 Leftbar Surface 整体透明，Card 固定使用 `var(--card)` 纯色，只有 Glass 消费 `appearance.backgrounds.leftbar.type` 选择 `gradient/image`；无效字符串、空图片均静默回退默认渐变，错误类型和危险图片资源仍由 Schema 拒绝。Topbar 的 `.ui-surface` 由外层 Header 承载，内部 Viewport 继续透明；桌面 Rightbar 不绘制整块表面，进入 Drawer 后才由 `.ui-drawer-surface` 获得当前 Appearance 的面板视觉。

Region 不再接收 `surface`，页面 DOM 不生成 `data-ui-surface`。半透明、模糊等效果是独立于 Appearance 的通用能力；Dropdown、上下文菜单等浮层由自身样式调用参数化 `frosted-surface()`，不能通过局部 `glass` 值引入整套 Glass Appearance。同一构建产物只包含一种 Appearance，不提供浏览器运行时切换。

## Shell

所有页面消费同一命名槽 Shell。Cover 位于 Shell 之前；Topbar 位于内容工作区之外；Workspace 只为 Main 建立正常文档流，Leftbar 和 Rightbar 使用覆盖 Workspace 全高的绝对定位轨道。每个 Side Region 内部使用统一 Surface，Surface 在进入 Shell 后 Sticky，并在 Shell 底部随容器离场。Leftbar 使用固定可用视口高度；桌面 Rightbar 与 Main 的实际内容起点对齐，而不是与包含顶部 padding 的 Main 外框对齐；它以内容高度为实际高度且不超过扣除该顶部留白后的可用视口，超长内容由 Viewport 独立滚动。Scrim 和 Dock 位于 Workspace 外。`data-regions` 记录实际 Region，`data-drawer` 记录临时抽屉状态，页面元数据使用 `data-page-*`。

Main 在 `>1180px` 使用实际 Workspace 宽度计算左右对称安全区，中线与视口中线一致；在 `769–1180px` 且存在 Leftbar 时改为从 Leftbar 右侧开始，宽度取既有 `--width-main` 上限与扣除 Leftbar、栏间距及右侧页边距后剩余空间的较小值，不再为已转入 Drawer 的 Rightbar 保留对称空白。无 Leftbar 页面继续居中，`≤768px` 使用移动端完整可用宽度。Leftbar 锚定 inline-start 边缘，Rightbar 锚定 inline-end 边缘，停靠列与 Main 的实际间距不得小于 `--gap-page`，Appearance 仍可声明更大间距。Leftbar 的绝对定位轨道从 `--leftbar-gap` 开始，使 Cover/Hero 尚未离场的自然滚动阶段与 Surface 进入 Sticky 后保持相同顶部间距；Drawer 断点继续使用自身显式顶部坐标，不叠加轨道间距。Card/Glass 使用 16px 私有边缘留白，Minimal/Flat 以 `--leftbar-gap: 0` 贴边。

`>1180px` 时 Leftbar 是固定高度面板并独立滚动，Rightbar 按内容收缩且以可用视口高度为上限；Rightbar Surface 进入 Sticky 后与 Topbar 底部保持 `--gap-base`，TOC 不再创建自己的 Sticky。桌面 Rightbar 的 Viewport 永远透明，不绘制整块背景、边框、阴影或模糊，Widget 由当前 Appearance 直接实现自身语义类；转为 Drawer 后恢复完整满高面板表面。`769–1180px` 只把 Rightbar 转为 Drawer，Leftbar 保持常驻并继续消费 `stellar:v2:leftbar-state` 的展开或 64px Rail 偏好；Footer 折叠按钮直接更新持久状态并作为 Rail 唯一的展开入口，不再临时打开 Leftbar Drawer。`tree`、`tagtree`、`toc` 等内容 Widget 在 Rail 中完全隐藏，不生成独立展开按钮。`≤768px` 再把 Leftbar 转为 Drawer。Rail 使用实际宽度，不保留展开态空轨道；Leftbar 作为 Drawer 打开时不匹配 Rail 样式，所有 Widget 直接复用桌面展开态的完整内容，而不是仅显示 Rail 图标。

存在 Topbar 时，Shell 以 `--shell-topbar-top` 建立正常文档流的顶部占位，使 Cover/Hero 尚未离场时的自然位置与进入 Sticky 后使用同一 Appearance 顶部坐标；Card 通栏 Topbar 的该值为 0，Glass 为 16px，Flat/Minimal 保持 0。Topbar Viewport 填满总高度扣除上下内边距后的实际内容区，内部 Widget Stack 与所有可见 Widget 在该区域垂直居中。列表页 `.navbar.top` 在 Shell 存在 Topbar 时仍以 Topbar 的实际顶部与内边距作为 Sticky 目标，层级位于 Topbar 内容之上；进入 pinned 后根据自身实际高度在内容区动态居中，只保留导航项并复用 Topbar 的 Appearance 表面，不再绘制自身背景、阴影或模糊层。未吸顶时 Navbar 保留独立卡片；没有 Topbar 的页面继续使用原吸顶位置与容器外观；Topbar Widget 不因 Navbar 吸顶而隐藏或重排。

Drawer 复用原 Region 节点，并使用事件代理、`inert`、ARIA、焦点转移、Escape、焦点恢复和 reduced-motion。

## Leftbar、Profile 与搜索

Leftbar 固定为三段结构：Header 渲染 `brand` 选中的 Brand；独立滚动主体先渲染 Menu，再按配置顺序渲染内容 Widgets；Footer 根据开关渲染 Actions，并始终提供 Settings 入口和折叠按钮。`leftbar.enabled: false` 关闭整栏，`widgets: []` 只清空滚动区内容；`brand`、`menu`、`footer.actions` 可在各层单独覆盖。站点默认选择 `site_brand`，Wiki、Note 列表与 Note 详情默认选择 `collection_brand`，Topic 仍默认站点 Brand。Leftbar Site Brand 使用 96px 静态头像、名称、字符串标语和三列 GitHub `followers/following/repos` 纵向布局；账号只读取 Widget Catalog 的 `ghuser.username`，未配置时省略数据区，已配置时三个值以空字符串预留固定高度并由 `ds-ghinfo` 原位填写。Collection Brand 保持 48px 静态图标、名称、字符串标语横向布局，不读取仓库展示元数据。Brand 图片没有光环或动画，标语没有悬停替换文本；图片与标题统一使用模型派生的首页链接，不开放 URL 配置。主体顶部不渐隐，底部使用 `linear-gradient(white, 90%, transparent)`；64px 留白只属于主体 Widget Stack。Settings 和折叠按钮均为 32px，Rail 中纵向排列；Drawer 复用同一节点并恢复完整名称与 Site 数据区。

Profile 在 Topbar 与 Leftbar 复用同一组件，整体链接到 Settings Profile。只有本页评论启用、Provider 属于 Artalk/Waline/Twikoo 且缓存中存在有效昵称时才显示身份；头像只接受 HTTP(S)，缺失或非法时显示身份图标。评论关闭、不支持的 Provider、匿名、损坏缓存或存储拒绝均显示设置图标与本地化“设置”。邮箱、Token、管理员状态不进入 DOM，Profile 也不参与 Leftbar 是否存在的判断。

内部 Collection Item 支持 `link/button`，Button 只透传经过转义的 `aria-*`、`data-*` 和 `title`，不接受内联事件或 Style。`site.menu.items` 最多声明一个 `{type: search}`；Search Item 与 Link Item 共用 `title/icon/accent` 视觉字段和所在 Menu 的响应式规则，未声明时使用本地化“搜索”与 `default:search`，仅按钮行为和搜索数据属性不同。Menu 根据当前 Wiki/Notebook 页面投影搜索范围与占位文案，并复用页面级唯一 `<dialog>`；所有内置搜索入口使用同一 Solar 图标，搜索状态不改变图标着色。搜索扩展关闭时该 Item 安全跳过。桌面 Dialog 宽度为 `min(600px, 100dvw - 64px)`，移动端全屏；Cmd/Ctrl+K、关闭按钮、背景点击、Escape、焦点恢复和页面滚动锁定使用同一交互路径。

Topbar 只由外层 Header 绘制 Appearance 表面，内部 Viewport 永远透明；`site_brand` 与 `collection_brand` 可独立或同时摆放，均以 32px 图片和纯文本 `name` 横向呈现，不输出标语或数据区，也不隐含占用剩余空间，布局完全由 Widget 顺序和显式 Spacer 决定。内置含 Brand 的 Topbar 均在 Brand 后声明 Spacer。

PageViewModel 以 `render.layout.brands.site` 和可空的 `render.layout.brands.collection` 分别投影 `site.brand` 与活动 Wiki、Notebook、Topic 的 `identity`；两者不合并、不互相回退，也不携带 GitHub 展示元数据。两种 Brand 的 `tagline` 都是 `string | null`，`image` 只包含 `src/variant`；Site Brand 的根级 `href` 固定派生为站点首页，Collection Brand 的根级 `href` 由 Wiki 首页、Notebook 根路径或 Topic 路径派生。无活动 Collection 时 `collection_brand` 不渲染。内部继续复用同一 Brand partial 和 `.brand-*` 样式；配置 Schema 不接受 Brand URL，预发布 `wordmark`、对象标语、独立图片 URL 与头像动效字段均被直接拒绝。

Wiki 默认 Topbar 为 `spacer/menu/actions`，Leftbar 关闭固定 Menu 与 Actions，内容只保留 `tree`；返回全部 Wiki 的入口由 Brand partial 在 `.brand-wrap` 上方自动输出为通用 `.brand-navigation`，不再是可配置的 `wiki_home` Widget。搜索由 Topbar Menu 的 Search Item 使用 Wiki PageViewModel 范围。删除 Wiki 专用 Settings 补插分支，固定 Footer 只生成一个 Settings Widget。

Topic 页面只级联全局 → Topic Profile → Collection → Page，不再叠加 Post Profile；显式重复 Widget 仍按原顺序保留。

## 迁移

预发布 `inherit`、`layout.regions.sidebar/context`、`sidebarRail` 与 `appearance.backgrounds.sidebar` 不保留运行时别名；Schema 直接拒绝。Doctor 对仍有明确替代项的旧名称给出精确目标。旧 `.l_*` 选择器整体替换并提供迁移表。

## 验证

最高接缝是：真实配置经 Schema、PageViewModel、统一 Shell/Region 生成 HTML，并在浏览器视口矩阵中验证布局、滚动与交互。重点比较桌面 Main 中线、中等宽度 Main 与 Leftbar 的边界、无 Leftbar 页面以及 Rightbar Drawer，并验证 Hero 首屏不显示 Side Region、越过 Hero 后两个 Surface 才进入固定状态。任务不运行 `acceptance:prepare`，不推进 M10/Alpha。

父规格：#734；聚焦规格：#735；Leftbar 折叠来源：#584；#720 旧候选继续过期。
