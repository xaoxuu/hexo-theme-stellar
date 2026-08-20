# Changelog

## 1.43.1

> 发布日期：2026-08-20

### 修复
- 左栏 Footer Social 的外部图片图标统一为 24×24px，非方形图片保持原始比例，避免固有尺寸撑宽按钮或被裁切
- 发版脚本自动同步主题配置、包信息与安装知识库的版本号，并在最终待提交状态执行完整质量检查

Full Changelog: [1.43.0...1.43.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.43.0...1.43.1)

## 1.43.0

> 发布日期：2026-08-20

### 新功能
- Wiki 项目首页升级为完整 Hero：新增项目元信息、安装命令切换与复制、最新版本异步加载，并加入支持减弱动态效果的 WebGL 星河背景
- Wiki 项目卡片重构为项目预览布局，补充适用范围、版本与仓库信息展示
- Footer 新增通用下拉菜单、弹性占位项和自适应 social 布局；同时新增可复用的 `{% dropdown %}` 标签
- 同源整页导航默认启用原生 View Transition，旧浏览器自动回退普通导航
- 专栏列表按项目日期排序，文章列表超过阈值时以归档式折叠列表展示，可展开或收起其余文章

### 修复
- Mermaid 的 `style_optimization` 开关恢复正确语义，关闭时使用 Mermaid 官方主题，开启时应用 Stellar 优化样式，并修复图中文字不可见（#693）
- `{% sites %}` 网站卡片缺少图标时复用 siteinfo 服务自动补全，请求失败时保留默认图标（#387）
- navbar 在无轮播区页面顶部保持卡片样式，实际滚动 2px 后再切换为玻璃效果
- 修复 linklist 激活圆点被标题样式覆盖，以及文章分享图标尺寸不一致的问题

### 样式与重构
- 侧栏菜单、目录树、相关内容、Widget 与下拉菜单统一复用 collection 组件，收敛结构、密度、背景、暗色高亮和交互反馈
- Wiki Hero 调整版本标签布局、星河辉光与鼠标排斥效果
- 移动端根字号自动增加 2px，并统一正文、标题、列表与标签插件的响应式排版
- 评论区与异步数据服务统一使用自包含的三圆点 loading 动画，移除外部 loading 图标依赖

### 升级注意（配置变更与破坏性改动）
- 新增 `style.page_transition.enable`，默认 `true`；不需要原生跨文档过渡时可设为 `false`
- 移除 `style.font-size.body`，正文与组件字号统一从 `style.font-size.root` 派生；移动端根字号会在配置值基础上增加 2px
- 移除 `default.loading` 配置，loading 动画改为主题内置 SVG
- `footer.social` 支持 `type: dropdown`、`items` 与 `spacer`；旧的普通链接配置继续兼容

Full Changelog: [1.42.1...1.43.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.42.1...1.43.0)

## 1.42.1

> 发布日期：2026-08-17

### 修复
- 图片懒加载过滤器在 HTML 压缩器（如 hexo-minify `removeAttributeQuotes`）去除属性引号后，原正则跨标签越界，把页尾 bootstrap 内联脚本里的 `s.src = "/js/utils.js?v=..."` 误改写为「1×1 PNG 占位 + `data-src`」，导致 bootstrap 语法错误、`stellar is not defined` 连锁报错、scrollreveal 不初始化、`.slide-up` 文章列表延迟约 3 秒才显示；改为属性感知标签扫描并跳过 `<script>`/`<style>`/注释区域，同时兼容无引号 `src` 的图片懒加载
- bootstrap 的 utils 补载改用 `setAttribute('src')` 赋值，避免被基于 `s.src = "..."` 的朴素正则（图片懒加载 / 脚本延迟优化器）改写
- `layout/_plugins/index.ejs` 增加 `stellar.initPlugin` 兜底注册点：bootstrap 被第三方优化器改写/移除时不再产生 `stellar is not defined` 连锁报错，插件仍可注册运行

Full Changelog: [1.42.0...1.42.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.42.0...1.42.1)

## 1.42.0

> 发布日期：2026-08-16

### 新功能
- 文章卡片新增 `article.card_style`（`hero` / `classic`）：hero 全图文字封面卡片（有 cover 时标题 + 单行小字，文字区固定底部），classic 普通卡片；hero 与置顶轮播统一小字取值 `subtitle()`（`subtitle` > `description` > excerpt 前 50 字）
- 背景图/背景色上方文字颜色自适应（`plugins.adaptive_text`，默认开启）：`theme` / `contrast` / `split` 三种模式，按背景平均色计算并写入 `--text-banner` / `--text-banner-theme`，接入文章封面、专栏最新文章卡片、置顶轮播、页顶横幅与 `{% banner %}` 标签
- 专栏列表页重构为上下布局：标题 + 描述 + 全宽最新文章卡片 + 其他文章列表，抽出 `.post-panel` 公共组件（友链文章订阅同步复用）

### 修复
- 标签行负边距导致移动端页面横向溢出（#688）
- albums/posters 在 Firefox/Safari 标题竖排与遮罩消失问题（#689）
- Babel 转译将 `sidebar` 全局改名导致侧边栏失效
- 作者归档页横幅下块贴顶；页面顶部横幅黑色蒙版始终显示并贴边
- Safari 下顶部横幅与列表封面方角漏出（`isolation: isolate` + `translateZ(0)` + clip-path 兜底）
- banner 导航激活项 blur 导致 hover 圆角丢失
- TOC 回到顶部/参与讨论图标改为内联并修复占位符布局
- 轮播区/文章封面/页顶横幅/`{% banner %}` 图片角落跟随连续曲率圆角配置
- timeline 页脚评论图标尺寸与文字对齐

### 样式
- 文章卡片标签 `#` 前缀替换为 hashtag 图标
- banner hover 动画对齐封面（背景图缩放 1.05 + 变暗），封面渐变模糊层增加黑色蒙版
- 统一封面、轮播、页顶横幅与 banner 标签背景图覆盖层观感（`cover-overlay()`）
- 左栏「所有项目」返回胶囊默认背景复用目录树激活光照效果
- 间距令牌重构为 `--gap-base` / `--gap-page`：组件内部间距固定 16px，页面级留白随断点分档（16/32px），侧边栏贴边时四周间距一致
- 右栏在侧边栏基础宽度上单独加宽（新增 `--rightbar-width-extra`，默认 32px）
- 右栏 `.l_right .widgets` 桌面端 padding 归零，折叠抽屉保留 16px 0
- 折叠抽屉位移改为跟随自身宽度（`calc(100% + inset*2)`），修复右栏加宽后收拢仍露边

### 重构
- 移除已失效的 auto_banner（Unsplash 自动横幅）与 `poster` 配置
- 页面横幅上块重构为显式两行结构（面包屑 + 阅读时长/AI 标签 + 日期行）
- 评论数图标统一使用 `default:tocomment`，移除 `weibo:comment`

### 其他
- 移除知识库合并版 `知识库全量.md`，知识库以领域页面为唯一事实源
- 新增 AI 规范引用一致性检查（check-spec-refs）与发版前提交登记完整性检查（随 `npm run check` 执行）

### 升级注意（配置变更与破坏性改动）
- 移除 `article.auto_banner`（Unsplash 自动横幅已失效）与文章 front-matter `poster`（`headline` / `topic` / `caption`）；`poster.color` / `banner_info.color` 显式文字颜色不再生效，由自适应文字颜色接管
- 新增 `article.card_style`（`hero` 默认 / `classic`）：未显式设置的站点保持 hero 卡片样式
- 新增 `plugins.adaptive_text`（默认 `enable: true`）：页面存在 `[data-text-adaptive]` 元素时才按需加载，文字颜色默认随背景自适应
- 删除间距令牌 `--gap-margin` / `--gap-padding` / `--gap-max`，替换为 `--gap-base`（组件内部间距）与 `--gap-page`（页面级留白）；引用旧令牌的自定义 CSS 需迁移
- `weibo:comment` 图标已移除，评论数图标统一使用 `default:tocomment`；自定义中引用了 `weibo:comment` 的站点请改用 `default:tocomment`
- 知识库合并版 `知识库全量.md` 移除（RAG 可直接索引领域页面）

Full Changelog: [1.41.0...main](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.41.0...main)

## 1.41.0

> 发布日期：2026-08-15

### 新功能
- 本地搜索：搜索结果按章节拆分展示，点击直达章节锚点，目标页自动高亮关键词（`?kw=` 定位）
- 本地搜索：懒加载与缓存 TTL（`search.local_search.lazy_load` 默认开启、`cache_ttl` 默认 1 天）
- navbar 未吸顶时采用卡片样式，吸顶后恢复玻璃效果
- 文章末尾新增标签行（`article.tags`，默认开启）
- 内容表格统一铺满滚动与圆角边框
- 文章新增 AI 成分标签（front-matter `ai_label: manual | polished | generated | reviewed`，`article.ai_label` 配置文案与颜色，默认不渲染）

### 修复
- 移动端顶栏伸缩时 navbar 玻璃效果误消失
- 导航激活指示改为纯 CSS 小圆点，修复异步图标替换引起的抖动/闪烁
- 恢复标题锚点等页内链接平滑滚动
- 评论表情面板图片不再误触发 fancybox 弹窗
- 修正 toc 底部操作按钮分隔线选择器
- 修复 artalk 邮件链接无法定位评论区
- SEO 元数据修复：wiki 标题去重、`og:site_name`、JSON-LD 图片/描述回退、分页标题

### 样式
- 调整 navbar 与 float-panel 按钮尺寸与间距（40px、gap 4px、底部 inset ×1）

### 性能
- 按需加载与外置缓存优化，减小 html/css/js 体积
- 图标按命名空间异步加载，首屏关键图标保持内联
- 构建期脚本去重遍历与过滤器短路（generate 阶段优化）

### 重构
- 主题内置图标统一迁移到 `_data/icons.yml`
- 图标键统一为语义化命名空间（`default:` / 标签名命名空间），消除 `solar:`、`ph:`、`bxs:` 前缀

### 升级注意（配置变更与破坏性改动）
- 新增 `article.tags`（默认 `true`）：文章末尾显示标签行，不需要时设为 `false`
- 新增 `article.ai_label` 与 front-matter `ai_label` 字段：不设置时不渲染，历史文章零变化
- 新增 `search.local_search.lazy_load`（默认 `true`）与 `cache_ttl`（默认 `86400`）
- 破坏性变更：图标键为公开接口，`solar:*` 等旧前缀键已全部改名；站点若在 `source/_data/icons.yml` 覆盖或 `_config.stellar.yml` 引用旧键需同步改名（主工程已确认无此类覆盖）

Full Changelog: [1.40.0...1.41.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.40.0...1.41.0)

## 1.40.0

> 发布日期：2026-08-14

### 新功能
- 文章页新增字数与预计阅读时长显示（`article.reading_time`，默认关闭）
- 文章卡片新增标签展示（最多 5 个，`article.card_tags`，默认关闭）
- 新增表格标签 `{% table style:scroll|wrap|compact %}`，支持滚动/换行/紧凑三种表格样式
- 新增气泡注解标签 `{% tip text:... %}词句{% endtip %}`，桌面 hover、移动端点击显示
- 远程 Markdown 渲染抽象：`{% md %}` 标签新增可选 `wrap` 参数；wiki 项目配置 `repo` 后可直接以仓库 README 作为首页正文

### 修复
- wiki 项目描述作为页面描述（OG / JSON-LD）的兜底，修复 SEO 描述缺失的问题
- 声明 hexo-pagination / hexo-util 依赖并新增依赖声明检查门禁，修复幽灵依赖导致的构建问题
- 时间线节点标题（header）不再渲染 markdown 的问题（#401）
- 分类页三级及以上分类无法正确展示的问题，改为基于 parent 递归构建嵌套树（#564）
- 亮暗切换后 topbar 与左栏颜色不同步的问题：navbar/sidebar 暗色样式统一跟随 `data-theme` 开关（#593、#663）
- iOS Safari 下右下角悬浮控件在玻璃椭圆框中不对齐的问题（#599）
- artalk 邮件通知链接携带 `?atk_*` 参数导致目录定位失效的问题（#598）
- waline 最近评论接口返回结构兼容（数组 / `{ data: [...] }`）（#630）
- memos 新版 v1 接口识别与渲染适配，识别失败仍回退 feature 兜底（#668）
- new-note 命令生成 front-matter 的 date 对齐为 `YYYY-MM-DD HH:mm`（#594）

### 升级注意（配置变更与破坏性改动）
- 新增 `article.reading_time`（默认 `false`）与 `article.card_tags`（默认 `false`），需要时设为 `true`
- 新增 `table`、`tip` 两个标签插件；`table` 默认使用 `scroll` 样式

Full Changelog: [1.39.1...1.40.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.39.1...1.40.0)

## 1.39.1

> 发布日期：2026-08-13

### 新功能
- 置顶文章新增平铺样式配置 `article.pin_style: flat`：首页第一页不再渲染置顶轮播，置顶文章按与轮播一致的排序权重在文章列表靠前平铺展示

### 修复
- 用户内容统一 HTML 转义并移除圆点 aria-label，修复标题含引号导致构建失败

### 升级注意（配置变更与破坏性改动）
- 新增 `article.pin_style`（`carousel` / `flat`，默认 `carousel`）：默认行为不变；设置 `flat` 后首页置顶文章改为平铺样式展示

Full Changelog: [1.39.0...1.39.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.39.0...1.39.1)

## 1.39.0

> 发布日期：2026-08-13

### 新功能
- 左侧栏新增纯色卡片风格（`style.leftbar.ui-style: card`）：实色 `var(--card)` 背景 + 中间档阴影，列表项、搜索条交互与右栏观感一致
- 列表页新增置顶内容轮播：首页/归档/标签/分类/专栏/wiki 列表自动渲染置顶文章或项目（无需额外配置），bar UI 统一、分页器图标更新
- 头像彩虹光环改为 CSS 锥形渐变（`style.gradient.avatar`），不再依赖外部图片

### 修复
- 最新评论组件：正文转纯文本并截断、保留表情图并限高，修复侧栏布局
- 懒加载图片自动注册动态插入的图片
- 置顶轮播翻页按钮垂直居中
- integration 构建因 workspace 路径限制导致的 demo 检出失败

### 样式
- 压缩页面顶部与侧边栏间距，胶囊元素改为正圆端帽（`style.radius.bar` 默认 8px → 12px）
- 左栏卡片阴影透明度调整为 0.05，card 风格组件背景统一为 `var(--block)` / `var(--block-border)`
- 侧栏底部间距改为仅手机端生效，PC 上下统一为 gap-margin
- linklist 多列项按 leftbar 风格显示背景色
- 导航链接移除 corner-shape 覆盖，与父容器保持一致

### 其他
- 新增主题中文知识库（`docs/knowledge/`）、AI 协作规范与贡献指南
- integration 构建切换至 Hexo 8，并补充兼容适配方案
- 新增标签插件风格设计规范

### 升级注意（配置变更与破坏性改动）
- 新增 `style.leftbar.ui-style`（`glass` / `card`，默认 `card`）：未显式设置的站点升级后默认显示卡片风格，可用 `glass` 恢复原磨砂玻璃效果
- 新增 `style.gradient.avatar`（头像光环渐变色）；移除 `style.animated_avatar.background`
- 移除 `style.paginator.prev` / `style.paginator.next`（分页器图标改为内置 SVG）

Full Changelog: [1.38.0...1.39.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.38.0...1.39.0)

## 1.38.0

> 发布日期：2026-08-11

### 新功能
- 新增连续曲率圆角配置 `style.corner-shape`（默认 `superellipse(1.2)`）：所有带圆角的位置统一使用曲率连续的 squircle 曲线，自动适配容器宽高；文章卡片与横幅的渐变模糊改为「同图模糊层」实现以兼容连续曲率（仅 Chromium 139+ 原生支持，其余浏览器自动回退普通圆角，可设 `round` 关闭）
- 左栏导航列表化，wiki 内页增加返回按钮与搜索条交互优化
- 菜单栏激活/悬停图标与圆点支持可配置角度的主题色渐变（`style.gradient.angle`）
- 首页支持可配置评论区（默认关闭，`site_tree.home.comments`）
- 新增 mbti 标签

### 修复
- 补全 npm-publish workflow 的 GH_TOKEN，修复 GitHub Release 创建失败
- GitHub Release 正文不再包含 CHANGELOG 发布日期行
- 克隆站提示源站从 encoded 反解，防止批量替换域名误导
- 侧栏内部滚动容器组件 scrollreveal 不显示
- 仅当页面包含 toc 或评论时显示 toc 操作按钮
- wiki 封面「开始使用」按钮平滑滚动，#start 锚点贴顶定位

### 重构
- 移除官方备用站提示的关闭按钮与配置项

### 优化
- 动态数据组件缓存优化：同 URL 请求去重、memos 用户详情缓存、stale 兜底

### 样式
- 侧栏光照效果覆盖相关卡片、返回胶囊与 widget 操作按钮
- 侧栏导航区边距调整
- 左栏激活书签等彩色图标使用主题色渐变
- 侧栏高亮项顶部叠加白色光照渐变与高光边
- 左侧栏底部留白调整为 32px
- 作者页与错误页侧栏不再显示时间线
- 移动端顶部导航吸顶距离调整为 8px

### 升级注意（配置变更与破坏性改动）
- 新增 `style.corner-shape`（默认 `superellipse(1.2)`）：连续曲率圆角仅 Chromium 139+ 生效，其余浏览器自动回退普通圆角；设置 `round` 可关闭
- 新增 `style.gradient.angle` 与 `site_tree.home.comments` 配置
- 移除 `canonical.closeEnable`、`canonical.closeText` 配置项：官方备用站提示不再支持手动关闭

Full Changelog: [1.37.0...1.38.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.37.0...1.38.0)

## 1.37.0

> 发布日期：2026-08-09

### 新功能
- 发版全自动化：`npm run release` 一键完成版本号更新（`_config.yml` + `package.json`）与 CHANGELOG 非空校验，并推送 main 与 npm 分支
- npm 分支推送自动发布：`release: ` 开头提交触发 CI 自动完成 npm publish、版本 tag 与 GitHub Release，Release 正文取自 CHANGELOG.md 对应章节；已发布版本与已存在 Release 幂等跳过

### 其他
- CHANGELOG.md 历史数据一次性从 GitHub Releases API 同步入库（76 个版本，统一格式）
- 新增发版流程文档（docs/guides/release-process.md）与设计记录（docs/designs/2026-08-09-release-automation.md）

Full Changelog: [1.36.0...1.37.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.36.0...1.37.0)

## 1.36.0

> 发布日期：2026-08-09

### 新功能
- 动态数据本地缓存：友链、时间线、最新评论、Memos、RSS、GitHub 信息、卡片链接等动态数据统一接入 stale-while-revalidate 缓存（新增 data_cache 配置），TTL 内不再重复请求外部 API，过期后先显示缓存再后台刷新
- emoji 标签支持 url: 参数直接引用外部图片，无需引入整套表情包
- 恢复左栏滚动位置：在同一 Wiki / 笔记本分区内切换页面后，左栏停留在上次位置，激活项不可见时自动小幅滚动修正
- ScrollReveal 默认开启（plugins.scrollreveal.enable: true）

### 修复
- 修复 TOC 高亮始终落在最后一个标题的问题
- TOC 目录链接改为自定义平滑滚动，与「回到顶部」「参与讨论」体验统一，落点偏移与高亮判定一致
- 修复带锚点打开页面或浏览器恢复滚动位置时，侧栏吸顶组件一直隐藏的问题（按吸顶容器单独 reveal）
- 无标题层级的内容页不再丢失「回到顶部 / 参与讨论」操作按钮
- 修复正文图片假懒加载：{% image %} 改为 1×1 占位 + data-src，图片真正进入视口后才加载
- 修复 Mermaid 图表不渲染：默认 CDN 从 v9 升级到 v11
- 修复评论系统加载回归：删除 PJAX 时代残留的评论重初始化死代码，评论脚本恢复为 module 模式

### 重构
- 移除 jQuery 依赖，以原生 DOM 封装替代，全站不再加载 jQuery
- 懒加载重构：强制开启、不再有 enable 开关，no-lazy 是唯一例外；fancybox 改为 mode: auto / global 按需加载；评论区图片统一走视口懒加载
- 移除 style.smooth_scroll 全局配置，滚动体验统一由 JS 控制

### 配置变更（升级注意）
- 新增 data_cache 配置块（enable / default_ttl / ttl / max_entries）
- plugins.fancybox 新增 mode，移除 tag_plugins.image.fancybox
- 移除 dependencies.jquery、comments.lazyload、style.smooth_scroll
- 站点若通过 inject.script 注入依赖全局 $ 的脚本，升级后需改为原生实现

Full Changelog: [1.35.0...1.36.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.35.0...1.36.0)

## 1.35.0

> 发布日期：2026-08-08

### 其他

- 移除 PJAX 支持：页面导航改为整页刷新，解决动态组件不刷新、评论系统切换等边界问题
- 统一 URL 路径规范化逻辑，修复 canonical 标签路径不一致的问题
- 修复 wiki 文档树中索引页（index）的路径匹配错误
- 发版脚本迁移为 Node CLI（release.js），支持版本校验、dry-run 预览与二次确认
- 完善仓库 AI 协作规范（AGENTS.md、issue 处理规则），重组 docs 目录（designs/、guides/、audits/）
- 优化 npm 发布忽略规则（.npmignore）

Full Changelog: [1.34.0...1.35.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.34.0...1.35.0)

## 1.34.0

> 发布日期：2026-08-08

### 其他
* add new-note command by @Zane-Jiang in https://github.com/xaoxuu/hexo-theme-stellar/pull/595
* fix: chat.js by @thun888 in https://github.com/xaoxuu/hexo-theme-stellar/pull/610
* fix: chat.styl by @thun888 in https://github.com/xaoxuu/hexo-theme-stellar/pull/611
* fix: katex by @thun888 in https://github.com/xaoxuu/hexo-theme-stellar/pull/608
* fix: resolve katex.min.css being blocked by @gsh1209 in https://github.com/xaoxuu/hexo-theme-stellar/pull/624
* opt: canonical logic by @tovarsh in https://github.com/xaoxuu/hexo-theme-stellar/pull/627
* feat: support separate light/dark leftbar background colors when using solid color by @gsh1209 in https://github.com/xaoxuu/hexo-theme-stellar/pull/622
* fix: chat-file, dark mode, etc. by @thun888 in https://github.com/xaoxuu/hexo-theme-stellar/pull/617
* fix: support Memos 0.25.0+ by @MikeWu597 in https://github.com/xaoxuu/hexo-theme-stellar/pull/631
* feat: add rss by @thun888 in https://github.com/xaoxuu/hexo-theme-stellar/pull/633
* feat: support pjax to implement non-refresh loading by @XZB-1248 in https://github.com/xaoxuu/hexo-theme-stellar/pull/640
* fix: pjax not refresh dynamic components on page changed by @XZB-1248 in https://github.com/xaoxuu/hexo-theme-stellar/pull/645
* Fix: Reinitialize comments after PJAX navigation by @xaoxuu with @Copilot in https://github.com/xaoxuu/hexo-theme-stellar/pull/646
* Fix PJAX navigation between pages with different comment systems by @xaoxuu with @Copilot in https://github.com/xaoxuu/hexo-theme-stellar/pull/647
* Fix duplicate CSS loading during pjax comment reinitialization by @xaoxuu with @Copilot in https://github.com/xaoxuu/hexo-theme-stellar/pull/650
* fix: preserve user theme preference during PJAX navigation by @cuiruileo in https://github.com/xaoxuu/hexo-theme-stellar/pull/658
* fix: 将 XML/RSS 文件加入 PJAX 黑名单  by @cuiruileo in https://github.com/xaoxuu/hexo-theme-stellar/pull/661
### 新贡献者
* @Zane-Jiang made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/595
* @MikeWu597 made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/631
* @XZB-1248 made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/640
* @xaoxuu with @Copilot made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/646
* @cuiruileo made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/658

Full Changelog: [1.33.1...1.34.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.33.1...1.34.0)

## 1.33.1

> 发布日期：2025-07-17

### 其他
- feat: 增加 mathjax v3 的支援 by @flyinglimao in https://github.com/xaoxuu/hexo-theme-stellar/pull/587
- fix: custom color #589
- fix: emoticons@3.1
### 新贡献者
* @flyinglimao made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/587

Full Changelog: [1.33.0...1.33.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.33.0...1.33.1)

## 1.33.0

> 发布日期：2025-07-06

### 其他

- feat: 新增投票和评分标签
- opt: artalk ui
- fix: canonical in 404 page
- fix: pretty_urls.js by @thun888 in https://github.com/xaoxuu/hexo-theme-stellar/pull/585
- fix: search path

Full Changelog: [1.32.4...1.33.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.32.4...1.33.0)

## 1.32.4

> 发布日期：2025-07-04

### 其他

- fix: canonical
- opt: doc’s contributors
- opt: ui

Full Changelog: [1.32.3...1.32.4](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.32.3...1.32.4)

## 1.32.3

> 发布日期：2025-06-30

### 其他

- Artalk 支持 imageUploader
- 样式优化

Full Changelog: [1.32.2...1.32.3](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.32.2...1.32.3)

## 1.32.2

> 发布日期：2025-06-29

### 其他

- 页脚结构优化
- 配色方案重构，网站背景图现在有更完善的适配。
- 图片懒加载优化，现在支持对动态数据中的图片进行懒加载，例如动态友链、时间线等。

Full Changelog: [1.32.1...1.32.2](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.32.1...1.32.2)

## 1.32.1

> 发布日期：2025-06-28

### 其他

- 修复UI问题
- 修复未知问题（quote 标签改名为： blockquote）
- 优化懒加载图片缓存策略

Full Changelog: [1.32.0...1.32.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.32.0...1.32.1)

## 1.32.0

> 发布日期：2025-06-27

### 其他

- 大量样式优化（特别是Artalk）
- 为 lazyload 功能添加配置项 loading_image by @lambdark in https://github.com/xaoxuu/hexo-theme-stellar/pull/574
- 图片懒加载时，不再发生高度调变
- artalk_latest_comment by @thun888 in https://github.com/xaoxuu/hexo-theme-stellar/pull/579
- 支持从主页隐藏文章 `indexing: false`
- 移除已不支持的 unsplash 封面接口
- 本地搜索体验优化

Full Changelog: [1.31.0...1.32.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.31.0...1.32.0)

## 1.31.0

> 发布日期：2025-06-21

### 其他
- 增加 canonical 标签，并增加备用站提示和非法克隆站警告信息。（canonical加密校验，增加盗站成本）
- structured data #50 and #470
- 移除掉即将过期的 `vlts.cc` 服务，支持自部署
- Theme color-scheme selector error by @ThatCoders in https://github.com/xaoxuu/hexo-theme-stellar/pull/573

Full Changelog: [1.30.4...1.31.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.30.4...1.31.0)

## 1.30.4

> 发布日期：2025-06-20

### 其他

- 适配 iOS 26
- 增加 quote 标签

Full Changelog: [1.30.3...1.30.4](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.30.3...1.30.4)

## 1.30.3

> 发布日期：2025-06-17

### 其他

- 适配 iOS 26
- 支持自定义技术文章内页各级标题前面的符号

Full Changelog: [1.30.2...1.30.3](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.30.2...1.30.3)

## 1.30.2

> 发布日期：2025-06-15

### 其他
- 内置的 `cdn.jsdelivr.net` 地址统一修改为：`gcore.jsdelivr.net`
- 内置依赖库版本号修改
- 大量样式优化（包含期待已久的标题风格差异化）
- 修复 tabs 标签显示问题

Full Changelog: [1.30.1...1.30.2](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.30.1...1.30.2)

## 1.30.1

> 发布日期：2025-06-15

### 其他
- 新增了带最新文章的友链布局，使用方法为原友链标签中增加 `posts:true` 参数，例如：`{% friends posts:true api:xxx %}`，需搭配最新版动态友链。
- 样式优化

Full Changelog: [1.30.0...1.30.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.30.0...1.30.1)

## 1.30.0

> 发布日期：2025-06-03

### 其他
* fix: link path in nav_tabs_blog.ejs by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/508
* [feat] support memos Version management by @ThatCoders in https://github.com/xaoxuu/hexo-theme-stellar/pull/505
* fix: youtube iframe by @abc1763613206 in https://github.com/xaoxuu/hexo-theme-stellar/pull/517
* fix: ensure tags and categories are arrays before iterating by @Cactusinhand in https://github.com/xaoxuu/hexo-theme-stellar/pull/512
* 优化 local search 逻辑 by @Cactusinhand in https://github.com/xaoxuu/hexo-theme-stellar/pull/521
* [fix] skip_search is not iterable by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/526
* [fix] notebooks undefined by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/527
* [fix] scrollreveal l_right by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/528
* [fix] mathjax render by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/532
* [feat] comment new widgets by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/530
* [fix]: 修复hexo路由改变造成无法正常加载theme资源文件的bug by @ttaydes in https://github.com/xaoxuu/hexo-theme-stellar/pull/535
* [fix] js unexpected token by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/534
* [fix] tabs mermaid syntax error by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/536
* [fix] empty wiki  delete in loop by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/537
* fix(notebooks): fix bug in notebooks generator by @calfzhou in https://github.com/xaoxuu/hexo-theme-stellar/pull/543
* [fix] algoliasearch is not defined by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/542
* fix: 页面没有使用tags生成keywords，文章搜索没有生成tags和categories by @LinWhite2333 in https://github.com/xaoxuu/hexo-theme-stellar/pull/540
* feat: 优化stellar搜索引擎 by @codepzj in https://github.com/xaoxuu/hexo-theme-stellar/pull/538
* fix: refine katex overflow style by @calfzhou in https://github.com/xaoxuu/hexo-theme-stellar/pull/544
* add chat tag plugin by @HcGys in https://github.com/xaoxuu/hexo-theme-stellar/pull/560
* [fix]更换 sites 截图提供商 by @Catwb in https://github.com/xaoxuu/hexo-theme-stellar/pull/565
* [fix] 修复folding标签渲染异常问题 by @lambdark in https://github.com/xaoxuu/hexo-theme-stellar/pull/562
* [fix] 修复mermaid暗色配置项的一个小问题 by @HisMax in https://github.com/xaoxuu/hexo-theme-stellar/pull/567
### 新贡献者
* @abc1763613206 made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/517
* @Cactusinhand made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/512
* @ttaydes made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/535
* @LinWhite2333 made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/540
* @codepzj made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/538
* @Catwb made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/565
* @lambdark made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/562
* @HisMax made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/567

Full Changelog: [1.29.1...1.30.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.29.1...1.30.0)

## 1.29.1

> 发布日期：2024-08-13

### 其他
* l10n: Update zh-TW translation by @pan93412 in https://github.com/xaoxuu/hexo-theme-stellar/pull/497

Full Changelog: [1.29.0...1.29.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.29.0...1.29.1)

## 1.29.0

> 发布日期：2024-06-16

### 其他
* [feat] support run-time theme switch, and visitor preferred theme by @calfzhou in https://github.com/xaoxuu/hexo-theme-stellar/pull/449
* ✨ local search打开文章url改进：避免文章设置永久链接导致点击打开失败 by @Achuan-2 in https://github.com/xaoxuu/hexo-theme-stellar/pull/450
* [fix] render article footer in wiki pages by @calfzhou in https://github.com/xaoxuu/hexo-theme-stellar/pull/460
* fix(stellar-artalk): bump version, fix site name escape by @songtianlun in https://github.com/xaoxuu/hexo-theme-stellar/pull/452
* 添加阅读标签 by @HcGys in https://github.com/xaoxuu/hexo-theme-stellar/pull/462
* [feat] add notebook support by @calfzhou in https://github.com/xaoxuu/hexo-theme-stellar/pull/464
* [fix] fix typo - missing `;` for `&quot;` by @calfzhou in https://github.com/xaoxuu/hexo-theme-stellar/pull/469
* fix(bug): 文章banner非法属性, 目录讨论按钮逻辑 by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/475
* [fix] #477 bad appearence with no prefers-color-scheme by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/478
* feat: 评论区视口懒加载 by @KazariEX in https://github.com/xaoxuu/hexo-theme-stellar/pull/480
* [fix] multi renderer support, resolve #476 by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/481
* [fix] related_posts title by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/485
* [fix] tianli_gpt layout by @thun888 in https://github.com/xaoxuu/hexo-theme-stellar/pull/486
* [fix] video tag by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/487
* feat: add youtube video by @Laitr0n in https://github.com/xaoxuu/hexo-theme-stellar/pull/491
* fix: load script synchronously by @KazariEX in https://github.com/xaoxuu/hexo-theme-stellar/pull/482
### 新贡献者
* @songtianlun made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/452
* @HcGys made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/462
* @KazariEX made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/480
* @thun888 made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/486
* @Laitr0n made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/491

Full Changelog: [1.28.1...1.29.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.28.1...1.29.0)

## 1.28.1

> 发布日期：2024-04-27

### 其他
* [feat] fixes xaoxuu#442: img fancybox supports providing a different image for popup by @calfzhou in https://github.com/xaoxuu/hexo-theme-stellar/pull/444
* [opt] gist darkmode textcolor by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/445
* [fix] copy failure by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/446

Full Changelog: [1.28.0...1.28.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.28.0...1.28.1)

## 1.28.0

> 发布日期：2024-04-23

### 其他
**新特性**
- 支持 algolia 搜索
- 有评论的页面支持滚动到评论区（需要 toc 组件）
- 优化 twikoo 表情显示
- 移动端 Safari 状态栏区域颜色跟随主题
- 其它样式优化
**修复**
- 修复 copy 按钮复制失败问题
- 修复 swiper 组件相关问题
* [fix] #405 emoji incomplete display due to border-radius by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/406
* 优化twikoo表情显示 by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/410
* update waline_3.1.3 to fix reaction error by @gsh1209 in https://github.com/xaoxuu/hexo-theme-stellar/pull/412
* [opt] navbar, sidebar-list, footer by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/399
* [fix] error handler for codeCopyBtn by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/419
* [fix] #413 extra breadcrumb on author's page by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/418
* [feat] algolia_search by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/423
* [fix] #402 dark statusbar theme-color on phone by @L33Z22L11 in https://github.com/xaoxuu/hexo-theme-stellar/pull/424
* [fix] swiper cycle invalid by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/425
* [fix] tianli_gpt layout by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/429
* [fix] proj.comments false by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/430
* [feat] scroll to comment by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/431
* [opt] twikoo fllow $color-theme by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/421
* [opt] algolia_search filter by @weekdaycare in https://github.com/xaoxuu/hexo-theme-stellar/pull/434
* fixd #436 white space caused by using border-radius and hidden overflow by @gsh1209 in https://github.com/xaoxuu/hexo-theme-stellar/pull/440
### 新贡献者
* @gsh1209 made their first contribution in https://github.com/xaoxuu/hexo-theme-stellar/pull/412

Full Changelog: [1.27.0...1.28.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.27.0...1.28.0)

## 1.27.0

> 发布日期：2024-03-03

### 其他
**新特性**

- 新增右侧栏，原 `sidebar` 更名为 `leftbar`

**重要变更**

- toc 样式修改为适应右边栏，不建议放在左边栏了
- plugins 插件重构
- 内置服务配置转移到 `data_services ` 中
- 配置中的替换符号 `${xxx}` 由于存在冲突，格式更改为 `{xxx}`
- Waline 评论插件升级到 3.x

**修复**

- 修复了 macOS 系统上的 `.DS_Store` 文件导致报错的问题

Full Changelog: [1.26.8...1.27.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.26.8...1.27.0)

## 1.26.8

> 发布日期：2024-02-04

### 其他
**新特性**

- linkcard 数据服务支持自部署：[site-info-api](https://github.com/xaoxuu/site-info-api/)

**优化**

- 统一暗色模式下卡片高亮效果

Full Changelog: [1.26.7...1.26.8](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.26.7...1.26.8)

## 1.26.7

> 发布日期：2024-02-04

### 其他
**请不要安装这个版本**

Full Changelog: [1.26.6...1.26.7](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.26.6...1.26.7)

## 1.26.6

> 发布日期：2024-02-03

### 其他
**新特性**

- 新增 button 标签组件 [#button](https://xaoxuu.com/wiki/stellar/tag-plugins/express/#button-%E6%8C%89%E9%92%AE)
- 支持在 topic 和 wiki 中设置 banner，应用到全部页面
- 支持在 topic 和 wiki 中设置 type，应用到全部页面

**优化**

- 优化 okr 在移动端显示
- 合并文章内 block 和 card 类圆角配置 -> card [_config.yml#L492](https://github.com/xaoxuu/hexo-theme-stellar/blob/aae8176876e4cfbe3650b1497cd63d35d0d5cb22/_config.yml#L492)
- 新增 card-l 配置单独侧边栏和文章横幅的圆角 [_config.yml#L491](https://github.com/xaoxuu/hexo-theme-stellar/blob/aae8176876e4cfbe3650b1497cd63d35d0d5cb22/_config.yml#L491)

Full Changelog: [1.26.5...1.26.6](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.26.5...1.26.6)

## 1.26.5

> 发布日期：2024-02-02

### 其他
**新特性**

- 新增 [icon 标签组件](https://xaoxuu.com/wiki/stellar/tag-plugins/express/#icon-%E5%9B%BE%E6%A0%87%E6%A0%87%E7%AD%BE)

**优化**

- 优化多处样式

**修复**

- 修复部分页面侧边栏顶部间距消失问题

Full Changelog: [1.26.4...1.26.5](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.26.4...1.26.5)

## 1.26.4

> 发布日期：2024-01-31

### 其他
**新特性**

- 支持设置全站背景 [_config.yml#L525-L528](https://github.com/xaoxuu/hexo-theme-stellar/blob/9c906cc02bf209b8b8823f696fffeac5501a3372/_config.yml#L525-L528)

**优化**

- 大量字体默认调大一号
- 优化文章顶部区域
- 优化暗黑模式下的卡片阴影效果（改为彩色阴影）
- 优化了时间线标签标题部分的链接的样式
- 优化了微信分享展开动画
- 优化了各级标题样式
- 简化了行内链接样式

**修复**

- 修复了在 menu 和 social 位置使用 `icons.yml` 配置链接失效的问题

Full Changelog: [1.26.3...1.26.4](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.26.3...1.26.4)

## 1.26.3

> 发布日期：2024-01-22

### 其他
**优化**

- logo 区防止 title 过长时 icon 被压缩
- logo 区的 title 字号调小至 1.5rem
- 增加 css 和 js 的版本号，后续更新版本后应该不需要强制刷新了
- tagcloud 样式适配新的侧边栏风格

**修复**

- 修复了作者归档页漏掉的筛选逻辑（仅显示作者的文章）

Full Changelog: [1.26.2...1.26.3](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.26.2...1.26.3)

## 1.26.2

> 发布日期：2024-01-22

### 其他
**优化**

- 优化 wiki 页面的搜索框默认占位文字
- 专栏页面侧边栏的 logo 不再定制为专栏名，而是显示和博客页相同的内容
- 适配 fancybox 插件 5.0 版本，image 标签支持 `fancybox:groupName` 设置为不同的组，并且每个 gallery 组件都是单独的一个组
- katex、mathjax、mermaid 支持在配置文件中设置全局开启
- 图片默认载入效果从 blur 改为 fade，如果喜欢 blur 可以在主题配置文件中自行修改

**重要变更**

- 移除了 instant_page 支持（效果不如 flying_pages）

**修复**

- 修复了作者归档页漏掉的筛选逻辑（仅显示作者的文章）

Full Changelog: [1.26.1...1.26.2](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.26.1...1.26.2)

## 1.26.1

> 发布日期：2024-01-21

### 其他
**优化**

- wiki 的最近更新过滤掉没有标题的页面
- 当前激活页的书签图标改为主题色

**修复**

- 修复了新用户未配置 `menubar.items` 时报错的问题
- 修复了 Mac 用户未设置忽略 `.DS_Store` 时产生的报错

Full Changelog: [1.26.0...1.26.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.26.0...1.26.1)

## 1.26.0

> 发布日期：2024-01-21

### 其他
**新特性**

- 侧边栏支持设置背景图、高速模糊、渐变效果
- 侧边栏主导航菜单支持设置图标、支持设置列数
- 支持在 `_data/icons.yml` 中配置图标
- 侧边栏新增 `linklist` 组件，支持图标、网格和列表布局
- 侧边栏 `markdown` 组件新增 `linklist` 参数，写法同 `linklist` 组件
- 大多数内置图标都可以通过在 `_data/icons.yml` 中覆盖同名配置来修改了
- 支持设置 `article.type` 来增大字体和图文间距，以优化图文类博客阅读体验

**重要变更**
- 移除 `seo_title` 字段，如果要隐藏页内标题，请设置 `h1: ''`
- 侧边栏主导航菜单由 `menu` 改为 `menubar`
- 不再支持 `pin: true` 来置顶，因为官方已经支持该功能，方法为： `sticky: 数字`
- 搜索框不再是组件，而是独立功能，支持在 front-matter 和项目配置文件中覆盖参数
- wiki 配置文件中的 `path` 更名为 `base_dir`

Full Changelog: [1.25.0...1.26.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.25.0...1.26.0)

## 1.25.0

> 发布日期：2024-01-14

### 其他
**新特性**

- 新增「专栏」功能 [> 了解详情](https://xaoxuu.com/wiki/stellar/topic.html)
- 标签组件 video/audio 支持设置是否自动播放
- 标签组件 video支持设置最大宽度（可用于竖屏视频）
- 支持各个部分的默认 `menu_id` 设置

**重要变更**

- 原配置 `sidebar` 部分重构，其中的 `logo` 和 `menu` 提升一个层级，`wisgets` 转移到 `site_tree` 中的 `sidebar` 配置
- 原配置 `post-index` 和 `post_list` 移除，现在转移到 `site_tree` 中的 `nav_tabs` 配置
- 原配置 `wiki_dir` 和 `author_dir` 移除，现在转移到 `site_tree` 中的 `base_dir` 部分配置
- 原配置 `subtitle` 从站点配置文件转移到主题配置文件的 `logo` 中

上述变更详见主题配置文件 [#_config.yml](https://github.com/xaoxuu/hexo-theme-stellar/blob/e77bfecf1f59785192bff1cc3ab8b68b1b064899/_config.yml#L20-L77)

Full Changelog: [1.24.1...1.25.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.24.1...1.25.0)

## 1.24.1

> 发布日期：2024-01-13

### 其他
**新特性**

- video 标签组件现在支持 bilibili [#video](https://xaoxuu.com/wiki/stellar/tag-plugins/express/#video-%E8%A7%86%E9%A2%91%E6%A0%87%E7%AD%BE)

**修复**

- 修复了搜索输入后再清空时一直显示【没有找到内容！】的问题

Full Changelog: [1.24.0...1.24.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.24.0...1.24.1)

## 1.24.0

> 发布日期：2024-01-12

### 其他
**新特性**

- 在 license 中可以使用 `${author.name}` 来自动替换为当前文章作者名字
- 新增 md 标签组件，使用方法为 `{% md https://host/path/file.md %}`
- 侧边栏组件 markdown 新增 `src` 字段，支持渲染外部 markdown 文件
- 新增 audio 和 video 组件
- 网格组件 grid 重要更新：支持设置列数、列宽、间距、圆角了

**重要变更**

- 网格组件 grid 中的分隔符写法变更，现在仅支持 `<!-- cell -->` 固定写法
- 代码复制按钮和归档页面样式优化

Full Changelog: [1.23.0...1.24.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.23.0...1.24.0)

## 1.23.0

> 发布日期：2024-01-08

### 其他
**新特性**
- 支持使用自建的 giscus 服务，只需要修改 `src` 参数即可
- TOC 组件支持配置是否自动折叠 `collapse: false # true / false / auto` [#toc](https://xaoxuu.com/wiki/stellar/widgets/#toc)
- 新增 [albums](https://xaoxuu.com/wiki/stellar/tag-plugins/container/#albums-%E4%B8%93%E8%BE%91%E5%AE%B9%E5%99%A8) 和 [posters](https://xaoxuu.com/wiki/stellar/tag-plugins/container/#posters-%E6%B5%B7%E6%8A%A5%E5%AE%B9%E5%99%A8) 组件，适合用于显示专辑列表、电影或游戏海报列表，数据源： `_data/links/xxx.yml`
- front-matter 通过设置 `h1: ''` 可以隐藏文章页面内的文章标题
- front-matter 支持设置 `inject` 参数来植入外部代码
- 支持一站多作者，在 `_data/links/authors.yml` 中设置作者之后，第一个作者为默认作者；在 front-matter 中设置 `author: xxx` 来指定本文作者
- copy 组件支持 `prefix` 参数，可以在复制内容前面显示一些文本（但不会被复制）

**重要变更**
- firends 和 sites 组件使用的 `_data/links.yml` 文件需要按组拆分成 `_data/links/xxx.yml`
- 优化默认 footer 的主题信息，可显示版本号

Full Changelog: [1.22.1...1.23.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.22.1...1.23.0)

## 1.22.1

> 发布日期：2023-12-30

### 其他
**重要变更**
- 不再支持 `parse_markdown: true` 来将 `![]()` 替换成 `{% image xxx %}`

**修复**
- 修复了默认配置下 Gallery 不显示的问题

Full Changelog: [1.22.0...1.22.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.22.0...1.22.1)

## 1.22.0

> 发布日期：2023-12-30

### 其他
**新特性**
- Gallery 标签组件重磅升级，支持多种布局，可自定义默认配置，详见 [#Gallery](https://xaoxuu.com/blog/20231223/)
- TOC 现在会自动展开和折叠

**修复**
- 修复 timeline(memos) 组件不显示数据的问题
- 修复 Artalk 2.7.x 兼容性问题

Full Changelog: [1.21.0...1.22.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.21.0...1.22.0)

## 1.21.0

> 发布日期：2023-12-22

### 其他
**新特性**
- 时间线适配 memos 数据源 [#memos](https://xaoxuu.com/wiki/stellar/third-party/memos/)
- 支持在 front-matter 中覆盖设置 `open_graph` 字段 [#覆盖 open-graph](https://xaoxuu.com/wiki/stellar/pages/#覆盖-OpenGraph)
- 新增 gallery 标签组件 [#gallery](https://xaoxuu.com/wiki/stellar/tag-plugins/container/#gallery-%E5%9B%BE%E5%BA%93%E5%AE%B9%E5%99%A8)
- 新增 banner 标签组件 [#banner](https://xaoxuu.com/wiki/stellar/tag-plugins/container/#banner-%E6%A8%AA%E5%B9%85%E5%AE%B9%E5%99%A8)

**重要变更**
- ablock 标签组件重命名为 box (批量替换即可）
-  navbar 组件的 active 字段含义从索引改为了连接 [#navbar](https://xaoxuu.com/wiki/stellar/tag-plugins/express/index.html#navbar-%E5%AF%BC%E8%88%AA%E6%A0%8F)
- references 写法变更，由 `{title, url}` 对象改为了 md 格式的链接列表。 [#参考资料](https://xaoxuu.com/wiki/stellar/pages/index.html#%E5%8F%82%E8%80%83%E8%B5%84%E6%96%99)

Full Changelog: [1.20.0...1.21.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.20.0...1.21.0)

## 1.20.0

> 发布日期：2023-12-11

### 其他
**新特性**
- 新增内置标签 `okr`，[> 了解详情](https://xaoxuu.com/wiki/stellar/tag-plugins/express/#okr-%E7%9B%AE%E6%A0%87%E7%AE%A1%E7%90%86)
- wiki 页面的 GitHub 信息显示在右上角
- 文章：鼠标移动到发布时间时，会额外显示更新时间
- wiki 页面页脚支持显示 `license` 和 `share`

**重要变更**
- 内置标签：`tag` 更名为 `hashtag`
- wiki 配置方法重做，[> 了解详情](https://xaoxuu.com/wiki/stellar/wiki-settings/)
- 笔记模块配置方法重做，[> 了解详情](https://xaoxuu.com/wiki/stellar/wiki-settings/notes/)

Full Changelog: [1.19.0...1.20.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.19.0...1.20.0)

## 1.19.0

> 发布日期：2023-05-09

### 其他
**新特性**
- Waline 图床新增上传可选项 (#237)
- 支持把 markdown 格式的图片解析成图片标签 (#252)
- 增加对 mermaid 流程图的支持 (#263)
- 增加 AI 摘要 (#287)
- 代码块复制按钮 (#288)

**重要变更**
- 统一微信二维码分享链接 (#236)

**修复**
- 修复子目录部署 loadScript, search (#264)
- 修复分类和标签页不显示分页器 (#291)

Full Changelog: [1.18.5...1.19.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.18.5...1.19.0)

## 1.18.5

> 发布日期：2022-12-21

### 其他
- `F` 修复复制标签失效问题

Full Changelog: [1.18.4...1.18.5](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.18.4...1.18.5)

## 1.18.4

> 发布日期：2022-12-19

### 其他
- `M` 为了防止冲突，`emoji` 标签配置中的名称部分由 `%s` 改为 `${name}`
- `M` `npm` 包此后将由 GitHub Actions 发布

Full Changelog: [1.18.3...1.18.4](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.18.3...1.18.4)

## 1.18.3

> 发布日期：2022-12-19

### 其他
- `F` 修复搜索不准确的问题 #211
- `M` 优化 `folding` 和 `folders` 样式

Full Changelog: [1.18.2...1.18.3](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.18.2...1.18.3)

## 1.18.2

> 发布日期：2022-12-16

### 其他
- `F` 修复没有搜索框时的报错
- `M` 优化搜索框样式，项目封面按钮改为动态渐变
- `A` 新增若干样式自定义选项
- `M` 页面滚动时自动滚动目录到可见区域

Full Changelog: [1.18.1...1.18.2](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.18.1...1.18.2)

## 1.18.1

> 发布日期：2022-12-15

### 其他
- `A` 新增 Artalk 评论
- `M` swiper 插件升级到 `8.x` 版本，支持 `effect` 参数
- `F` 修复若干问题

Full Changelog: [1.18.0...1.18.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.18.0...1.18.1)

## 1.18.0

> 发布日期：2022-12-10

### 其他
- `A` 增加 `tag` 标签
- `A` 时间线增加微博数据支持
- `M` `border` 标签重命名为 `ablock`
- `M` `split` 标签重命名为 `grid`
- `M` `theme.style.color` 配置简化

Full Changelog: [1.17.2...1.18.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.17.2...1.18.0)

## 1.17.2

> 发布日期：2022-11-29

### 其他
- `M` home/blog/wiki 等页面的侧边栏默认布局可以分开设置
- `A` 搜索支持禁用代码块以减少体积
- `M` 优化搜索文件体积
- `F` 修复在 front-matter 中使用 `layout:xx` 创建侧边小组件的不显示的问题

Full Changelog: [1.17.1...1.17.2](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.17.1...1.17.2)

## 1.17.1

> 发布日期：2022-11-28

### 其他
- `M` 内置搜索功能，使用 `json` 文件格式，默认全部索引。
- `F` fix bug #190

> 更新到 1.17.1 之后，搜索直接就可以用啦～

Full Changelog: [1.17.0...1.17.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.17.0...1.17.1)

## 1.17.0

> 发布日期：2022-11-28

### 其他
- `A` 新增搜索组件（需搭配插件 [hexo-generator-search](https://github.com/wzpan/hexo-generator-search)） `npm i hexo-generator-search`
- `M` 文章分页优化（建议更新到 hexo 6.3.0+ 版本）

Full Changelog: [1.16.2...1.17.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.16.2...1.17.0)

## 1.16.2

> 发布日期：2022-11-23

### 其他
- `F` 修复只有一篇文章时 recent 组件导致报错的问题
- `A` 支持设置 `mark` 标签默认颜色，[#详情](https://github.com/xaoxuu/hexo-theme-stellar/blob/904be4160c48515304c95d81211f83ae6a205594/_config.yml#L223-L224)
- `A` 支持在 `front-matter` 中创建侧边栏组件，[#详情](https://xaoxuu.com/wiki/stellar/widgets/#%E4%B8%93%E7%94%A8%E7%BB%84%E4%BB%B6)
- `A` 支持在 `front-matter` 中覆盖 `repo` 属性（用于一个 wiki 中有多个分页且每个分页展示不同的 repo 信息）

Full Changelog: [1.16.1...1.16.2](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.16.1...1.16.2)

## 1.16.1

> 发布日期：2022-11-23

### 其他
- `F` 修复空内容的 issue 导致整个 timeline 不显示的问题
- `F` 修复标题重复问题

Full Changelog: [1.16.0...1.16.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.16.0...1.16.1)

## 1.16.0

> 发布日期：2022-11-20

### 其他
- `M` 优化移动端右下角侧边栏按钮样式
- `M` 优化 `blockquote` 样式，降低醒目度
- `M` 支持为项目单独设置不同的评论系统
- `M` 默认的 `widgets` 布局配置改为字符串，避免了数组无法覆盖的问题
- `M` 优化了 wiki 部分代码，提高 generate 性能
- `M` 优化了 wiki 侧边栏布局，顶部标题不再固定置顶，提高目录区域可滚动面积
- `F` 修复了 `tabs`、`folders`、`timeline`、`split` 标签内无法使用 `md` 格式代码块的问题

Full Changelog: [1.15.1...1.16.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.15.1...1.16.0)

## 1.15.1

> 发布日期：2022-11-07

### 其他
- `F` 修复开启 `open_graph` 之后 `description` 标签重复的问题

Full Changelog: [1.15.0...1.15.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.15.0...1.15.1)

## 1.15.0

> 发布日期：2022-11-06

### 其他
- `A` 增加 `api_host` 配置，可自定义
- `M` 优化页面标题 `<head>` 标签
- `M` 更新依赖库版本
- `A` 增加 `gist` 代码片段样式兼容
- `M` 时间线增加 `hover` 特效

Full Changelog: [1.14.0...1.15.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.14.0...1.15.0)

## 1.14.0

> 发布日期：2022-11-05

### 其他
- `A` 时间线标签支持隐藏 `user`
- `A` 侧边栏时间线组件支持显示朋友圈数据
- `F` 修复时间线在 Windows 系统部分浏览器显示滚动条的 BUG
- `M` 优化 `link` 标签数据填充逻辑，已有数据不再覆盖。
- `M` 优化部分默认样式，例如封面、时间线
- `A` `note` 和 `border` 标签的 `color` 字段新增两种颜色 `warning` 和 `error`
- `M` 为避免歧义，文章封面全图卡片字段调整：
```yaml
poster: # 海报（可选，全图封面卡片，需搭配 cover 使用）
topic: 标题上方的小字 # 可选
headline: 大标题 # 必选，否则不生效
caption: 标题下方的小字 # 可选
color: 标题颜色 # white, red...，默认为跟随主题的动态颜色
```

Full Changelog: [1.13.0...1.14.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.13.0...1.14.0)

## 1.13.0

> 发布日期：2022-10-29

### 其他
- `A` 内置 [友链朋友圈](https://github.com/Rock-Candy-Tea/hexo-circle-of-friends) 极简版
- `A` 首页文章检索栏支持自定义 `post-index`
- `A` 时间线标签支持显示友链朋友圈数据
- `M` 移除 `Valine` 评论插件
- `A` 时间线标签支持隐藏标题和底部栏 `hide:title,footer`
- `M` 原 `friends` 和 `site` 标签数据合并至 `links.yml` 文件，动态数据 API 升级至 `v2` 版本，需要将友链仓库同步更新。

**备注：友链仓库更新方法**
- 如果是直接 fork 我的友链仓库，可以如图所示直接点击同步：
<img width="410" alt="image" src="https://user-images.githubusercontent.com/16400144/198840265-07e05ac0-b552-4c35-8c21-0e296422ed5a.png">

- 否则需要：[issues-json-generator](https://github.com/xaoxuu/issues-json-generator) 仓库源码下载下来，文件全部替换到自己的仓库，注意隐藏文件 `.github` 中的也要同步，否则 CI 无法工作。

Full Changelog: [1.12.0...1.13.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.12.0...1.13.0)

## 1.12.0

> 发布日期：2022-10-27

### 其他
- `F` fix darkmode
- `A` 新增侧边栏 `timeline ` 组件
- `M` 简化相关文章样式、上一篇下一篇样式
- `M` 优化动态数据组件和标签的加载动画
- `M` `wiki_more` 标签更名为 `related`
- `M` `link` 标签现在可以自动获取图标、标题和摘要，原 `description:string` 参数改为 `desc:bool`
- `M` `grid` 标签更名为 `border`
- `A` 新增 `split` 标签
- `A` 新增 `tagcloud` 标签云侧边栏组件
- `M` 文章封面信息设置方式更改：
- `cover_info.title` -> `cover-title`
- `cover_info.meta` -> `cover.cat`
- `cover_info.subtitle` -> `cover-subtitle`
- `M` 项目参数中新增 `name` 属性，用于表示项目名，原 `title` 表示项目标题，例如：
```yaml
stellar:
name: Stellar
title: Stellar - 每个人的独立博客
...
```

Full Changelog: [1.11.0...1.12.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.11.0...1.12.0)

## 1.11.0

> 发布日期：2022-10-20

### 其他
- `M` `timeline` 标签支持直接显示 GitHub 更新日志 [API](https://api.github.com/repos/xaoxuu/hexo-theme-stellar/releases)
- `M` 支持在配置文件中自定义主题颜色
- `M` 侧边栏组件配置从 `_config.yml` 中转移到数据文件 `_data/widgets.yml` 中，且仅支持在数据文件中配置。
- `M` 侧边栏组件布局由 `sidebar.widgets_layout` 改名为 `sidebar.widgets`
- `M` `ghrepo` 组件重构
- `A` 新增 `folders` 标签，相当于一组折叠标签。

Full Changelog: [1.10.0...1.11.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.10.0...1.11.0)

## 1.10.0

> 发布日期：2022-10-14

### 其他
- `M` 优化 `footer` 支持完全自定义
- `A` 支持 `smooth_scroll` 平滑滚动效果
- `A` 侧边栏 `ghinfo` 支持显示 `Stars` 和 `Forks` 数量
- `A` 侧边栏新增 `ghuser` 标签，显示 GitHub 用户基础信息
- `A` 时间线标签 `timeline` 新增支持动态时间线功能 `api:xxx`
- `A` 更新 `Waline` 评论到 `1.1.0` 版本，新增哔哩哔哩小黄脸表情
- `M` 优化 `about` 标签
- `A` 新增支持自定义 `font-family`

Full Changelog: [1.9.0...1.10.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.9.0...1.10.0)

## 1.9.0

> 发布日期：2022-09-05

### 其他
- `A` 支持 `Mathjax` 和 `Katex` 公式渲染
- `A` 支持 [highlightjs](https://fastly.jsdelivr.net/gh/highlightjs/cdn-release@11.5.0/build/styles/) 代码高亮主题
- `A` 新增 `users` 标签，用于显示用户列表，支持从GitHub拉取数据
- `A` 支持 [giscus](https://giscus.app/zh-CN) 评论
- `A` 适配 `waline` 暗黑模式
- `F` 修复 Firfox 浏览器中显示侧边栏滚动条的问题

Full Changelog: [1.8.0...1.9.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.8.0...1.9.0)

## 1.8.0

> 发布日期：2022-05-27

### 其他
- `A` 新增适配 `waline` 评论插件
- `M` 为兼容 Hexo 6.2.0 版本，`noteblock` 标签改名为 `grid` 标签
- `M` 修改 `cdn.jsdelivr.net` 的节点为 `fastly.jsdelivr.net`

Full Changelog: [1.7.0...1.8.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.7.0...1.8.0)

## 1.7.0

> 发布日期：2022-03-29

### 其他
- `A` 新增 `quot` 标签和 `poetry` 标签
- `A` 新增支持 [heti](https://github.com/sivan/heti) 插件优化中文排版样式
- `M` 优化 `fancybox` 加载逻辑
- `M` 优化文章封面

Full Changelog: [1.6.1...1.7.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.6.1...1.7.0)

## 1.6.1

> 发布日期：2021-11-20

### 其他
- `F` 修复 `1.6.0` 的层级问题
- `M` 优化样式

Full Changelog: [1.6.0...1.6.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.6.0...1.6.1)

## 1.6.0

> 发布日期：2021-11-19

### 其他
- `M` 优化 `link` 标签，`img` 参数名改为 `icon`
- `M` 去掉默认的 `menu`
- `M` 优化侧边栏 `markdown` 组件，`content` 改为字符串类型
- `M` 优化侧边栏 `social` 配置
- `M` 优化侧边栏默认组件配置 [_config.yml#L27-L31](https://github.com/xaoxuu/hexo-theme-stellar/blob/4d33c50a8b9360796b01faa75db90156f2d0fe4b/_config.yml#L27-L31)
- `M` 优化友链标签

Full Changelog: [1.5.2...1.6.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.5.2...1.6.0)

## 1.5.2

> 发布日期：2021-10-23

### 其他
- `M` 支持始终暗黑模式
- `F` 修复若干BUG
- `M` 优化样式

Full Changelog: [1.5.1...1.5.2](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.5.1...1.5.2)

## 1.5.1

> 发布日期：2021-10-23

### 其他
- `F` 修复若干BUG
- `M` 支持自定义面包屑导航的「首页」文案

Full Changelog: [1.5.0...1.5.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.5.0...1.5.1)

## 1.5.0

> 发布日期：2021-10-23

### 其他
- `A` 新增 `mark` 标签
- `M` 优化样式

Full Changelog: [1.4.2...1.5.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.4.2...1.5.0)

## 1.4.2

> 发布日期：2021-10-23

### 其他
- `M` 优化样式
- `M` 优化翻译

Full Changelog: [1.4.1...1.4.2](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.4.1...1.4.2)

## 1.4.1

> 发布日期：2021-10-23

### 其他
- `F` 修复若干BUG
- `M` 优化样式
- `A` 新增 `emoji` 标签

Full Changelog: [1.4.0...1.4.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.4.0...1.4.1)

## 1.4.0

> 发布日期：2021-07-26

### 其他
- `A` 鼠标放在页脚的 Stellar 上可以看到版本号
- `A` 支持自动根据 `tags` 作为关键词通过 [Unsplash API](https://source.unsplash.com) 自动设置文章封面
- `A` 支持 `cover: 关键词` 方式通过 [Unsplash API](https://source.unsplash.com) 设置文章封面
- `A` 支持目录树分组 `sections`
- `A` 增加 `toc` 标签，可以设置仅在移动端显示
- `M` 项目的分类属性 `group` 改为标签属性 `tags`，和文章的 `tags` 用法相同，支持单个或多个标签。[#分类和标签](https://hexo.io/zh-cn/docs/front-matter#%E5%88%86%E7%B1%BB%E5%92%8C%E6%A0%87%E7%AD%BE)

Full Changelog: [1.3.0...1.4.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.3.0...1.4.0)

## 1.3.0

> 发布日期：2021-07-25

### 其他
- `M` 优化 wiki 解析逻辑，支持数据文件 `projects.yml`
- `M` 优化代码字体在 Windows 平台的兼容性
- `M` 优化 wiki 侧边栏
- `M` 优化若干组件样式
- `M` 优化 `tabs`、`timeline` 标签，不再需要 `<!-- endtabs -->` 结束符，详见文档。
- `M` 优化 `folding`、`noteblock` 标签，支持多彩代码块，设置代码块参数由 `codeblock:true` 调整为 `child:codeblock`，使其具有更好的扩展性。
- `A` 自定义 scrollbar 尺寸，设置为 0 可隐藏。
- `A` 文章页脚如果没有参考资料、版权声明、分享组件，现在可以完全隐藏
- `A` 新增 `Twikoo` 和 `Beaudar` 评论插件支持
- `M` 为了防止歧义，侧边栏默认布局的属性由 `sidebar.widgets.default` 改为 `sidebar.widgets.default_layout`
- `F` 修复若干 BUG

Full Changelog: [1.2.1...1.3.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.2.1...1.3.0)

## 1.2.1

> 发布日期：2021-07-25

### 其他
- `F` 修复懒加载问题

Full Changelog: [1.2.0...1.2.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.2.0...1.2.1)

## 1.2.0

> 发布日期：2021-07-25

### 其他
- `F` 修复若干 BUG
- `A` 支持站点配置文件中的 `favicon` 字段
- `M` Wiki 侧边栏优化
- `A` 新增页脚自定义 sitemap

Full Changelog: [1.1.1...1.2.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.1.1...1.2.0)

## 1.1.1

> 发布日期：2021-07-25

### 其他
- `M` 布局优化
- `M` 翻译优化
- `F` 修复 iOS 上代码字体大小错乱的问题
- `F` 修复若干 BUG

Full Changelog: [1.1.0...1.1.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.1.0...1.1.1)

## 1.1.0

> 发布日期：2021-07-25

### 其他
- `A` 适配系统 `dark` 模式
- `A` 头像彩虹描边动效
- `M` Valine 优化

Full Changelog: [1.0.1...1.1.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.0.1...1.1.0)

## 1.0.1

> 发布日期：2021-07-25

### 其他
- `A` 新增 `Valine` 评论支持
- `A` 侧边栏组件默认值为 `welcome`、`recent`

Full Changelog: [1.0.0...1.0.1](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.0.0...1.0.1)

## 1.0.0

> 发布日期：2021-07-25
