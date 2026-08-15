# 核查与修正记录

> 记录中文知识库对照 `themes/stellar/` 源码（版本 1.41.0，HEAD 4f71c61）核查与修正的偏差记录。
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
| 1.1 安装与启动 / 版本位置 | 版本号 1.40.0（release 1.41.0 后未同步） | 统一为 1.41.0（installation.md 六处 + 知识库全量.md 同步） |
| 1.1 安装与启动 / 版本位置 | 版本号 1.39.1（release 1.40.0 后未同步） | 统一为 1.40.0（installation.md 六处 + 知识库全量.md 同步） |
| 1 样式系统 / 表格排版 | 文档仅描述 `overflow: auto`，未体现 1.32.1（`830ccbd`）起桌面端 `display: table` 压缩换行、不再横向滚动 | 恢复 `display: block` + `overflow-x: auto` + `tr` 不换行，普通 Markdown 表格默认横向滚动；同步更新文档（见 `docs/designs/2026-08-14-restore-table-scroll/`） |
| 1 样式系统 / 表格排版 | `display: block` 表格只滚动不铺满、compact 无滚动容器 | 新增 `after_post_render` 过滤器把普通表格包 `.md-table-scroll`（宽度足够铺满 + 超出滚动），compact 补滚动容器与 `min-width: max-content`，wrap 保持换行（见 `docs/designs/2026-08-14-table-fill-scroll/`） |
| 1 样式系统 / 表格排版 | 仅 wrap 有圆角卡片边框，其余表格为直角无边框 | 边框规则上移到 `.tag-plugin.table table` 共享层，md 默认 / scroll / compact / wrap 统一 wrap 同款圆角边框（见 `docs/designs/2026-08-15-table-card-border/`） |
| 1.1 环境要求 | Hexo 6.3.0 ~ latest | 已在 Hexo 8.1.2 下验证（Hexo 8 要求 Node >= 20.19），表述更新为「已验证至 8.1.2」 |
| 1.1 依赖表 | 缺 `glob` | 补充 `glob ^10.4.0` |
| 1.2/3.3 | `site_tree.page.menu_id` | 当前 `site_tree.page` 无 `menu_id` 字段 |
| 1.2/8.1 评论 | `comments.lazyload` 配置键 | 不存在；评论懒加载始终经 `util.viewportLazyload` 启用 |
| 3.4/6.3 canonical | `canonical.encoded`、`canonical.closeEnable`、`canonical.closeText` 配置键 | `encoded` 由 `layout/_partial/scripts/defines.ejs` 计算；无 closeEnable/closeText 逻辑（旧版功能） |
| 4.5 错误页 | `site_tree.error_page.leftbar: recent, timeline` | 实际为 `recent`（rightbar 空） |
| 4-图标系统 | 内置图标分散在模板/脚本/CSS/客户端 JS/配置中硬编码 | 统一迁移到 `_data/icons.yml`：新增 `hexo.utils.iconData()`、`ctx.icons` 客户端注册表、`--icon-*` CSS 变量桥接；`default.loading`/`image_onerror` 保留兼容回退（见 `docs/designs/2026-08-15-unify-icons-to-icons-yml/`） |
| 5.3/5.5/6.4 copy | `document.execCommand("Copy")` | 实际为 `navigator.clipboard.writeText()` |
| 6.1 initPage | 序列含「评论系统重初始化」 | 当前序列：toc、sidebar、wikiStart、leftbarScroll、relativeDate、registerTabsTag |
| 8.2 搜索 | `search.no_results` 等被误报为配置键 | 实为语言文件键（`languages/zh-CN.yml`），非 `_config.yml` 键 |
| 3.1 模板路由 | `layout/post.ejs`、`layout/wiki.ejs` | 不存在；内容页经 `layout.ejs` + `page.ejs` 按 `page.layout` 处理 |
| 2.5 动态头像 / sidebar-system 动态头像 | `animated_avatar.background` 图片背景（rainbow64@3x.webp） | 改为 CSS 锥形渐变：新增 `style.gradient.avatar`（默认搜索条同款彩虹色），移除 `animated_avatar.background`；光环旋转动画（4s）不变 |
| 7.1 懒加载更新 | 动态懒加载图片需手动调用 `wrapLazyloadImages()` 或 `update()` | `lazyload.ejs` 新增 MutationObserver 兜底：检测到新增 `.lazy` 元素自动 `lazyLoadInstance.update()`；`wrapLazyloadImages()` 仍负责普通 `<img src>` 转换 |
| 7.1 评论服务 / artalk_latest_comment | 最新评论直接渲染 `content_marked` 完整 HTML | 改为保留表情图（`atk-emoticon`，CSS 限高 1.5em）、其余标签转纯文本并截断 50 字符，空评论跳过；避免大表情图与段落撑爆侧栏卡片布局 |
| 5.3 标签插件 | 无 `table`、`tip` 标签 | 新增 `table`（scroll/wrap/compact 三档样式）与 `tip`（气泡注解）标签，见 `docs/designs/2026-08-14-issue-fix-1400/` |
| 1.2/3.3 文章配置 | 无 `article.reading_time`、`article.card_tags` | 新增两个配置键（均默认 `false`）：文章页字数/预计阅读、文章卡片标签 |
| 7.1/5 前端脚本 | 内联脚本 partial（`scripts/utils.ejs`、`theme.ejs`、`services.ejs`、`tagtree.ejs`、`sidebar.ejs`） | 全部外置：`utils.js` 同步加载、`theme.js`/`services.js`/`tagtree.js` defer、`sidebar` 并入 `main.js`；图标白名单改由构建期生成的 `/js/stellar-icons.js` 填充 `ctx.icons`（见 `docs/designs/2026-08-15-on-demand-bundling/`） |
| 5 前端交互 / 平滑滚动 | 删除全局 `scroll-behavior: smooth` 后标题左侧 `.headerlink`、`{% navbar %}` 页内导航、脚注回链等原生 `#` 链接退化为即时跳转 | `main.js` 新增文档级 `bindAnchorClick` 委托：同页 `#` 链接统一走 `smoothScrollTo`（32px 偏移、`#start` 贴顶、`pushState` 更新 hash），已 `preventDefault` 的点击自动跳过（见 `docs/designs/2026-08-15-restore-anchor-smooth-scroll/`） |
| 1 样式系统 / 插件加载 | 插件与评论样式全部编入 `main.css`；`index.styl` 评论条件 `index(custom_css, name) >= 0` 在 Stylus 下恒为真导致五种评论样式全量打入 | swiper/fancybox/mermaid 移入 `source/css/plugins/`，五种评论样式移入 `source/css/comments/` 独立编译，运行时 `utils.css()` 按需注入；`index.styl` 删除评论条件段（见 `docs/designs/2026-08-15-on-demand-bundling/`） |
| 6.4 动态数据 / memos | 仅识别 22-/22+/25+ | 新增 `v1` 分支（`{ memos: [...] }` + `createTime`，creator 为 `users/xxx` 字符串）；识别失败回退 `feature` |
| 6.4 评论服务 / waline | 直接 `data.forEach` 处理返回 | 兼容数组与 `{ data: [...] }` 两种返回结构 |
| 8.2 评论 / artalk | `?atk_*` 查询参数残留，干扰目录定位 | 初始化后 `history.replaceState` 清理查询参数（#598） |
| 8.2 评论 / artalk 定位 | 邮件链接 `?atk_comment=` 打开不定位评论区（视口懒加载下 Artalk 不初始化；300ms 固定延时清理与 `list-loaded` 竞态） | atk 定位目标跳过视口懒加载立即初始化；评论 id 改写到 hash、`list-loaded` 后事件驱动清理 `?atk_*`（见 `docs/designs/2026-08-15-artalk-comment-goto/`） |
| 5.3 样式 / prefers-color-scheme | navbar/sidebar 暗色兜底无条件跟随系统 | 统一收敛到 `:root:not([data-theme])` 下，显式主题只跟随 `data-theme` 开关（#593/#663） |
| 5.5 时间线 / timeline | 节点标题直接输出原文 | 改为经 markdown 渲染（#401） |
| 3.3 分类页 | 分类列表平铺，三级及以上失效 | 改为基于 parent 递归构建嵌套树（#564），逻辑抽到 `scripts/lib/category_tree.js` |
| 3.3 文章卡片 / 文章页 | 卡片无标签展示、文章页无阅读时长 | 卡片新增纯文字标签（`cap` 小字样式，最多 5 个，默认关闭）；文章页面包屑行右侧新增字数与预计阅读（`scripts/lib/reading_time.js`，默认关闭） |
| 5.3 标签插件 / table、tip | 初版样式无区分、气泡纯色块 | 最终实现：table 三种样式（scroll 复用主题 `scrollbar()` 滚动条、wrap 外边框+圆角+内部左右边框+自动换行、compact 行高 1.4 紧凑显示）；tip 气泡复用 `bar-glass()` 玻璃效果；两标签语法不变 |
| 2026-08-14 | `_config.yml`、`source/css/_custom.styl`、样式文档 | `style.corner-shape` 默认值统一为 `superellipse(1.25)` 并移除 `_custom.styl` 中的代码兜底（默认值由 `_config.yml` 提供）；同步更新知识库与 wiki 文档中的 1.2 引用 |
| 2026-08-15 | `_data/icons.yml`、`layout/`、`scripts/tags/lib/`、`source/js/services/`、`_config.yml` | `default:*` 图标键统一迁移为 `solar:*`（键名 = Solar 图标名，15 个键：goback/edit/theme/upup/tocomment/calendar/category/pin/bookmark.active/loading/comment/warning/copy/download/hashtag/image-onerror），值升级为当前版 Solar bold-duotone；`default:search`（三态着色依赖 `p-id="1562"`）、`default:rss`（经典 RSS 视觉）、`default:leftbar/rightbar`（`#sep` 位移动画）、`default:loading-spinner`、`default:loading-placeholder` 保留原键原值；站点级覆盖键需同步改名（见 `docs/designs/2026-08-15-solar-icons-default-namespace/`） |
| 2026-08-15 | `layout/tags.ejs`、`layout/_partial/main/article/article_tags.ejs`、`source/css/_defines/func.styl`、`docs/knowledge/03-内容系统/article-footer-metadata.md` | 标签页（`/blog/tags/`）与文章页标签胶囊的前缀由 CSS `:before { content: "#" }` 改为内联 `default:hashtag` 图标（`tag-chip()` 内 `.tag svg`：1em、`opacity: .4`，hover 主题色）；笔记页与文章卡片标签仍用 `#`（见 `docs/designs/2026-08-15-tags-hashtag-icon/`） |
| 2026-08-15 | `layout/_partial/menubtn.ejs`、`layout/_partial/widgets/toc.ejs`、`_data/icons.yml` | 移动端侧边栏悬浮按钮曾尝试 Solar outline 风格（`sidebar-outline` / `sidebar-minimalistic-outline`），因丢失 `path#sep` 位移动画还原为 `default:leftbar` / `default:rightbar`（原 stroke SVG，含 `#sep`）；TOC 头部右上角折叠按钮改为复用 `default:rightbar`，移除已无引用的 `solar:sidebar-minimalistic-bold-duotone`（见 `docs/designs/2026-08-15-sidebar-float-outline/`） |
| 2026-08-15 | `layout/_partial/widgets/toc.ejs`、`_data/icons.yml` | TOC 页脚按钮图标改为 Solar outline：回到顶部 → `default:upup`、参与讨论 → `default:tocomment`；移除已无引用的 `solar:double-alt-arrow-up-bold-duotone` / `solar:chat-round-line-bold-duotone` |
| 2026-08-15 | `layout/categories.ejs`、`layout/_partial/main/post_list/post_card.ejs`、`_data/icons.yml` | 分类图标调整为 Solar：普通分类（含文章卡片）→ `default:category`，分类页有子分类的父分类 → `default:category-open`；`solar:folder-2-bold-duotone` 改名并移除 |
| 2026-08-15 | `_data/icons.yml`、`layout/`、`scripts/`、`source/js/`、`_config.yml`、`test/icons.test.js`、`docs/knowledge/` | 主题基础功能（非标签插件）图标键统一为 `default:语义名`（27 个 `solar:*` 键改名，如 documents→`default:documents`、calendar→`default:calendar`、shield-*→`default:shield-*`、hashtag-outline→`default:hashtag`），移除零引用 `solar:pin-bold-duotone`；github:/share:/标签插件键不变；值不变、渲染无视觉变化（见 `docs/designs/2026-08-15-icon-key-default-namespace/`） |
| 2026-08-15 | `_data/icons.yml`、`source/js/services/weibo.js`、`source/js/services/timeline.js`、`scripts/tags/lib/image.js`、`layout/_partial/scripts/defines.ejs`、`_config.yml` | 标签组件专用图标改用标签名命名空间：`default:like/repeat/comment` → `weibo:like/repeat/comment`（{% timeline %} 数据服务，客户端注册表），`default:image-onerror` → `image:onerror`（{% image %} 破图兜底）；`default:loading-spinner/warning/loading-placeholder` 等共享工具保留 `default:` |
| 2026-08-15 | `_data/icons.yml`、`scripts/tags/lib/copy.js`、`scripts/tags/lib/image.js`、`scripts/tags/lib/hashtag.js`、`_config.yml` | 剩余 4 个 `solar:*` 标签插件键按标签名命名空间改名：`solar:copy-bold-duotone` → `copy:copy`、`solar:download-bold-duotone` → `image:download`、`solar:hashtag-bold-duotone` → `hashtag:hashtag`、`solar:hashtag-square-bold` → `quot:hashtag`（同步 notebook `tagcons` 默认与 `{% quot %}` 前缀配置）；`solar:` 前缀在 icons.yml 中全部消除 |
| 2026-08-15 | `_data/icons.yml`、`_config.yml`、`layout/_partial/head.ejs`、`test/icons.test.js` | {% quot %} 分区图标统一 `quot:` 前缀：`ph:seal-question-fill` → `quot:question`、`bxs:quote-left/right` → `quot:quote-left/right`（同步 quot 前缀配置与 `--icon-quote-*` CSS 桥接）；`ph:`/`bxs:` 前缀在 icons.yml 中消除 |
| 2026-08-15 | `_data/icons.yml`、`_config.yml` | 仅出现在 `_config.yml` 注释示例中的图标改用 `example:` 命名空间：`default:chat/planet/notebook` → `example:chat/planet/notebook`（侧边栏菜单示例），同步配置注释与文档示例 |
| 2 命令 / new-note | 生成 front-matter 带秒 | date 对齐 `YYYY-MM-DD HH:mm`（#594） |
| 2026-08-15 | `source/js/main.js`（`init.navbarPin`）、`docs/knowledge/05-前端交互/client-side-overview.md` | navbarPin 用 `scrollY >= pinStart` 推算吸顶状态，移动端浏览器顶栏伸缩改变 `scrollY`，导致仍吸顶时 `.pinned` 误移除、玻璃效果消失 | 改为直接测 `navbar.getBoundingClientRect().top <= stickyTop + 2px` 判定吸顶，删除 `documentTop()`/`pinStart`，新增 `visualViewport.resize` 兜底（见 `docs/designs/2026-08-15-navbar-pin-urlbar/`） |
| 2026-08-16 | `_config.yml`、`layout/_partial/cover/post_cover.ejs`（删除）、`layout/_partial/cover/index.ejs`、`layout/_partial/main/post_list/post_card.ejs`、`docs/knowledge/00-总览与安装配置/configuration.md`、`03-内容系统/content-overview.md`、`post-lists-cards.md`、`知识库全量.md` | 移除已失效的 auto_banner / auto_cover（Unsplash 封面接口）：删除 `article.auto_banner` 配置与 `post_cover.ejs` 死代码；文章卡片封面仅显式 `cover` 完整 URL 时渲染；同步清理知识库中的 Unsplash 描述（见 `docs/designs/2026-08-16-remove-unsplash-auto-banner/`） |
| 2026-08-16 | `layout/_partial/main/post_list/post_card.ejs`、`source/css/_components/list.styl`、`docs/knowledge/03-内容系统/post-lists-cards.md` | 文章卡片标签前缀由字符 `#` 改为内联 `default:hashtag` 图标（`.card-tags svg`：1em、`margin-right: .25em`、`opacity: .4`，与 `tag-chip()` 一致）；标签页/文章页/笔记页标签不受影响（见 `docs/designs/2026-08-16-card-tags-hashtag-icon/`） |

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
| 2026-08-15 | `source/css/_defines/func.styl`（新增 `tag-chip()` mixin）、`_components/pages/archives.styl`、`_components/partial/article-tags.styl` | 标签胶囊样式统一并复用：新增 `tag-chip()` mixin（胶囊 `border-radius: 999px`、`var(--block)` 底色、`#` 前缀、hover 高亮、`padding: .5em .75rem`、`margin: .5rem` 即 1rem 间距）；标签页（`/blog/tags/`）与应用保持一致、靠左展示（`.post-list #tags` 无 `justify-content`，容器 `margin: 0 -.5rem` 抵消外边距）；文章底部标签（`.article-tags`）复用同一 mixin，容器 `justify-content: center` 居中展示、水平外边距同标签页（`margin: 2rem -.5rem 0`，保留与正文的 2rem 顶部间距） |
| 2026-08-15 | `source/css/_components/widgets/toc.styl` | toc 底部操作按钮（回到顶部 / 参与讨论）分隔线选择器由 `.widget-wrapper.toc .widget-body+.widget-footer:before` 放宽为 `.widget-wrapper.toc .widget-footer:before`，footer 前不再要求紧跟 `.widget-body`，结构变化时分隔线仍正常渲染 |
| 2026-08-15 | `source/css/_components/sidebar/search.styl` | 搜索结果显示样式优化：`.search-result-title` 单行显示（nowrap + ellipsis）并在底部加 `var(--block-border)` 分割线（padding-bottom 6px / margin-bottom 4px）；`.search-result-section` 章节名颜色由 `--text-p3` 改为 `--text-p1`，`#` 前缀同步继承标题色 |
| 2026-08-15 | `source/css/_components/sidebar/search.styl`、`source/js/search/local-search.js` | 搜索结果结构调整：文章标题移出链接、置于卡片顶部（`fs-14`、`padding: 0.5rem 1rem`、与链接同底色，hover 整体高亮）；章节名移入链接并采用原标题样式（`fs-15` 加粗、单行省略、底部 `var(--block-border)` 分割线），移除 `#` 前缀；链接圆角改为仅底部以配合标题卡片 |
| 2026-08-15 | `source/css/_components/sidebar/search.styl` | 搜索结果卡片样式回归链接：`li a` 恢复完整 `$border-card-s` 圆角与 `var(--bg-a20)` 背景（hover `--bg-a100`）；`.search-result-title` 移除背景与圆角，仅保留 `fs-14`、`padding: 0.5rem 1rem`、单行省略的纯文字标题 |
| 2026-08-15 | `source/css/_components/sidebar/search.styl` | 搜索结果样式最终调整：`li a` hover 背景由 `--bg-a100` 改为 `--bg-a50`；`.search-result-section` 前缀由 `#` 改为 `>`（`margin-right: .5em`、主题色），分隔间距 `padding-bottom`/`margin-bottom` 改为 `.5rem`；`.search-result-content` 外边距由 `4px 0 0` 改为 `0`；`.search-keyword` 命中高亮由红色改为黄色（`$c-yellow`，含虚线边框） |
| 2026-08-16 | `source/css/_components/tag-plugins/banner.styl`、`list.styl`、`pin-slider.styl`、`partial/article-banner.styl`、`layout/_partial/main/navbar/article_banner.ejs` | banner 标签 hover 动画对齐文章列表 cover：背景图缩放 1.05（1.5s 缓动）、亮度 75% / 饱和度 120%（0.2s 过渡），transition 由容器移到 `img.bg`；poster 卡片、置顶轮播、文章页 banner 的同图模糊层新增黑色渐变蒙版（文字所在边缘不透明度约 0.5 → 垂直中线 0），移除 `cover-info` / `pin-slide-text` 原有 0.2 边缘渐变（见 `docs/designs/2026-08-16-banner-hover-cover-mask/`） |
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
| 2026-08-14 | `scripts/lib/ai_label.js`（新增）、`scripts/helpers/ai_label.js`（新增）、`layout/_partial/main/navbar/dateinfo.ejs`、`layout/_partial/main/post_list/post_card.ejs`、`source/css/_components/partial/bread-nav.styl`、`_config.yml`、`docs/knowledge/00-总览与安装配置/configuration.md`、`03-内容系统/content-overview.md`、`03-内容系统/post-lists-cards.md`、`docs/designs/2026-08-14-ai-label/`、主工程 `source/wiki/stellar/advanced-settings.md`、`front-matter.md`、`docs/specs/ai-label/` | 新增文章 AI 成分标签 `article.ai_label`（默认纯手工 / AI 润色 / AI 生成三档文案与颜色，站点可覆盖）与 front-matter `ai` 字段：文章页显示在作者右侧（无作者时元信息行首），文章卡片显示在 meta 行最左、日期之前；未标记不渲染，未知值构建期告警 |
| 2026-08-14 | `scripts/lib/ai_label.js`、`layout/_partial/main/navbar/article_banner.ejs`、`layout/_partial/main/post_list/post_card.ejs`、`source/css/_components/partial/bread-nav.styl`、`docs/designs/2026-08-14-ai-label/`、主工程 `source/wiki/stellar/advanced-settings.md`、`docs/specs/ai-label/` | AI 标签 UI 调整：改为彩色底色徽章（白字）；文章页移到顶部面包屑行最右（阅读时长右侧），文章卡片移到 meta 行标签右侧（无标签时行末） |
| 2026-08-15 | `layout/_partial/main/post_list/post_card.ejs`、`docs/knowledge/03-内容系统/post-lists-cards.md`、`content-overview.md`、主工程 `source/wiki/stellar/advanced-settings.md`、`docs/specs/ai-label/` | 移除文章列表卡片上的 AI 标签：文章页顶部面包屑行最右的展示保持不变 |
| 2026-08-15 | `scripts/lib/ai_label.js`、`scripts/helpers/ai_label.js`、`source/css/_components/partial/bread-nav.styl`、`_config.yml`、`docs/knowledge/00-总览与安装配置/configuration.md`、`docs/designs/2026-08-14-ai-label/`、主工程 `source/wiki/stellar/advanced-settings.md`、`docs/specs/ai-label/` | AI 标签支持图标：`article.ai_label` 每档新增可选 `icon` 字段，图标（SVG，继承文字颜色）渲染在文案前；`.ai-label` 改为 inline-flex 居中、图标 1em 高（后调整为 1.2em） |
| 2026-08-15 | `scripts/lib/ai_label.js`、`scripts/helpers/ai_label.js`、`layout/_partial/main/navbar/article_banner.ejs`、`source/css/_components/partial/bread-nav.styl`、`docs/knowledge/00-总览与安装配置/configuration.md`、`03-内容系统/content-overview.md`、`docs/designs/2026-08-14-ai-label/`、主工程 `source/wiki/stellar/advanced-settings.md`、`docs/specs/ai-label/` | AI 标签样式调整：改为彩色文字、无背景；banner 含图片时不用配置色，继承 `--text-banner` 默认文字色（helper 新增 noColor 参数） |
| 2026-08-15 | `scripts/lib/ai_label.js`、`scripts/helpers/ai_label.js`、`layout/_partial/main/navbar/article_banner.ejs`、`_config.yml`、`docs/knowledge/00-总览与安装配置/configuration.md`、`03-内容系统/content-overview.md`、主工程 `source/wiki/stellar/advanced-settings.md`、`front-matter.md`、`docs/specs/ai-label/` | front-matter 字段 `ai` 更名 `ai_label`；新增 `article.ai_label.default`：为空时未标记文章不显示，非空时未标记文章按默认档渲染（helper 新增 resolveAiKey 回退逻辑）；同步迁移已标记文章字段并刷新 `updated` |
| 2026-08-15 | `_config.yml`、`test/ai_label.test.js`、`docs/knowledge/00-总览与安装配置/configuration.md`、`03-内容系统/content-overview.md`、主工程 `source/wiki/stellar/advanced-settings.md`、`front-matter.md`、`docs/specs/ai-label/` | 新增第四档 `reviewed`（AI 已审核，青色，图标复用 `shield-check-bold-duotone`） |
| 2026-08-15 | `source/css/_components/partial/bread-nav.styl` | `.ai-label` padding 由 `0 4px` 调整为 `4px`（四周等距，改善与面包屑行元素的对齐观感） |
| 2026-08-15 | `languages/zh-CN.yml`、`languages/en.yml`、`languages/zh-TW.yml`、`_config.yml`、`scripts/lib/ai_label.js`、`scripts/helpers/ai_label.js`、`test/ai_label.test.js`、`docs/knowledge/00-总览与安装配置/configuration.md`、`03-内容系统/content-overview.md`、`docs/designs/2026-08-15-ai-label-i18n/`、主工程 `source/wiki/stellar/advanced-settings.md`、`front-matter.md`、`docs/specs/ai-label/` | AI 标签文案移入多语言系统：`languages/*.yml` 新增 `meta.ai_label.*`（zh-CN / en / zh-TW 四档）；`article.ai_label` 配置移除 `text` 字段（保留 `default` / `color` / `icon`）；helper 经 `__()` 解析文案，缺失翻译时不渲染 |
| 2026-08-15 | `layout/_partial/head.ejs`、`scripts/lib/seo.js`（新增）、`scripts/helpers/seo.js`（新增）、`scripts/helpers/json_ld.js`、`test/seo.test.js`（新增）、`languages/*.yml`、`docs/knowledge/02-布局系统/head-seo.md`、主工程 `source/wiki/stellar/seo-settings.md`、`docs/designs/2026-08-15-seo-meta-fixes/` | SEO 元数据修复：wiki 标题去重（标题以 `：`/`:`/` - ` 重复 wiki 名前缀或完全同名时只保留一次）；首页分页第 2 页起标题加「第 N 页」；`og:site_name` 恒为站点名；`og:image` 与 JSON-LD 文章图片按 封面→横幅→相册→正文首图→默认封面 回退（修复无图文章 `image:[]` 与 unshift 赋值的数组 bug）；JSON-LD 描述无摘要时回退正文前 200 字符 |
| 2026-08-15 | `_config.yml`、`layout/page.ejs`、`layout/_partial/main/article/article_tags.ejs`（新增）、`source/css/_components/partial/article-tags.styl`（新增）、`docs/knowledge/00-总览与安装配置/configuration.md`、`03-内容系统/article-footer-metadata.md`、`docs/designs/2026-08-15-article-tags/` | 新增文章末尾标签行 `article.tags`（默认 `true`）：post 页正文后、`article-footer` 前渲染一行标签胶囊（复用 `tag-chip()` mixin，`var(--block)` 底色、hover 高亮），链接指向 Hexo 标签页；无标签或关闭配置时不渲染，wiki / 笔记不受影响 |
| 2026-08-15 | `docs/knowledge/03-内容系统/article-footer-metadata.md`、`02-布局系统/page-templates-routing.md`、`03-内容系统/index.md`、`知识库全量.md`、`docs/designs/2026-08-15-article-tags/`、主工程 `source/wiki/stellar/advanced-settings.md`、`pages.md` | 文档同步：文章标签行样式描述与实现对齐（复用 `tag-chip()` 胶囊、`var(--block)` 底色、hover `var(--block-border)`）；page.ejs 组装流程与组件矩阵补 `article_tags`；合并版知识库补齐 `article` 配置表（`reading_time` / `card_tags` / `tags`）与「文章标签行」章节；文档仓库 wiki 更新 `advanced-settings.md`（阅读信息与文章标签配置）与 `pages.md`（文章标签可见性说明） |
| 2026-08-15 | `layout/_plugins/fancybox.ejs`、`docs/knowledge/07-外部集成/plugin-system.md` | 评论区 fancybox 选择器从 `.with-fancybox img` 收回到各评论服务内容区（Artalk `.atk-content`、Twikoo `.tk-content`、Waline `.wl-content`）：Artalk 表情面板图片（`<span class="atk-item"><img>`，无 `atk-emoticon` 属性、class 不含 "emo"）点击时不再误触 Fancybox 弹窗，Twikoo OwO 表情面板同样受益；编辑器、表情面板、头像等非内容区图片不弹窗，评论正文图片仍可弹窗（见 `docs/designs/2026-08-15-fancybox-comment-emoji.md`） |
| 2026-08-15 | `scripts/events/lib/utils.js`、`scripts/generators/stellar-icons.js`（新增 `js/icons/{ns}.json` 输出）、`source/js/icons.js`（新增）、`layout/_partial/scripts.ejs`、`layout/_partial/sidebar/search.ejs`、`sidebar/menu.ejs`、`sidebar/logo.ejs`、`layout/_partial/menubtn.ejs`、`test/icons.test.js`、`docs/knowledge/09-高级主题/performance.md`、`04-标签插件/icon-tag.md`、主工程 `source/wiki/stellar/tag-plugins/express.md`、`docs/designs/2026-08-15-async-icon-loading/` | 图标异步加载：`icon(key, args, inline)` 第三参为 `true` 时 SVG 原样内联（首屏搜索、菜单、leftbar/rightbar、goback），否则输出 `<svg class="icon" data-icon="key">` 占位符，由 `/js/icons.js` 按命名空间拉取 `js/icons/{ns}.json` 后原位替换；最终 DOM 与内联一致，CSS 钩子（搜索三态、菜单渐变、leftbar 动画、chat 着色）不受影响；URL 值仍由服务端输出 `<img>`；`ctx.icons` 白名单（`js/stellar-icons.js`）行为不变 |
| 2026-08-15 | `_config.yml`、`source/js/search/local-search.js`、`layout/_plugins/search/local_search.ejs`、`source/js/services.js`、`docs/knowledge/07-外部集成/search.md`、`09-高级主题/performance.md`、`知识库全量.md` | 本地搜索懒加载 + 缓存 TTL：新增 `search.local_search.lazy_load`（默认 `true`，首次聚焦搜索框才加载，缓存优先 + 后台刷新）与 `cache_ttl`（默认 `86400` 秒，`0` 不缓存）；缓存升级 `search_cache_v2`（`{ts, ttl, data}`），非懒加载模式缓存新鲜时同样不再重复请求；`local_search.ejs` 改为把完整配置合并进 `ctx.search`（见 `docs/designs/2026-08-15-search-lazy-load/`） |
| 2026-08-15 | `scripts/lib/search_index.js`（新增）、`scripts/generators/search.js`、`source/js/search/local-search.js`、`source/js/search/highlight.js`（新增）、`layout/_partial/scripts/defines.ejs`、`source/css/_components/sidebar/search.styl`、`docs/knowledge/07-外部集成/search.md`、`知识库全量.md`、主工程 `source/wiki/stellar/sidebar.md` | 本地搜索定位与高亮：索引追加 `anchors`（标题锚点 + 偏移），结果按章节拆分（页面标题 + 章节名），点击经 `?kw=关键词#锚点` 跳转对应章节，目标页用黄色 mark 高亮匹配词；无锚点命中（intro/仅标题）高亮后滚动到第一个匹配词；缓存升级 `search_cache_v4`，旧缓存回退页面级行为（见 `docs/designs/2026-08-15-search-locate-highlight/`） |
| 2026-08-15 | `source/js/utils.js` | 修复数据缓存写入报错 `Response body is already used`：`request` / `requestWithoutLoading` 中原本在延迟任务里才 `data.clone()`，此时回调已消费响应体导致 clone 抛错、缓存静默写不进去；改为在回调消费前同步 clone，延迟任务只读取克隆体（jsdom + 无头 Chrome 实测缓存正常写入、控制台无该报错） |
| 2026-08-15 | `source/js/main.js`、`source/css/_components/partial/navbar.styl`、`docs/knowledge/02-布局系统/logo-navigation-headers.md`、`05-前端交互/client-side-overview.md`、`知识库全量.md`、`docs/designs/2026-08-15-navbar-pin-card-glass/`、主工程 `source/wiki/stellar/advanced-settings.md` | navbar top 背景条状态切换：未吸顶为卡片样式（`var(--card)` 底色 + `$boxshadow-card` 阴影，与文章卡片一致），吸顶后恢复玻璃效果（`bar-glass()`）；`init.navbarPin()` 以 `offsetTop` 链求吸顶起点、在吸顶边界切换 `.pinned` 类，无 JS 保持卡片样式（见 `docs/designs/2026-08-15-navbar-pin-card-glass/`） |
| 2026-08-15 | `scripts/lib/doc_tree.js`（新增）、`scripts/events/lib/doc_tree.js`、`scripts/lib/notebooks.js`（新增）、`scripts/events/lib/notebooks.js`、`scripts/filters/lib/md_table.js`、`img_lazyload.js`、`img_onerror.js`、`scripts/generators/search.js`、`scripts/helpers/related_posts.js`、`test/doc_tree.test.js`（新增）、`test/notebooks.test.js`（新增）、`test/md_table.test.js`、`docs/knowledge/09-高级主题/performance.md`、`docs/designs/2026-08-15-build-performance/` | 构建期性能重构（仅 generate 阶段主题脚本）：doc_tree 按 wiki/path_key 单遍 Map 分组替代 O(W·P) filter/some 与 O(S·K·P) sections 组装；notebooks 单遍按 notebook 分组替代 O(NB·P) filter；md_table 无 `<table` 短路跳过 cheerio；img_lazyload/img_onerror 无 `<img` 短路；search skip_search 正则循环外编译；related_posts 删除未使用的全量 posts.filter 死代码；无配置/API/输出变化，受控微型站点旧 vs 新构建产物逐字节一致 |
| 2026-08-15 | `source/css/_custom.styl` / `_common/device.styl` / `_components/partial/navbar.styl` | `$bar-item-gap` 由 2px 增至 4px（派生 `$border-bar-container` 随之 14px→16px）；`.float-panel` 按钮由 36×36 增至 40×40（1:1，触控面积更大）；`.float-panel` 底部间距由 `calc(var(--inset) * 2)` 减为 `calc(var(--inset) * 1)`；`.navbar-container` 移除 `margin: 1px`；同步更新 `docs/knowledge/01-样式系统/responsive-design.md`、`02-布局系统/logo-navigation-headers.md`、`知识库全量.md` |
| 2026-08-15 | `layout/_partial/widgets/tree.ejs`、`related.ejs`、`components/link.ejs`、`source/css/_components/widgets/list.styl`、`components.styl`、`docs/designs/2026-08-15-active-dot/`、主工程 `source/wiki/stellar/sidebar.md` | 激活指示由异步书签 SVG 改为纯 CSS 小圆点：三处 `icon('default:bookmark.active')` 替换为 `<span class="active-dot"></span>`，list.styl / components.styl 新增与 menu.styl 一致的 `.active-dot`（8px、border-radius 50%、`x-theme-gradient()`）；消除占位符 1.5rem → active-icon 1rem 尺寸跳变导致的 wiki 左侧树抖动/闪烁，无 JS 时指示仍显示，每页减少约 1KB SVG 传输 |
| 2026-08-16 | `layout/_partial/main/navbar/article_banner.ejs`、`source/css/_components/partial/article-banner.styl`、`bread-nav.styl`、`docs/knowledge/03-内容系统/content-overview.md`、`docs/designs/2026-08-16-refactor-page-banner/`、主工程 `source/wiki/stellar/advanced-settings.md`、`docs/specs/page-banner-refactor/` | 页面横幅上块结构重构：显式拆为两行（第一行左侧面包屑 `.left#breadcrumb` + 右侧阅读时长/AI 标签 `.right`，第二行日期信息 `.meta-row` 靠左）；删除 `cap right` / `margin-left:auto` 右对齐 hack；`breadcrumb: false` 时不再输出空 `.top`；保留 `.banner` 共享基类，下块标题对齐规则与 banner_info 样式不变，视觉零回归 |
| 2026-08-16 | `source/css/_components/partial/article-banner.styl`、`docs/designs/2026-08-16-refactor-page-banner/` | 修复重构回归：`breadcrumb: false`（作者归档）页面移除空 `.top` 后，`.content` 的 `justify-content: space-between` 对唯一子元素失效导致 `.bottom` 被顶到横幅顶部；`.article.banner .content .bottom` 增加 `margin-top: auto`，使 `.bottom` 在有无 `.top` 时都贴底（有 `.top` 时与 space-between 结果一致，无回归） |
