# 核查与修正记录

> 记录中文知识库对照 `themes/stellar/` 源码（版本 1.39.1，HEAD dea3290）核查与修正的偏差记录。
> 规则：行号引用一律改为文件路径；无法在代码中找到对应实现的主张保留原文并标注「未核实」。

## 一、已移除功能（整页改写为当前实现）

| 原始页面 | 问题 | 修正 |
|----------|------|------|
| 8.4 PJAX and Seamless Navigation | 整篇描述已删除的 PJAX（v1.35.0 移除，见 `docs/designs/2026-08-08-pjax-removal.md`） | 改写为「页面导航与预加载」：整页导航 + `plugins.preload`（flying_pages） |
| 1 Overview（Phase 4）、3/3.1、6/6.1、7.1、8/8.3/8.5、10.1/10.3 | 多处 PJAX 内容（pjax.ejs、pjax.js、pjax.styl、pjax:complete、page-loading-bar、StellarPjaxConfig 等） | 删除/改写为整页导航机制 |
| 6.1/6.4 等 | `stellar.initComments` 评论注册表、`utils.jq()`/jQuery 依赖 | 主题无 jQuery、无 initComments；评论经各自 partial 在页面加载时初始化 |
| 2/6.1/6.4/7.2/8 技术栈与依赖 | jQuery 列为依赖 | 已移除；`dependencies` 仅 marked + lazyload |
| 3.2/7/7.1 小部件 | `layout/_partial/sidebar/*.ejs` 路径 | 实际为 `layout/_partial/widgets/*.ejs`（`_data/widgets.yml` 的 `layout` 字段指定） |
| 3.2/7 小部件 | `welcome` 组件 | 已不在 `_data/widgets.yml` 定义，配置引用不再渲染（已注明） |
| 8/8.1/10 评论模板 | `layout/_third-party/comments/*.ejs` | 实际为 `layout/_partial/comments/` |
| 1.1/1.2/3 等 | `npm-publish.sh` | 已移除，发布走 `.github/workflows/npm-publish.yml` |
| 2/1.2 样式文件 | `source/css/index.styl`、`source/css/_themes/_custom.styl` | 实际为 `source/css/main.styl`、`source/css/_custom.styl` |
| 5/5.3 标签插件样式 | `source/css/plugins/tags/*.styl`、`source/css/tags/`、`_defines/color.styl` | 实际为 `source/css/_components/tag-plugins/*.styl`；命名颜色定义在 `_defines/const.styl`（`$color-md-*`） |
| 10.3 性能 | PJAX 部分页面导航 | 改写为整页导航 + preload 预加载 |

## 二、版本与事实修正

| 位置 | 问题 | 修正 |
|------|------|------|
| head-seo.md 描述生成 / Open Graph / JSON-LD | 文档与代码一致，但 `open_graph.enable` 时 wiki 项目 description 兜底未生效：`generate_description()` 提前返回，`og_args()` 未传描述，JSON-LD 无项目描述兜底 | 修复 `og_args()` 传入项目描述、`generate_description()` 调整优先级、`json_ld.js` 增加项目描述兜底；同步更新文档（见 `docs/designs/2026-08-14-wiki-meta-description-fallback/`） |
| 1.1/1 Overview 等 | 版本号 1.39.0 | 统一为 1.39.1 |
| 1.1/1 Overview 等 | 版本号 1.38.0 | 统一为 1.39.0 |
| 1.1/1 Overview 等 | 版本号 1.33.1 | 统一为 1.38.0 |
| 1.1 环境要求 | Node 14.17.3 ~ latest LTS | 实际要求 Node >= 22（README） |
| 1.1 环境要求 | Hexo 6.3.0 ~ latest | 已在 Hexo 8.1.2 下验证（Hexo 8 要求 Node >= 20.19），表述更新为「已验证至 8.1.2」 |
| 1.1 依赖表 | 缺 `glob` | 补充 `glob ^10.4.0` |
| 1.2/3.3 | `site_tree.page.menu_id` | 当前 `site_tree.page` 无 `menu_id` 字段 |
| 1.2/8.1 评论 | `comments.lazyload` 配置键 | 不存在；评论懒加载始终经 `util.viewportLazyload` 启用 |
| 3.4/6.3 canonical | `canonical.encoded`、`canonical.closeEnable`、`canonical.closeText` 配置键 | `encoded` 由 `layout/_partial/scripts/defines.ejs` 计算；无 closeEnable/closeText 逻辑（旧版功能） |
| 4.5 错误页 | `site_tree.error_page.leftbar: recent, timeline` | 实际为 `recent`（rightbar 空） |
| 5.3/5.5/6.4 copy | `document.execCommand("Copy")` | 实际为 `navigator.clipboard.writeText()` |
| 6.1 initPage | 序列含「评论系统重初始化」 | 当前序列：toc、sidebar、wikiStart、leftbarScroll、relativeDate、registerTabsTag |
| 8.2 搜索 | `search.no_results` 等被误报为配置键 | 实为语言文件键（`languages/zh-CN.yml`），非 `_config.yml` 键 |
| 3.1 模板路由 | `layout/post.ejs`、`layout/wiki.ejs` | 不存在；内容页经 `layout.ejs` + `page.ejs` 按 `page.layout` 处理 |
| 2.5 动态头像 / sidebar-system 动态头像 | `animated_avatar.background` 图片背景（rainbow64@3x.webp） | 改为 CSS 锥形渐变：新增 `style.gradient.avatar`（默认搜索条同款彩虹色），移除 `animated_avatar.background`；光环旋转动画（4s）不变 |
| 7.1 懒加载更新 | 动态懒加载图片需手动调用 `wrapLazyloadImages()` 或 `update()` | `lazyload.ejs` 新增 MutationObserver 兜底：检测到新增 `.lazy` 元素自动 `lazyLoadInstance.update()`；`wrapLazyloadImages()` 仍负责普通 `<img src>` 转换 |
| 7.1 评论服务 / artalk_latest_comment | 最新评论直接渲染 `content_marked` 完整 HTML | 改为保留表情图（`atk-emoticon`，CSS 限高 1.5em）、其余标签转纯文本并截断 50 字符，空评论跳过；避免大表情图与段落撑爆侧栏卡片布局 |

## 三、处理约定

- **行号**：全部移除，改为纯文件路径（如 `_config.yml:101-104` → `_config.yml`）
- **Sources 行**：译为「参考源码」，仅保留已核实存在的文件路径
- **交叉引用**：原文 `#N.N` 锚点改为中文知识库相对路径链接
- **未核实项**：个别行为描述（如部分混入内部实现细节、旧版 API 响应格式）无法在当前代码逐一确认，保留原文描述；涉及已确认移除的功能均已改写

## 四、复查方式

```bash
cd docs/knowledge
python3 tools/verify.py        # 复查中文版硬事实（配置键/文件路径/版本）
```

## 五、复查结果

`python3 tools/verify.py zh` 结果：**行号异常 0、版本不一致 0**；未解析文件与配置键标记均为**有意保留**的内容，分类如下：

- 用户站点文件/示例：`source/_data/notebooks/*.yml`、`_data/wiki/*.yml`、`source/css/custom*.css`、`site-tokens.styl`、`layout/_plugins/custom_plugin.ejs` 等（知识库「如何做」章节中的示例路径）
- 已移除功能的历史引用：`plugins.pjax`、`layout/_plugins/pjax.ejs`、`source/js/plugins/pjax.js` 等（8.4 页面与各页面「PJAX 已移除」说明）
- 语言键/运行时字段：`search.search` 等为 `languages/*.yml` 键；`canonical.encoded` 为 `window.canonical` 运行时字段
- 生成产物/解析伪影：`search.json`、`main.css`、`args.json.json`、`data_services.xxx.js`、`.ejs`/`.styl` 裸扩展名

## 六、样式变更登记

| 日期 | 位置 | 变更 |
|------|------|------|
| 2026-08-12 | `docs/knowledge/02-布局系统/sidebar-system.md` | 侧边栏顶部间距由 `calc(var(--gap-margin) * 2)`（32px）减半为 `var(--gap-margin)`（16px）；`$rightbar-bottom-margin` 96px→48px；`$leftbar-bottom-margin` 保持 32px 不变；移动端浮动面板顶部改为 `8pt` |
| 2026-08-12 | `docs/knowledge/02-布局系统/sidebar-system.md` | `$leftbar-bottom-margin` / `$rightbar-bottom-margin` 重命名为 `*-mobile` 且值统一为 64px，仅移动端媒体查询引用；PC（含平板）侧边栏底部间距统一为 `var(--gap-margin)`，上下各 16px；移动端右栏新增显式 max-height（8pt 顶 + 64px 底） |
| 2026-08-12 | `_components/partial/navbar.styl` / `_components/widgets/toc.styl` | navbar 与 TOC（右栏首个小部件）吸顶 `top` 同步减半为 `var(--gap-margin)`，移动端 navbar 对齐 `8pt` |
| 2026-08-12 | `docs/knowledge/02-布局系统/logo-navigation-headers.md` | navbar top 胶囊按钮（`.navbar nav a`）显式 `corner-shape: round`，取消全局 `superellipse(1.2)` 连续曲率，保持两端正圆端帽 |
| 2026-08-12 | `docs/knowledge/01-样式系统/responsive-design.md` | `.float-panel` 胶囊面板及其 `:before`/`:after` 显式 `corner-shape: round`，取消全局 `superellipse(1.2)` 连续曲率 |
| 2026-08-12 | `docs/knowledge/02-布局系统/logo-navigation-headers.md` | 回退 navbar top 链接（`.navbar nav a`）的 `corner-shape: round` 覆盖（`fc1ccb2` 引入），改随全局 `superellipse(1.2)` 连续曲率渲染，与父容器 `.navbar-blur` / `.navbar-container` 一致；`.float-panel` 的 `corner-shape: round` 保留 |
| 2026-08-12 | `source/css/_defines/func.styl` / `_components/partial/navbar.styl` / `_common/device.styl` | navbar top（`.navbar-blur` / `.navbar-container`）与 `.float-panel` 圆角由固定 `64px` 胶囊改为 `$border-bar`（`style.border-radius.bar`，默认 12px）；`newblur()` 增加 `$radius` 参数（默认 64px）；`.float-panel` 的 `corner-shape: round` 保留 |
| 2026-08-12 | `source/css/_custom.styl` / `_defines/func.styl` / `_components/partial/navbar.styl` / `_common/device.styl` | 抽取共享 mixin `bar-glass()`（长条圆角玻璃 UI，默认 `$border-bar-container`）、`bar-item()`（navbar 导航项与 float-panel 按钮共用基础 UI：padding `.25rem .75rem`、line-height、圆角 `$border-bar`、连续曲率；间距不写在 item 上）与 `bar-item-active()`（激活视觉：`var(--bg-a60)` / 深色 `rgba(white, 0.25)` 背景 + 多层阴影 + `saturate(300%)`，不含 cursor/pointer-events）；新增间距令牌 `$bar-item-gap`（当前 2px）与派生圆角令牌 `$border-bar-container = calc($border-bar + $bar-item-gap)`（当前 14px）：按钮/item 圆角直接用 `$border-bar`（12px），bar 容器圆角 = 按钮圆角 + 间距，内外保持同心；按钮/标签之间与距条边均为 `$bar-item-gap`（`.navbar nav` 与 `.float-panel` 容器 `gap`/`padding` 引用，移除 `a+a { margin-left: 4px }`）；navbar 导航项圆角由 32px 胶囊改为 `$border-bar`；bar 容器与内部元素（含 newblur 伪元素）均显式应用 `corner-shape: $corner-shape` 连续曲率，移除 `.float-panel` 的 `round` 覆盖；`.float-panel button` 改为 36×36（1:1、border-box、与 navbar item 同高，padding 4px），侧边栏打开时对应按钮复用 `bar-item-active()`，替换原主题色光晕 + `--bg-a50`；面板保持玻璃效果，按钮主题色图标保留 |
| 2026-08-12 | `source/css/_components/partial/paginator.styl` | 列表页底部分页条 `.paginator-wrap` 圆角由 `$border-card-l`（24px）改为 `$border-bar-container`（14px），与 navbar top / float-panel 容器圆角统一 |
| 2026-08-12 | `source/css/_components/widgets/widgets.styl` | 右栏 `.l_right .widgets` 首个 `.widget-wrapper` 去掉 `margin-top`（不再叠加 32px / `var(--gap-margin)` 顶部间距） |
- 简写路径已自动补全：`_partial/*.ejs`（→ `layout/`）、`_defines|_common|_components|_plugins/*.styl`（→ `source/css/`）

以上标记不构成内容错误；如需消除报告噪音，可后续调整 `tools/verify.py` 的忽略列表。

## 七、功能与文档同步登记

| 日期 | 位置 | 变更 |
|------|------|------|
| 2026-08-12 | `docs/designs/2026-08-12-pin-slider/`、`layout/_partial/main/pin_slider.ejs`、`source/css/_components/pin-slider.styl` | 新增列表页置顶内容轮播：所有 navbar top 列表页上方置顶位，`pin_slider` 配置（默认关闭），`pin` 字段（兼容 `sticky` 别名，设置即置顶、按数值降序，0/负数同样参与），轮播进度按内容类型分组缓存到 localStorage |
| 2026-08-12 | `docs/knowledge/00-总览与安装配置/configuration.md` | 新增 `pin_slider` 配置小节；配置表新增 `pin_slider` 行 |
| 2026-08-12 | `docs/knowledge/03-内容系统/wiki-docs.md`、`content-overview.md` | wiki 项目与专栏数据文件新增 `pin` 字段说明 |
| 2026-08-12 | `docs/knowledge/02-布局系统/logo-navigation-headers.md`、`page-templates-routing.md` | navbar top 上方置顶轮播位说明 |
| 2026-08-12 | `docs/knowledge/05-前端交互/client-side-overview.md` | pin-slider 组件与 localStorage 缓存机制说明 |
| 2026-08-12 | `docs/knowledge/03-内容系统/post-lists-cards.md` | 置顶文章改由列表页置顶轮播展示：轮播开启时文章卡片不再显示 `post.sticky` 图钉图标（未开启时保留） |
| 2026-08-12 | `layout/_partial/main/pin_slider.ejs`、`source/css/_components/pin-slider.styl` | 文章幻灯片改为完全复用列表文章卡片样式（`post_card`，photo/默认卡片），唯一区别是固定宽高比（2:1） |
| 2026-08-12 | `layout/_partial/main/navbar/nav_tabs_blog.ejs`、`layout/_partial/main/pin_slider.ejs` | 专栏列表页与其他博客列表页一致展示置顶文章轮播（移除专栏数据 `pin` 的轮播收集） |
| 2026-08-12 | `layout/_partial/main/pin_slider.ejs`、`source/css/_components/pin-slider.styl` | 轮播滚轮/触控板切换：wheel 事件，横向 deltaX 与鼠标滚轮 deltaY 均映射切页，阈值 + 400ms 冷却；移除 Pointer Events 跟手拖拽 |
| 2026-08-12 | `source/css/_components/pin-slider.styl` | 置顶文章幻灯片宽高比 2:1 → 3:1：photo 卡片封面同步 3:1；默认卡片封面铺满整卡（渐变遮罩 + 白色文字叠加），避免 3:1 下文字被裁；无封面卡片保持白底布局 |
| 2026-08-12 | `_config.yml`、`source/css/_components/pin-slider.styl`、`docs/knowledge/00-总览与安装配置/configuration.md` | 置顶文章幻灯片宽高比收敛为单一配置 `pin_slider.ratio`（默认 3）：photo/默认/无封面卡片统一读取该值，样式层不再硬编码比例 |
| 2026-08-12 | `layout/_partial/main/pin_slider.ejs`、`source/css/_components/pin-slider.styl` | 置顶文章卡片样式简化：有封面统一走 poster 封面卡片（无 poster 以标题为 headline 合成）；无封面为纯白卡片（文字普通颜色）；移除「有封面无 poster」默认卡片及其叠加样式 |
| 2026-08-12 | `layout/_partial/main/pin_slider.ejs`、`source/css/_components/pin-slider.styl` | 置顶文章卡片改为固定「标题 + 一行小字」结构（不再调用 post_card）：标题取 poster.headline > title，小字取 poster.caption > description > excerpt（截断 20 字）；文字样式对齐 poster cover-info；有封面封面铺满，无封面纯白卡片（普通文字颜色） |
| 2026-08-12 | `layout/_partial/main/pin_slider.ejs`、`source/css/_components/pin-slider.styl` | 置顶幻灯片文字区与 poster cover-info 完全一致：新增 `.pin-slide` 模糊层 `::before`（同图模糊 + 底部渐变 mask，z-index 1），文字区盒模型（bottom 0、padding 1.5rem/1rem、width calc(100% - 2rem)、底部渐变，z-index 2）与 cover-info 相同；移除全卡遮罩 `.pin-slide-mask` |
| 2026-08-12 | `_config.yml`、`source/css/_components/pin-slider.styl` | 轮播区宽高比与非置顶文章统一：删除 `pin_slider.ratio` 配置，幻灯片 `aspect-ratio` 改读 `article.cover_ratio`，一处修改整体生效 |
| 2026-08-12 | `layout/_partial/main/pin_slider.ejs` | 移除置顶轮播区滚轮/触控板切换（wheel 事件监听与拦截），滚动行为不再被轮播区域接管 |
| 2026-08-12 | `layout/_partial/main/pin_slider.ejs`、`source/css/_components/pin-slider.styl` | 置顶轮播区新增左右翻页按钮：鼠标悬停/键盘聚焦时显示，容器复用 navbar 玻璃效果（bar-glass），图标为 solar 双箭头 SVG（`double-alt-arrow-left/right-bold-duotone`，来自 `_data/icons.yml`），点击调用 prev/next |
| 2026-08-12 | `layout/_partial/main/post_list/paginator.ejs`、`layout/_partial/main/notebook/paginator.ejs`、`source/css/_components/partial/paginator.styl`、`_config.yml`、主工程 `_config.stellar.yml` | 列表页/笔记页分页器 prev/next 图标改为 solar 双箭头 SVG（与置顶轮播翻页按钮同一套），由 `icon()` helper 内联输出；移除 `style.paginator.prev/next` 背景图配置与 background-image 样式 |
| 2026-08-12 | `source/css/_components/partial/paginator.styl` | 分页器 prev/next 图标放大 50%：`.extend` 与内联 `svg` 尺寸由 1rem 调整为 1.5rem |
| 2026-08-12 | `source/css/_components/pin-slider.styl`、`source/css/_components/partial/paginator.styl` | 置顶轮播翻页按钮与分页器 prev/next 图标 hover 时显示主题色（`var(--theme)`） |
| 2026-08-12 | `source/css/_components/pin-slider.styl` | 置顶轮播文章卡片大标题单行显示，超出部分以省略号截断（nowrap + ellipsis） |
| 2026-08-12 | `docs/designs/2026-08-12-pin-slider-cover-ratio/`、`docs/knowledge/05-前端交互/client-side-overview.md`、主工程 `source/wiki/stellar/advanced-settings.md` | 文档校正为最终实现：excerpt 回退截断 50 字（`truncate(text, {length: 50})`，非 20 字）；文字区盒模型为 `padding: 1rem`、`width: 100%`（`box-sizing: border-box`），模糊层/底部渐变与 poster cover-info 一致但盒模型数值不同；本轮工作区不存在 `pin_slider.ratio` 配置，spec/plan/checklist 不再表述为「删除该配置」 |
| 2026-08-12 | `docs/knowledge/01-样式系统/responsive-design.md`、`styling-overview.md`、`stylus-utilities.md`、`知识库全量.md` | 文档校正：`.navbar-blur` / `.float-panel` 容器圆角为 `$border-bar-container`（14px，`bar-glass()` 默认值），按钮为 `$border-bar`（12px）；两处均显式应用 `corner-shape: $corner-shape`，`.float-panel` 不再保留 `corner-shape: round` 覆盖 |
| 2026-08-12 | `source/css/_components/list.styl`、`sidebar/*.styl`、`widgets/*.styl`、`_config.yml`、主工程 `_config.stellar.yml` | 未单独立方案的样式/配置微调：列表 cap 圆角 2→4px；左侧栏 footer/nav-area/search/`.l_right` 边距调整；ghuser/markdown/timeline 卡片圆角 `$border-card-s`→`$border-card`；toc 粘性顶部间距与移动端 padding 调整；widgets 容器左右栏间距与首项 margin 调整；主题默认 `style.border-radius.bar` 8→12px；主题 footer social 四项默认启用；主工程 leftbar `ui-style: glass` 改为注释（回退主题默认 card） |
| 2026-08-12 | `source/css/_components/list.styl` | 非置顶文章封面 `.cover-info` 的 padding 由 `1.5rem 1rem` 改为统一 `1rem`（移动端原有 `padding: 1rem` 覆盖随之移除），与置顶轮播文字区 `.pin-slide-text` 四周间距一致；移动端 `div+div` 的 `margin-top: 2px` 覆盖移除，与桌面统一为 4px；宽度模型仍不同（cover-info `width: calc(100% - 2rem)`，置顶 `width: 100%` + `box-sizing: border-box`），视觉等效 |
| 2026-08-12 | `layout/_partial/main/pin_slider.ejs`、`layout/_partial/main/post_list/post_card.ejs`、`layout/index.ejs`、`_config.yml`、`docs/knowledge/00-总览与安装配置/configuration.md`、主工程 `_config.stellar.yml` | 移除 `pin_slider.enable` 开关与 `pin_slider.interval` 配置：有置顶内容即自动渲染轮播（`if (pinItems.length > 0)`），自动轮播间隔写死 5000ms；首页列表不再重复展示置顶文章（`pinSliderActive = is_home_first_page()`）；文章卡片始终不显示置顶图标；主工程 `_config.stellar.yml` 删除 `pin_slider` 小节 |
| 2026-08-12 | `source/css/_defines/func.styl` | 侧栏高亮项顶部光照微调：深色模式渐变由 `rgba(white, 0.05) → 0 @ 20%` 改为 `rgba(white, 0.08) → 0 @ 50%`（与浅色一致），高光边 `rgba(white, 0.1)` → `rgba(white, 0.08)` |
| 2026-08-13 | `source/css/_components/pin-slider.styl` | 置顶轮播翻页按钮垂直居中修正：`.pin-slider-nav` 由 `top: 50%` + `margin-top: -2rem`（32px，不等于按钮半高）改为 `top: 50%` + `transform: translateY(-50%)`，与按钮实际高度/盒模型无关，精确垂直居中 |
| 2026-08-13 | `scripts/lib/mdrender_html.js`、`scripts/lib/wiki_readme.js`、`scripts/helpers/mdrender.js`、`scripts/tags/lib/md.js`、`layout/_partial/widgets/markdown.ejs`、`layout/_partial/widgets/toc.ejs`、`layout/page.ejs`、`source/js/services/mdrender.js`、`source/js/main.js`、`docs/knowledge/03-内容系统/wiki-docs.md`、`docs/designs/2026-08-13-mdrender-abstraction/` | 远程 MD 渲染能力抽象（分层重构）：底层通用组件 `mdrender_html.js` 只做占位生成与 GitHub raw 镜像（`data-replace` / `data-heading` / `data-base`，`api_host.ghraw` 直接读配置不兜底）；wiki 应用层 `wiki_readme.js` 负责 README 判定/URL/占位组合；helper 收敛为 `mdrender_html` / `wiki_readme_html` / `has_remote_md`；md 标签新增可选 `wrap` 参数（默认 true，`wrap:false` 输出无容器模式）；wiki 项目首页正文为空（trim 后）且配置 `repo` 时该页正文渲染为仓库 README.md，页面走既有 `page.ejs` → `layout.ejs` 链路；客户端 mdrender 渲染后派发 `stellar:mdrender` 事件，main.js 监听重建右侧 TOC（toc.ejs 预留空容器） |
| 2026-08-13 | `layout/_partial/main/pin_slider.ejs`、`docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/知识库全量.md`、`docs/designs/2026-08-13-pin-slider-dot-label.md` | 修复置顶轮播圆点 `aria-label` 未转义导致 HTML 解析失败：删除圆点按钮 `aria-label` 与未使用的 label 取值，圆点保留 `data-index`，激活态仍由 `aria-current` 标识 |
| 2026-08-13 | `scripts/helpers/escape_html.js`（新增）、`scripts/helpers/related_posts.js`、`layout/_partial/main/article/article_footer.ejs`、`layout/_partial/main/pin_slider.ejs`、`layout/_partial/main/post_list/post_card.ejs`、`layout/_partial/cover/post_cover.ejs`、`layout/_partial/sidebar/index_leftbar.ejs`、`layout/_partial/main/navbar/nav_tabs_blog.ejs`、`layout/_partial/main/navbar/nav_tabs_wiki.ejs`、`docs/knowledge/03-内容系统/article-footer-metadata.md`、`docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/知识库全量.md`、`docs/designs/2026-08-13-escape-html-attributes.md` | 用户内容转义加固：新增 `escape_html` 模板辅助函数；分享按钮 URL 参数改经 `encodeURIComponent` 编码、`copy-link` value 与文案经 HTML 转义；pin_slider 幻灯片标题/摘要/封面/wiki 字段、文章卡片标题/摘要/封面、相关文章标题、导航分类/标签等用户内容统一转义输出，标题含引号/`&`/`<` 不再破坏 HTML 结构 |
| 2026-08-13 | `_config.yml`、`layout/_partial/main/navbar/nav_tabs_blog.ejs`、`layout/index.ejs`、`docs/knowledge/00-总览与安装配置/configuration.md`、`docs/designs/2026-08-13-pin-style/`、主工程 `source/wiki/stellar/advanced-settings.md`、`source/wiki/stellar/front-matter.md`、主工程 `docs/specs/pin-style/` | 新增置顶文章样式配置 `article.pin_style`（默认 `carousel`，可切换 `flat`）：flat 时博客列表页不渲染文章轮播（`nav_tabs_blog.ejs` 跳过 post 类型 `pin_slider`），首页第一页文章列表顶部按轮播同款规则（`pin`/`sticky` 数值降序，`true` 视作 1，权重相同保持原顺序）展示全部置顶文章并按 `post.path` 去重；wiki 轮播不受影响；顺带移除 `configuration.md` 配置表中已不存在的 `pin_slider` 小节行 |
