---
title: v2 Extensions、Tags、Features 与 Services 最终收敛
date: 2026-08-24
issue: 728
---

# 问题

Extensions 仍公开实现细节、无效标签配置、已退出 Feature、含混时间单位和带默认公网 endpoint 的服务字段；部分公开 URL 没有真实消费链，内容仍使用旧 Emoji、Gallery 与 Gist 写法。

# 最终契约

- Search 只公开 `provider: local|algolia|null`；Local 保留 `scope/include_content/cache_ttl_seconds`，索引路径、懒加载和排除策略内部化，可搜索性由内容 `visibility.searchable` 决定。
- Comments 保留六个 provider；`title: null` 使用本地化标题，空字符串隐藏；provider 配置保留开放参数袋。
- Tags 只公开 `note/checkbox/quot/emoji/icon/button/mark/hashtag/gallery`。Emoji 使用 `default_source + sources`，默认 `blobcat`；Gallery 使用 `aspect_ratio: original|square|portrait`。
- Features 收敛命名与类型，删除 AI Summary、MathJax v2、旧 Mermaid CSS、公开 code-copy/adaptive-text；Math 与 diagrams 只接受最终 provider 结构。
- Services 严格校验 endpoint；rating/vote 默认关闭；contributors 使用 repositories 最长前缀匹配；GitHub Card 使用独立 endpoint；Gist URL 由新 `{% gist %}` 标签真实消费。
- 旧路径只由 doctor 报错，不兼容读取。

# 内容迁移

- 四处 `emoji aini` 显式指定 `qq` source。
- Unsplash 文章六处 Gallery 参数迁移为 `aspect_ratio` 与 `original`。
- 三个文件六段硬编码 Gist script 改为 `{% gist owner/id [file:name] %}`。
- 正文变更刷新 `updated`，不顺带修改其它内容问题。

# 边界

- 不修改 `seo`、`resources.preconnect` 或下一切片的 Appearance / Resources / Inject 最终契约。
- 保持第三方 Comments/Algolia 参数袋开放，但封闭其父级容器。

# 验收

- Schema 正反例、默认值、doctor、camelCase、封闭边界和消费链测试通过。
- Search、Comments、Emoji、Gallery、Math、Mermaid、Gist 与服务 endpoint 有生成结果断言。
- Node.js 22 下 `npm run check` 与主工程 `npm run g` 通过。
