---
title: Stellar v2 Layout Profile 配置消费链
date: 2026-08-22
status: 已通过
---

# Layout Profile 配置消费链方案

## 1. 问题与目标

主题仍以 `site_tree` 表达页面路径、菜单激活、导航标签、左右侧栏和首页评论。该结构同时被生成器、Collection/PageViewModel、EJS 模板与 Wiki/Notebook 构建逻辑直接读取，字段名与冻结后的八根域契约不一致。

本切片将 13 个页面 Profile 一次迁入 `layout.profiles`，并让所有消费方只读取 `hexo.stellar.config.layout` 的冻结 camelCase 结果。成功标准是默认页面输出不变、站点覆盖使用最终 YAML 路径、旧字段被结构化拒绝，且配置 Reference 与运行时 Schema 同源。

## 2. 最终契约

公开 YAML Profile ID 固定为：

- `home`
- `blog_index`
- `topic_index`
- `wiki_index`
- `post`
- `topic`
- `wiki`
- `notebook_index`
- `note_index`
- `note`
- `author`
- `error`
- `page`

每个 Profile 由封闭对象组成：

```yaml
layout:
  profiles:
    blog_index:
      path: /blog/
      navigation:
        active_menu: post
        tabs: {}
      sidebar:
        left:
          widgets: [welcome, recent]
        right:
          widgets: []
```

`path` 规范化为以 `/` 开头的站点根相对路径；目录路径以 `/` 结尾，文件路径保留扩展名。`navigation.tabs` 是字符串值动态记录。Widget 项只允许字符串或普通对象；对象是已注册 Widget 的参数边界。数组由站点覆盖完整替换。

`blog_index.path` 冻结 Post Collection 的博客命名空间（`CollectionModel.route.baseDir`），不接管 Hexo 的近期文章首页生成器。近期文章首页仍由 Hexo 自有 `index_generator.path` 决定；这是外部所有权边界，也是本切片保持公开 URL 不变的条件。`topic_index`、`wiki_index`、`notebook_index`、`author` 与 `error` 的路径则由主题生成器直接消费。

`home.comments` 允许 `null`、布尔值或最终评论覆盖对象；对象字段为 `enabled/title/id/provider/options`，其中 `options` 是第三方参数袋。评论 Extension 的全局 provider 注册与资源加载仍留待 Extension 切片。

冻结后的 JavaScript 使用 camelCase，例如 `layout.profiles.blogIndex.navigation.activeMenu`。

## 3. 技术方案

### 可复用接缝

- `scripts/schema/config-target.js`：沿用状态化目标字段、作用域、级联、运行时键和迁移矩阵。
- `scripts/schema/config-schema.js` 与 `scripts/lib/config-schema.js`：沿用唯一默认值、严格解析、结构化诊断和深冻结入口。
- `scripts/helpers/stellar_config.js`：EJS 读取冻结配置的统一入口。
- `scripts/lib/path_utils.js`：页面/集合路径进入既有模型前继续使用相同规范化工具。
- 既有 Collection 与 PageViewModel 合并函数：只把 Profile 默认来源改为冻结 layout 配置，不改变 Collection/Front Matter 的迁移期字段结构。

### 实施

1. 把 Layout 目标节点展开为 13 个封闭 Profile，登记每个路径、导航、侧栏和首页评论节点的实际默认值并标记 `delivered`。
2. 在运行时 Schema 中建立显式 Profile 树，加入旧根、旧 ID、`base_dir`、`navigation.menu` 与错误页 `404` 的迁移诊断；支持根相对路径和第三方参数袋归一化。
3. 将主题 `_config.yml` 和主工程 `_config.stellar.yml` 改为最终路径。
4. 将 404、Author、Wiki、Topic、Notebook 生成器，Wiki/Notebook 构建逻辑，四类 ViewModel，导航、面包屑、Brand 返回入口、首页评论与左右侧栏模板切换到冻结配置。
5. `navigation.activeMenu` 只在配置运行时存在；进入现有 PageViewModel 或页面渲染上下文时投影为内部 `navigation.menu`，避免扩大 M2 模型变更。
6. 更新配置目录状态、配置 Reference、设计文档、配置/布局/侧栏知识库与发布验证登记。

## 4. 影响范围

- `scripts/`：Schema、配置解析、生成器、Collection/PageViewModel、Wiki/Notebook 数据构建与测试。
- `layout/`：导航标签、面包屑、Brand 返回入口、首页评论和左右侧栏默认选择。
- `_config.yml`：删除 `site_tree`，新增 `layout.profiles`。
- `reference/v2-config.json`：新增已交付 Layout Profile 契约。
- `docs/knowledge/`：配置系统、布局系统、路由与侧栏行为。
- 主工程：只迁移 `_config.stellar.yml` 示例覆盖并同步内部蓝图；保持未提交。

CSS、浏览器 JavaScript、语言文件、公开 Wiki、公开 URL 与 SEO 语义均为 N/A。本切片不新增依赖，也不迁移 `content`、`appearance`、`resources.fallbacks`、`extensions`、Collection YAML 或 Front Matter 的最终公开结构。

## 5. 风险与降级

- 路由路径格式变化可能影响生成位置：Schema 统一根相对表示，生成器入口显式转换为 Hexo route path，并以生成文件抽查验证。
- `blog_index.path` 与 Hexo `index_generator.path` 名称相近但职责不同：前者只进入 Post Collection 契约，后者继续拥有近期文章首页，禁止从主题配置反写 Hexo 配置。
- Topic 的旧侧栏隐式继承 Post、Topic Index 隐式继承 Blog Index：新默认树直接写入其有效默认值，避免跨 Profile 隐式读取。
- Collection/Front Matter 尚未迁移：其覆盖继续在既有模型边界合并，只有主题 Profile 默认改为冻结配置。
- 不保留旧字段兼容层；失败时由 Schema 在构建早期给出来源、路径、实际类型、期望结构和迁移章节。

## 6. 验证

- Layout Schema 默认、覆盖、路径规范化、数组替换、动态 tabs、Widget 参数边界、首页评论和深冻结单测。
- 旧根、旧 Profile ID、旧子字段、未知字段、错误类型与非法参数结构诊断测试。
- 静态消费链测试确保 `theme.site_tree` / `config.site_tree` 不再出现在运行时消费方。
- `npm run check`、知识库硬核查、主工程 `npm run g`。
- 首页、博客索引、普通文章、Topic、Wiki、Notebook、Note、Author、404 与通用页面的路径、菜单、侧栏和 tabs 抽查。
- Standards / Spec 双轨 code review。
