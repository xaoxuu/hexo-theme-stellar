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
| `routing` | 内容路径 |
| `listing` | 集合排序、分页和摘要 |

`identity.icon`、`card.cover`、`hero.background.image` 不互相充当回退。即使使用同一资源，也要在对应作用域显式配置。

## 页面字段

| 对象 | 子字段 |
| --- | --- |
| `collection` | `type`, `id` |
| `card` | `cover`, `tagline` |
| `banner` | `enabled`, `image`, `avatar`, `headline`, `tagline` |
| `sidebar.left` | `widgets`, `search`, `menu`, `brand`, `wiki_home` |
| `sidebar.right` | `widgets` |
| `navigation` | `menu`, `breadcrumb` |
| `article` | `type`, `indent`, `author`, `ai_label` |
| `footer` | `references`, `license`, `share` |
| `comments` | `enabled`, `title`, `id`, `service`, 各服务参数袋 |
| `visibility` | `listed`, `searchable` |
| `listing` | `priority` |
| `source` | `repository`, `branch` |

`visibility.listed: false` 从博客、专栏、笔记本与 Wiki 目录/最近列表中排除页面，不影响路由生成。`visibility.searchable: false` 仅从站内搜索索引排除。

`listing.priority` 必须是不小于 `0` 的有限数字；只有大于 `0` 时置顶。

## Brand

全局 `brand` 与页面/集合的 `sidebar.left.brand` 使用相同结构：

```yaml
brand:
  image:
    src: /images/avatar.webp
    style: avatar
    url: /about/
    background: 'var(--block)'
  name: Stellar
  tagline: 每个人的独立博客
  url: /
```

`image.style` 只能是：

- `avatar`：正圆裁剪、`object-fit: cover`，保留头像旋转背景效果。
- `icon`：`$border-card-s` 圆角矩形裁剪、`object-fit: contain`。
- `plain`：`object-fit: contain`，不裁剪、不设置圆角；禁止配置 `background`。

`image` 是原子对象：覆盖时必须同时提供 `src` 和 `style`，不会继承上级图片的部分字段。背景默认透明，只能显式配置。`image.url` 控制图片链接，Brand 根级 `url` 控制名称链接。`name` 可包含受信任的内联 HTML，但不解析 Markdown 链接；完整 `[文本](链接)` 写法会在构建期报迁移错误。

解析顺序是页面 `sidebar.left.brand`、集合 `sidebar.left.brand`、类型默认和全局 `brand`。Wiki / Notebook 的类型默认会从 `identity.icon`自动生成 Brand，缺失时使用 `theme.default.project`，不从 `card.cover` 等其它角色回退。Topic 的类型默认是直接继承全局 Brand，只有显式的 `sidebar.left.brand` 才覆盖。

手机端 Brand 自动显示于主页、分类/标签页面及索引、专栏索引、Wiki 索引、笔记本索引和笔记列表；文章、普通页面、Wiki/Topic/Notebook 内容页、归档、作者页和 404 隐藏。v2 不提供显示开关。

## 第三方边界

Galaxy 的路径为 `hero.background.effect.options`，字段白名单在 `scripts/lib/content-config.js` 的 `GALAXY_OPTION_TYPES` 中与 React Bits props 对齐。评论服务对象仅校验为 object，内部字段由对应上游服务规定。

## 构建期内容模型

普通 Post 在 `generateBefore` 的严格配置校验后生成 `page.viewModel`。该对象只提供冻结的 `collection` 与 `item`，不暴露可变的 Hexo Document、Query、Moment 或配置来源：

- `collection` 是 Post profile 的 `CollectionModel`，顶层固定为 `id`、`profile`、`identity`、`source`、`route`、`navigation`、`listing`、`presentation`、`visibility`。
- `item` 是 `ContentItemModel`，日期转为 ISO 字符串，标签与分类转为字符串数组，路径完成规范化；导航、列表、展示和可见性已经完成级联。
- 级联顺序为页面 Front Matter、Post profile、主题全局配置；`false`、`0` 与空字符串是有效覆盖值。Brand 图片继续按原子对象替换，不继承上级图片子字段。
- 各 Collection profile 按独立切片接入同一模型接缝；EJS 对 `page.viewModel` 的消费属于后续阶段，本阶段不会提前接管布局。

纯构建入口位于 `scripts/lib/models/index.js`。Post 与 Note 在 `scripts/events/lib/content-config.js` 挂载；Wiki 页面在 `doc_tree` 完成树形解析后由 `scripts/events/lib/doc_tree.js` 挂载。

### Topic 与文章

严格 `collection.type: topic` 的文章在 `generateBefore` 阶段生成同构 `page.viewModel`：

- `collection` 保留 Topic 名称、标题、说明、受众、身份图标、源码仓库、规范化路由、集合列表设置和展示配置；顶层字段与 Post profile 一致。
- `navigation.series` 只包含 Front Matter 显式归属同一 Topic id 且 `visibility.listed !== false` 的文章，默认按日期降序稳定排列；每项只投影普通 id、标题、规范化路径、ISO 日期和当前项标记。
- Topic 是否位于 `topic.publish_list` 只进入 `collection.visibility.listed`；单篇文章从独立的默认可见性开始，再接受页面 `visibility` 覆盖，不把集合下架隐式传播为文章隐藏。
- Topic 默认沿用站点 Brand 和普通 Post 侧栏，之后依次接受 Topic profile、集合与页面展示覆盖；文章、页脚和评论同样在构建期完成级联。
- Topic 文章必须显式声明严格 v2 `collection.type` 与 `collection.id`，id 必须存在于 `_data/topic/`；不会从路径、布局、旧 `topic` 字段或运行时 Topic tree 推断归属。
- 本切片只挂载模型，不改变现有 Topic EJS 消费链。

### Wiki 与 Wiki 页面

严格 `collection.type: wiki` 页面在 Wiki 树构建完成后生成同构 `page.viewModel`：

- `collection` 保留 Wiki 的名称、主标题、副标题、长描述、受众与身份图标，以及项目源码仓库、规范化 `route.baseDir/homepage`、列表与 shelf 可见性。
- `navigation.tree` 从 `doc_tree.sections` 投影为冻结的普通分组与页面节点，包含 id、标题、规范化路径、页码和首页标记，不保留 `WikiPage` 实例。
- `item` 在构建期完成页面导航、列表、展示、源码与可见性级联；页面源码可以逐字段覆盖 Wiki 源码，项目 `hero.background.image` 作为页面 Banner 图片默认值并可被页面显式覆盖。
- shelf 只表示 Wiki collection 的聚合可见性，不会隐式隐藏项目内页面；页面继续由自身 `visibility.listed/searchable` 决定。
- 页面必须显式声明严格 v2 `collection.type` 与 `collection.id`，id 必须能解析到 `_data/wiki/` 项目；不从布局、路径或 v1 `wiki` 字段推断归属。
- 本切片只挂载模型，不改变现有 Wiki EJS 消费链。

### Notebook 与 Note

严格 `collection.type: notebook` 的 Note 在 `generateBefore` 阶段生成同构 `page.viewModel`：

- `collection` 保留 Notebook 的名称/标题/说明/身份图标、源码仓库、规范化 `route.baseDir`、标签导航、列表分页/排序/摘要设置和 Note 展示默认值。
- `navigation.tags` 只从同一严格 Notebook id 下的 Note 标签构造；层级标签拆为冻结的普通对象，包含规范化 id、名称、末段标签、父级和标签页路径。
- `item` 在构建期完成页面导航、`listing.priority`、`visibility.listed/searchable`、侧栏、文章、页脚和评论级联；页面源码可以覆盖 Notebook 源码字段。
- Note 必须显式声明严格 v2 `collection.type` 与 `collection.id`，id 必须存在于 `_data/notebooks/`；不会从布局、路径或 v1 `notebook` 字段推断归属。
- 本切片只挂载模型，不改变现有 Notebook/Note EJS 消费链。

## 校验与消费链

- `scripts/events/lib/content-config.js` 读取 `_data/wiki|topic|notebooks` 与源 Markdown Front Matter，在数据树构建前校验。
- `scripts/lib/content-config.js` 定义结构、类型、旧字段拒绝规则与 `isListed` / `isSearchable`。
- `scripts/lib/content-config.js` 同时校验已接入 profile 使用的路由、导航、侧栏和全局字段；错误继续包含配置来源与字段路径。
- `scripts/helpers/collection.js` 向 EJS 提供 `collection_id(page, type)`，不再读取 `page.wiki/topic/notebook`。
- `scripts/lib/brand.js` 与 `scripts/helpers/brand.js` 解析 Brand 优先级、集合自动值和手机端显示矩阵。
- Wiki、Topic、Notebook 数据树和搜索生成器消费共享可见性语义。

旧字段、未知字段和错误类型都会汇总为 `ContentConfigError`，消息包含源文件与字段路径；运行时没有 v1 别名或错误类型自动转换。
