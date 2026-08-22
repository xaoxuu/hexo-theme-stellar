---
title: Stellar v2 Article 与 Notebook 内容默认配置
date: 2026-08-23
status: 已交付
---

# Article 与 Notebook 内容默认配置方案

## 1. 问题与目标

主题级 `article` 与 `notebook` 同时承载文章展示、列表卡片、Footer、相关内容和 Notebook 列表默认值，并被 CollectionModel、PageViewModel、helper 与 EJS 直接读取。旧名称存在职责不清和布尔语义含糊的问题。

本切片把主题默认值一次迁入 `content.article` 与 `content.notebook`，让运行时只读取 `hexo.stellar.config.content` 的冻结 camelCase 结果。Collection YAML 与 Front Matter 仍保留当前结构，由后续统一声明式 Schema 切片迁移。

## 2. 最终契约

复用现有接缝：

- `scripts/schema/config-target.js` 的状态化目标节点继续作为路径、类型、默认、级联、运行时键和消费方的唯一目录。
- `scripts/schema/config-schema.js` 与 `scripts/lib/config-schema.js` 继续承担声明式 Schema、站点覆盖、规范化、诊断和深度冻结；本切片不新建第二套解析器。
- 内容级联复用 CollectionModel / PageViewModel 的 `mergeConfig` 与现有 Collection / Front Matter 严格校验边界。
- EJS 复用 `stellar_config()` 读取冻结 camelCase 投影，Stylus 复用 `hexo-config()` 读取 YAML snake_case 路径。

新增定义：

- `CONTENT_CONSUMERS` 只在 Schema 定义期标记 Content 节点消费方，作用域为配置契约元数据，默认来源为目标目录，不进入页面运行时。
- `AI_LABEL_DEFAULTS` 是 `content.article.ai_label` 四个已声明等级的默认样式表，只允许 `color/icon`，由 Schema 解析与 Reference 投影消费。
- `scripts/lib/content-defaults.js` 封装冻结 Content 入口的必需结构检查，并向 CollectionModel 提供 Article 展示与 Footer 默认；默认值仍全部来自 Schema，该模块不定义另一份默认或兼容路径。

```yaml
content:
  article:
    type: tech
    indent: null
    listing:
      pinned_layout: carousel
      card_layout: hero
      cover_ratio: 2
      excerpt_length: 128
      show_tags: false
    banner:
      ratio: 2.5
    category_colors:
      '探索号': '#f44336'
    ai_label:
      default: null
      manual: { color: '#03a9f4', icon: default:shield-user }
      reviewed: { color: '#4caf50', icon: default:shield-check }
      polished: { color: '#4caf50', icon: default:shield-up }
      generated: { color: '#ff9800', icon: default:shield-warning }
    footer:
      license: '本文采用 [署名-非商业性使用-相同方式共享 4.0 国际](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议，转载请注明出处。'
      share: false
    related_posts:
      enabled: false
      limit: 5
    show_reading_time: false
    show_tags: true
  notebook:
    listing:
      excerpt_length: 128
      per_page: null
      order_by: -updated
    tag_icons:
      '': quot:hashtag
    footer:
      license: false
      share: false
```

`indent: null` 表示未强制覆盖，继续允许 `story` 类型自动缩进；布尔值才表示显式覆盖。`card_layout` 默认 `hero`，license 默认保留当前协议文本。这三项修正落实 M1.5 已声明的“默认值由纵向切片交付”，不改变冻结的信息架构和字段路径。

`category_colors` 与 `tag_icons` 是字符串动态记录；`ai_label` 只允许 `default/manual/reviewed/polished/generated`，每个等级只允许 `color/icon`。数值必须是有限数，长度与数量不得为负，比例必须大于零。数组由站点覆盖完整替换，不做类型强转。

## 3. 消费与级联

- Schema 是主题默认值唯一来源；`_config.yml` 只提供站点可见的默认覆盖示例。
- YAML 使用 snake_case，运行时使用 `pinnedLayout`、`cardLayout`、`excerptLength`、`relatedPosts.enabled` 等 camelCase。
- 主题默认进入 CollectionModel，再与现有 Collection/Page 覆盖按既有级联合并；本切片不改它们的公开字段名。
- Post ViewModel、列表 ViewModel、相关内容查询、Notebook 聚合、helper 与 EJS 只消费冻结配置或模型，不再读取旧根。
- `article`、`notebook` 旧根以及旧子字段均由 Schema 结构化拒绝，不提供别名和双读。

## 4. 影响范围与非目标

修改配置目标、运行时 Schema、主题默认、内容模型、相关 helper/template、Reference、测试和内部知识库；主工程只迁移 `_config.stellar.yml` 的真实覆盖并执行构建验证。

不迁移 Collection YAML / Front Matter，不修改 appearance/resources/extensions、生成后 CSS 样式行为、浏览器 JavaScript、语言文件、公开 Wiki、公开 URL 或 SEO 语义，不新增依赖，也不提交主仓库或更新子模块指针。为保持样式输出，仅将 3 处 Stylus `hexo-config()` 读取从旧路径迁到 `content.article` 最终路径。

## 5. 验证

- Schema 默认、覆盖、记录边界、数值约束、数组替换和深冻结测试。
- 旧根、旧子字段、未知字段、错误类型与非法值诊断测试。
- 静态消费链测试确保运行时代码不再读取主题 `article` / `notebook` 根。
- 主题 `npm run check`、知识库硬核查、主工程 `npm run g` 与关键页面产物抽查。
- Standards / Spec 双轨 review。
