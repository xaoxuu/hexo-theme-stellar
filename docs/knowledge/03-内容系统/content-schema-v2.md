# v2 内容配置契约

> 本页是 v2 公开 YAML / Front Matter 的权威边界。其它章节中与本页冲突的 v1 字段名仅属历史记录，v2 运行时不会读取。

## 命名边界

- Stellar 自有 YAML / Front Matter 字段：`snake_case`。
- JavaScript 变量、函数与对象 API：`camelCase`；类：`PascalCase`。
- CSS class、HTML 自有扩展属性与文件名：`kebab-case`。
- 第三方参数袋保持上游字段：Galaxy options 使用 `starSpeed` 等 React Bits props，Giscus 使用 `data-repo` 等 HTML 属性。

## 集合字段

Wiki、Topic 和 Notebook 共用：

| 字段 | 语义 |
| --- | --- |
| `name` | 面包屑等紧凑位置的短名称，必填 |
| `headline` | 集合卡片和 Hero 主标题，缺失时取 `name` |
| `tagline` | 一行辅助文案 |
| `description` | 完整描述与 SEO 回退 |
| `identity.icon` | 项目身份图标 |
| `card.cover` | 集合列表卡片封面 |
| `hero` | 集合首页 Hero |
| `sidebar.left/right` | 集合页面的左右栏 |
| `navigation` | 菜单与导航 |
| `article` | 集合内容默认排版 |
| `footer` | 许可、分享与参考资料 |
| `comments` | 集合评论默认值 |
| `source` | 源码仓库与分支 |
| `route` | 内容路径：Wiki / Notebook 使用 `path`，Topic 可额外使用 `start` |
| `listing` | 集合排序、分页和摘要 |

`identity.icon`、`card.cover`、`hero.background.image` 不互相充当回退。即使使用同一资源，也要在对应作用域显式配置。

## 页面字段

| 对象 | 子字段 |
| --- | --- |
| `collection` | `profile`, `id` |
| `card` | `cover`, `tagline` |
| `banner` | `enabled`, `image`, `avatar`, `headline`, `tagline` |
| `sidebar.left` | `widgets`, `search`, `menu`, `brand`, `wiki_home` |
| `sidebar.right` | `widgets` |
| `navigation` | `menu`, `breadcrumb` |
| `article` | `type`, `indent`, `author`, `ai_label` |
| `footer` | `references`, `license`, `share` |
| `comments` | `enabled`, `title`, `id`, `provider`, `options` |
| `visibility` | `listed`, `searchable` |
| `listing` | `priority` |
| `source` | `repository`, `branch` |
| `render` | `math`, `diagrams` |
| `seo` | `open_graph` |
| `inject` | `head`, `script` |

`visibility.listed: false` 从博客、专栏、笔记本与 Wiki 目录/最近列表中排除页面，不影响路由生成。`visibility.searchable: false` 仅从站内搜索索引排除。

`listing.priority` 必须是不小于 `0` 的有限数字；只有大于 `0` 时置顶。

## Brand

全局 `site.brand` 与页面/集合的 `sidebar.left.brand` 最终投影为相同 ViewModel 结构：

```yaml
site:
  brand:
    image:
      src: /images/avatar.webp
      variant: avatar
      url: /about/
      background: 'var(--block)'
    name: Stellar
    tagline: 每个人的独立博客
    url: /
```

ViewModel 的 `image.variant` 只能是：

- `avatar`：正圆裁剪、`object-fit: cover`，保留头像旋转背景效果。
- `icon`：`$border-card-s` 圆角矩形裁剪、`object-fit: contain`。
- `plain`：`object-fit: contain`，不裁剪、不设置圆角；禁止配置 `background`。

`image` 是原子对象：内容作用域覆盖不会继承上级图片的部分字段，并在建模边界规范化为 `variant`。背景默认透明，只能显式配置。`image.url` 控制图片链接，Brand 根级 `url` 控制名称链接。`name` 可包含受信任的内联 HTML，但不解析 Markdown 链接；完整 `[文本](链接)` 写法会在构建期报迁移错误。

解析顺序是页面 `sidebar.left.brand`、集合 `sidebar.left.brand`、类型默认和全局 `site.brand`。Wiki / Notebook 的类型默认会从 `identity.icon`自动生成 Brand，缺失时使用 `hexo.stellar.config.resources.fallbacks.projectIcon`，不从 `card.cover` 等其它角色回退。Topic 的类型默认是直接继承全局 Brand，只有显式的 `sidebar.left.brand` 才覆盖。

手机端 Brand 自动显示于主页、分类/标签页面及索引、专栏索引、Wiki 索引、笔记本索引和笔记列表；文章、普通页面、Wiki/Topic/Notebook 内容页、归档、作者页和 404 隐藏。v2 不提供显示开关。

## 第三方边界

Galaxy 的路径为 `hero.background.effect.options`，其 React Bits props 保持上游 camelCase；评论系统的上游字段统一放入 `comments.options`。两类参数袋的父级容器严格封闭，不在根级放行第三方字段。

## 构建期内容模型

普通 Post 在 `before_generate` 完成严格配置校验，并在 `after_post_render` 取得最终正文后生成 `page.viewModel`。该对象提供冻结的 `collection`、`item` 与 Post 专属 `render` 投影，不暴露可变的 Hexo Document、Query、Moment 或配置来源：

- `collection` 是 Post profile 的 `CollectionModel`，顶层固定为 `id`、`profile`、`identity`、`source`、`route`、`navigation`、`listing`、`presentation`、`visibility`。
- `item` 是 `ContentItemModel`，日期转为 ISO 字符串，标签与分类转为字符串数组，路径完成规范化；导航、列表、展示和可见性已经完成级联。
- `render.document` 固化最终语言、页面级 head 注入与根文档主题状态；`render.layout` 固化 `pageType`、`articleType`、缩进、侧栏表面、Brand、博客路径与面包屑；`render.seo` 固化 title、description、keywords、robots、canonical、Open Graph 与 JSON-LD。
- `render.article` 固化正文排版开关、带路径的标签、已解析 Footer、上下篇、相关文章结果，以及评论服务、线程 id 与服务参数袋。
- `render.listing` 固化博客卡片、置顶轮播、平铺列表与归档需要的路由、封面、摘要、日期、分类、最多五个标签、作者、优先级和可见性。
- Post 的 Schema 校验、模型构建、Reference 与 EJS 消费同一 `render` 事实来源；缺少或非法 `render` 时按源文件构建失败，不回退到 `page` 或主题字段。
- 级联顺序为页面 Front Matter、Post profile、主题全局配置；`false`、`0` 与空字符串是有效覆盖值。Brand 图片继续按原子对象替换，不继承上级图片子字段。
- 普通 Post、Topic、Wiki 与 Notebook 的根 Shell、左右侧栏、Brand、菜单、面包屑、SEO、正文辅助区、Footer、导航、评论和聚合条目均已消费 ViewModel。Hexo 仍只为聚合页提供分页及当前筛选状态；生成器把最终列表投影作为显式 local 交给模板。

纯构建入口位于 `scripts/lib/models/index.js`。普通 Post 在 `before_generate` 登记输入，详情页由 `after_post_render` 结合最终正文和 Hexo 关系完成模型，列表条目由 `post_view_model` helper 从同一登记输入重建冻结投影；Wiki 页面在 `doc_tree` 完成树形解析后挂载，Topic 在文章渲染阶段完成，Note 则在 Notebook 树完成后以两阶段流程完成。

### Topic 与文章

严格 `collection.profile: topic` 的文章在生成前登记基础输入，并在 `after_post_render` 取得最终正文、上下篇与相关文章后生成同构、深度冻结的 `page.viewModel`：

- `collection` 保留 Topic 名称、标题、说明、受众、身份图标、源码仓库、规范化路由、集合列表设置和展示配置；顶层字段与 Post profile 一致。
- `navigation.series` 只包含 Front Matter 显式归属同一 Topic id 且 `visibility.listed !== false` 的文章，默认按日期降序稳定排列；每项只投影普通 id、标题、规范化路径、ISO 日期和当前项标记。
- Topic 是否位于 `topic.publish_list` 只进入 `collection.visibility.listed`；单篇文章从独立的默认可见性开始，再接受页面 `visibility` 覆盖，不把集合下架隐式传播为文章隐藏。
- Topic 默认沿用站点 Brand 和普通 Post 侧栏，之后依次接受 Topic profile、集合与页面展示覆盖；文章、页脚和评论同样在构建期完成级联。
- Topic 文章必须显式声明严格 v2 `collection.profile` 与 `collection.id`，id 必须存在于 `_data/topic/`；不会从路径、布局、旧 `topic` 字段或运行时 Topic tree 推断归属。
- `render.document/layout/seo/article/listing` 复用 Post 的文章语义；Topic Hero 背景只作为成员 Banner 回退，`navigation.series` 只服务侧栏专栏导航，不替换正文的 Hexo 全站上下篇。
- Topic 详情、博客列表/置顶/归档与 Topic 索引均消费显式 ViewModel 或生成器投影，不再由 EJS 读取 Topic tree 推断最终状态。

### Wiki 与 Wiki 页面

严格 `collection.profile: wiki` 页面在 Wiki 树构建完成后生成同构 `page.viewModel`：

- `collection` 保留 Wiki 的名称、主标题、副标题、长描述、受众与身份图标，以及项目源码仓库、规范化 `route.path/homepage`、列表与 shelf 可见性。
- `navigation.tree` 从 `doc_tree.sections` 投影为冻结的普通分组与页面节点，包含 id、标题、规范化路径、页码和首页标记，不保留 `WikiPage` 实例。
- `item` 在构建期完成页面导航、列表、展示、源码与可见性级联；页面源码可以逐字段覆盖 Wiki 源码，项目 `hero.background.image` 作为页面 Banner 图片默认值并可被页面显式覆盖。
- shelf 只表示 Wiki collection 的聚合可见性，不会隐式隐藏项目内页面；页面继续由自身 `visibility.listed/searchable` 决定。
- 页面必须显式声明严格 v2 `collection.profile` 与 `collection.id`，id 必须能解析到 `_data/wiki/` 项目；不从布局、路径或 v1 `wiki` 字段推断归属。
- `render.document/layout/seo` 固化文档、布局、最终 Brand、导航和完整 SEO；`render.cover` 只允许集合首页启用 Hero；`render.article` 固化 Banner、README、Footer、上下篇、评论和 related；`render.listing` 固化 Wiki 卡片、排序、置顶与可见性。
- Wiki 详情页复用公共 Shell/Region/Section/Item/Navigation 并向 partial 传递显式 ViewModel locals；缺少合法 `render` 时构建失败。Wiki 索引生成器只传递 `wikiIndex.items/allItems/tags`，卡片、筛选、置顶和 tabs 不读取原始 Wiki tree。

### Notebook 与 Note

严格 `collection.profile: notebook` 的 Note 在生成前先登记冻结输入和 collection base，Notebook 树完成后再生成同构 `page.viewModel`：

- `collection` 保留 Notebook 的名称/标题/说明/身份图标、源码仓库、规范化 `route.path`、标签导航、列表分页/排序/摘要设置和 Note 展示默认值。
- `navigation.tags` 只从同一严格 Notebook id 下的 Note 标签构造；层级标签拆为冻结的普通对象，包含规范化 id、名称、末段标签、父级和标签页路径。
- `item` 在构建期完成页面导航、`listing.priority`、`visibility.listed/searchable`、侧栏、文章、页脚和评论级联；页面源码可以覆盖 Notebook 源码字段。
- Note 必须显式声明严格 v2 `collection.profile` 与 `collection.id`，id 必须存在于 `_data/notebooks/`；不会从布局、路径或 v1 `notebook` 字段推断归属。
- `render.document/layout/seo/article/listing` 固化文档状态、布局、最终 Brand、完整 WebPage SEO、Banner、日期、标签、Footer、评论与卡片字段；缺少合法 `render` 时按来源终止构建。
- Notebook Open Graph 保持 WebPage 的 `website` 类型，并保留既有发布时间、更新时间与标签 meta；`footer.license: true` 在模型层映射到全局 Article 许可文本，保留既有启用语义。
- 第一阶段用已完成的临时 ViewModel 投影所有 Notebook、标签与 Note 列表，形成深度冻结的 `notebookIndex`；第二阶段把显式 `tagTree` 与 `recentItems` 写入每个详情 ViewModel 后再次校验和冻结。
- Notebook 总索引、集合首页和标签分页只消费生成器传入的 `page.notebookIndex`；卡片、筛选、置顶、标签树、最近笔记和详情 partial 不读取原始 Notebook tree。`visibility.listed: false` 的 Note 不进入列表与 recent 投影；原始 tree 仅保留给尚未迁移的非模板兼容接口。

## Reference 元数据

Pre-alpha M1 已从模型 Schema 生成首批机器可读 Reference；这项能力是 Alpha 1 的前置交付，不代表 Alpha 版本已经建立：

- 模型事实来源是 `scripts/schema/model-schema.js`；Collection / Front Matter 输入事实来源是 `scripts/schema/config-target.js` 与由它投影的 `scripts/schema/content-config-schema.js`。
- 每个已交付字段均带类型、默认值语义、作用域、当前消费方和最小示例。动态默认值用 `derived`、`inherited` 或 `computed` 描述，不伪造固定字面量。
- `scripts/lib/models/` 在冻结模型前使用同一 Schema 拒绝缺失字段、未声明字段和错误类型，避免实现与 Reference 漂移。
- `npm run reference:generate` 稳定生成 `reference/v2-models.json` 和 `reference/v2-config.json`；后者已包含 delivered 的 Theme、Collection 与 Front Matter 作用域，并排除 Hexo 自有字段。`npm run reference:check` 只读检查漂移，已纳入 `npm run check`。
- 第三方评论参数袋、widget 对象和 effect options 保持开放对象边界；元数据不复制上游字段表。

Reference 输出仍不包含 Blueprint、CLI、布局原语或 Extension Schema；五类原语是内部 EJS 契约，不进入当前模型 Reference。`ContentItemModel.layout` 是 #695–#698 已交付的模型字段。

## 校验与消费链

Collection 与 Front Matter 不再由手写字段表定义：`scripts/schema/content-config-schema.js` 直接从目标契约投影两个作用域 Schema，`scripts/lib/config-schema.js` 统一执行类型、封闭边界、迁移错误、规范化、camelCase 投影与深冻结。`scripts/events/lib/content-config.js` 对每个输入只解析一次，并登记冻结的 `collectionConfigs` / `pageConfigs`。

- 普通 Post 在 `before_generate` 登记已解析输入，在 `after_post_render` 使用最终 HTML、标签关系、prev/next 与可选相关文章结果完成详情模型；博客聚合消费同一登记输入。
- `scripts/lib/content-config.js` 保留作用域包装、来源化错误和 `isListed` / `isSearchable` 等内容语义，不再维护第二套手写字段表。
- 路由、导航、侧栏和页面字段由声明式 Schema 严格校验；错误继续包含配置来源、字段路径与迁移目标。
- `scripts/helpers/collection.js` 向 EJS 提供 `collection_id(page, type)`，不再读取 `page.wiki/topic/notebook`。
- `scripts/lib/brand.js` 与 `scripts/helpers/brand.js` 解析 Brand 优先级、集合自动值和手机端显示矩阵。
- Wiki 与 Notebook 数据树都在两阶段建模后投影冻结的索引、导航和列表数据；Topic 索引也只消费显式投影。搜索生成器继续消费共享可见性语义。

旧字段、未知字段和错误类型都会汇总为 `ContentConfigError`，消息包含源文件与字段路径；运行时没有 v1 别名或错误类型自动转换。
