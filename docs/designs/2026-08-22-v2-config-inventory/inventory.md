# Stellar v2 配置全景

本页解释 `scripts/schema/config-inventory.js` 的字段域和迁移边界。目录是 Pre-alpha M1.5 的内部规划契约，不是公开 Reference；只有状态为 `delivered` 且进入声明式配置 Schema 的字段才会出现在 `reference/v2-config.json`。

## 输入来源

| 来源 | 文件或入口 | 所有权 | 最终处理 |
| --- | --- | --- | --- |
| 主题默认与站点覆盖 | `themes/stellar/_config.yml`、`_config.stellar.yml` | Stellar | 规划字段解析到冻结的 `hexo.stellar.config`；仅站点可注入的遗留字段显式排除 |
| Collection | `source/_data/wiki/*.yml`、`topic/*.yml`、`notebooks/*.yml` | Stellar | 解析到 `CollectionModel` |
| Front Matter | `source/_posts/**/*.md`、`source/**/*.md` | Stellar 与 Hexo（分别登记） | Stellar 字段进入内容模型；Hexo 页面字段使用独立外部边界 |
| Hexo 配置 | `_config.yml`、`hexo.config` | Hexo | 只登记实际消费字段，不由 Stellar 配置 Schema 接管 |
| 主题数据 | icons、widgets、authors、links、chat_users 与集合注册表 | Stellar | 先校验普通输入，再构建模型或扩展上下文 |
| 派生对象 | `theme.config.wiki/topic/notebooks/...` | 内部迁移桥 | 消费方迁移后删除，不作为公开输入 |

## 主题字段域

| 域 | 最终字段族 | 边界 | 状态 | 主要消费方 |
| --- | --- | --- | --- | --- |
| `stellar` | `version/homepage/repo/main_css/main_js` | package-owned sealed | excluded | 资源加载、主题信息 helper |
| `preconnect` | `preconnect[]` | sealed | planned | head |
| `canonical` | `original_host/official_hosts[]` | sealed | delivered | ViewModel、head、浏览器检查、Reference |
| `open_graph` | `enable/twitter_id` | sealed | planned | ViewModel、head |
| `structured_data` | `links[]` | sealed | planned | ViewModel、JSON-LD |
| `brand` | `image.* / name / tagline / url` | sealed | planned | ViewModel、Brand、侧栏 |
| `menubar` | `items[].{id,theme,icon,title,url}` | sealed | planned | ViewModel、菜单 |
| `site_tree` | `<profile>.base_dir/navigation/sidebar/comments/404` | sealed | planned | Collection、ViewModel、生成器、侧栏 |
| `notebook` | `listing.* / tag_icons.<tag> / footer.*` | sealed | planned | Notebook Collection、树构建 |
| `article` | 展示、摘要、封面、AI 标记、许可、分享、相关文章与标签 | sealed | planned | Post ViewModel、文章与列表 |
| `search` | `service/local_search.*`，`algolia_search.*` 参数袋 | sealed parent | planned | 搜索生成、渲染与浏览器扩展 |
| `comments` | `service/title/custom_css`，`<service>.*` 参数袋 | sealed parent | planned | ViewModel、评论渲染与扩展 |
| `footer` | `social.<id>.* / sitemap[] / content` | sealed；`social` 为动态记录 | planned | 侧栏与主内容页脚 |
| `tag_plugins` | `<extension>.*` | record | planned | 标签渲染与浏览器扩展 |
| `dependencies` | `<dependency>.{js,css,*}` | record | planned | head、脚本与扩展加载 |
| `data_services` | `<service>.{js,api,*}` | record | planned | 标签与数据服务加载 |
| `data_cache` | `enable/default_ttl/ttl.<service>/max_entries` | sealed；`ttl` 为动态记录 | planned | request/cache 客户端 |
| `plugins` | `<extension>.{enable,js,css,*}` | record | planned | 插件渲染、加载与样式编译 |
| `style` | 主题、字体、圆角、颜色、表面、渐变与错误页字段 | sealed | planned | ViewModel、布局、Stylus、浏览器主题状态 |
| `default` | avatar/link/cover/image/project/banner/topic/image_onerror | sealed | planned | ViewModel、标签与图片兜底 |
| `api_host` | ghapi/ghraw/gist/ghcard | sealed | planned | 标签与数据服务 |
| `system` | `override_pretty_urls` | internal sealed | excluded | Hexo 构建集成 |
| `inject` | `head[]/script[]` | sealed | planned | head、script、ViewModel |
| `cache` | `enable` | sealed | excluded | 遗留 generateBefore 兼容分支 |
| `language_switcher` | `enable/items[]` | sealed | excluded | 遗留 generateBefore 兼容分支 |

Collection 和 Front Matter 的完整分组字段继续以 `docs/knowledge/03-内容系统/content-schema-v2.md` 为当前事实；它们已严格校验但尚未与主题配置共用声明式 Schema，因此状态为 `partial`。

Hexo 自有 Front Matter 字段由 `hexo_front_matter` 单独登记为 external；其来源是 Markdown，运行时目标是 Hexo page/post document，不混入来源为 `_config.yml` 的 `hexo.config` 域。

## 命名与开放边界

- Stellar 自有 YAML 使用 snake_case；JavaScript 运行时对象使用 camelCase。
- `comments.<service>`、`search.algolia_search` 和 Galaxy options 保留第三方字段；父级容器、服务选择和对象类型仍由 Stellar 校验。
- menubar 菜单项与 links 数据按实际数组结构使用 `items[]`、`links.<group>[].*`；社交项、分类颜色、标签图标、服务和插件使用 `<id>` / `<service>` 通配记录；示例配置中的具体键不构成固定白名单。
- 已确认的迁移包括 `comments.comment_title → comments.title`、`tag_plugins.timeline.max-height → max_height`、`data_services.download-file → download_file`，以及 `style` 下 font、alignment、radius、corner-shape、leftbar/site 的连字符字段改为下划线。
- `stellar`、`system`、Hexo 配置和派生运行时对象不进入公开 Stellar Schema；`root-seal` 必须在排除边界落实后才能封闭根对象。

## 迁移顺序

1. `head-seo`：preconnect、canonical 回归、open_graph、structured_data、inject。
2. `shell-content-defaults`：Brand、菜单、site tree、文章/笔记本默认值、Footer、Visual Style 与默认资源。
3. `collection-front-matter`：把现有 Collection 与页面严格校验收敛到同一声明式 Schema。
4. `extensions-services`：搜索、评论、标签、插件、依赖、数据服务、缓存与 API host。
5. `root-seal`：落实 package、站点专属遗留字段、Hexo、主题数据和派生对象边界，删除旧读取路径并封闭根 Schema。

前三个运行时迁移批次完成前，不恢复 Wiki、Topic、Notebook 的 M2 模板迁移；全部五批完成前，不声明 M1.5 已交付。
