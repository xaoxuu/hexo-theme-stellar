---
title: v2 Content、Collection 与 Front Matter 最终收敛
date: 2026-08-24
issue: 727
---

# 问题

`content.article`、`content.notebook` 与内容作用域仍暴露迁移期命名和含混类型：`type/indent`、两段式 related posts、布尔 share、字符串 `order_by`、默认 tag icon 键与可配置 AI label 样式。模型和生成器也继续投影这些旧语义。

# 最终契约

- Article 使用 `style: tech|story` 与 `paragraph_indent: auto|always|never`。
- `listing.excerpt_length`、`related_posts_limit` 为非负整数，`0` 关闭对应功能。
- `footer.share` 为去重 provider 数组，空数组关闭；内容覆盖允许 `true|false|array`。`footer.show_tags` 接管旧根字段。
- 全局删除 `ai_label` 样式配置；Collection / Front Matter 的 `article.ai_label` 只接受显式等级枚举。
- Notebook `listing.per_page` 使用 `null|非负整数`，`listing.sort.{field,direction}` 替代 `order_by`；`tag_icons` 只接受非空真实标签键，默认图标内部化。
- Notebook footer 使用 `license: string|false|null` 与 `share: array|null` 表达继承、关闭和覆盖。
- CollectionModel、PageViewModel、生成器、模板、Reference 和 doctor 只消费最终字段；旧路径仅诊断，不兼容读取。

# 边界

- 保留 listing、banner、category colors 与 reading time，但加强类型、整数和颜色校验。
- 不修改 `seo`、`resources.preconnect` 或下一切片的 Extension 契约。
- 主站只迁移本切片命中的配置、Collection 与 Front Matter；正文不做无关润色。

# 验收

- Schema 正反例覆盖默认、级联、关闭、继承、去重、整数范围、枚举和旧字段提示。
- Post、Wiki、Topic、Notebook 详情与聚合链只输出最终 ViewModel。
- `npm run check` 与主工程 `npm run g` 通过。
