---
title: Stellar v2 head 与 SEO 配置纵向迁移
date: 2026-08-22
status: 已实施
issue: 705
---

# head 与 SEO 配置方案

## 1. 目标

把 #702 的临时 canonical 接缝和 #704 已冻结的 head/SEO 目标路径收敛为首批最终 v2 配置：`seo`、`resources.preconnect` 与站点 `inject`。主题默认值、站点覆盖、普通 Post、迁移期页面、JSON-LD、head renderer 和浏览器 canonical check 必须消费同一份冻结 JavaScript 配置，同时保持既有 SEO 输出语义。

## 2. 复用能力

- 复用 `scripts/schema/config-schema.js`、`scripts/lib/config-schema.js`、构建前挂载事件与配置 Reference 生成器，不新增第二套解析器。
- 复用 #704 `config-target.js` 的最终路径、默认值语义、作用域、级联、规范化和迁移矩阵，只把本切片叶子从 `planned` 更新为 `delivered`。
- 复用 Post `render.seo`、`json_ld()` helper、`open_graph()` helper、`stellar_config()` helper与现有浏览器 `window.canonical` 协议。
- 复用现有页面级 Open Graph 与 inject 输入，完整 Front Matter 改名和严格 Schema 留到 Collection / Front Matter 切片。

## 3. 配置契约

- `canonical.original_host/official_hosts` 迁到 `seo.canonical.host/allowed_hosts`。
- `open_graph.enable/twitter_id` 迁到 `seo.open_graph.enabled/twitter_id`。
- `structured_data.links` 迁到 `seo.structured_data.same_as`。
- `preconnect` 迁到 `resources.preconnect`。
- `_config.stellar.yml` 的 `inject.head/script` 为可信多行字符串；不读取 Hexo `_config.yml.inject`。站点文本在前、页面文本在后，仅在两者均非空时插入一个换行。
- YAML 保持 snake_case，冻结的 JavaScript 结果为 `seo.canonical.host/allowedHosts`、`seo.openGraph.enabled/twitterId`、`seo.structuredData.sameAs`、`resources.preconnect`、`inject.head/script`。
- Schema 默认值是运行时与 Reference 的唯一默认值来源；对象按声明字段合并，数组由站点层完整替换，不做类型转换。
- 根 Schema 仍保持开放，但本切片已迁移的旧根字段和旧子字段产生 `removed_field`，新子树拒绝未知字段。

## 4. 消费链

- Post ViewModel 只从 `hexo.stellar.config.seo` 构建 canonical、Open Graph 与 JSON-LD `sameAs`。
- 迁移期页面的 head 与 JSON-LD helper 只从 `stellar_config('seo')` 和 `stellar_config('resources.preconnect')` 读取主题级配置。
- head/script inject 只从 `stellar_config('inject')` 与当前页面输入组合；`config.inject` 和 `theme.inject` 均退出消费链。
- 浏览器 `window.canonical` 继续保持 `{host, allowedHosts, encoded, param}` 对内 camelCase 协议，clone check 行为不变。

## 5. SEO 六维度影响

1. 抓取与索引：canonical 主机与 404 抑制保持；robots、sitemap、重定向 N/A。
2. 元数据与结构化数据：回归 canonical、description、OG、Twitter 与 JSON-LD `sameAs/image/description`。
3. 内容质量与关键词：N/A，不修改文章内容、标题或 meta。
4. 性能：preconnect 输出集合保持，重复 origin 在解析期稳定去重。
5. 外部信号：N/A，不修改站长平台或外部入口。
6. 配置：最终路径、严格类型、默认值、级联、旧字段诊断与 Reference 同源。

## 6. 边界

- 不迁移其它 `site/layout/content/appearance/resources.fallbacks/extensions` 字段，不封闭配置根。
- 不提前完成 Collection / Front Matter 的整体改名；页面 Open Graph 与 inject 的旧输入形态只作为尚未迁移作用域保留。
- 不修改样式、公开 Wiki、URL、robots、sitemap、依赖或浏览器交互协议。
- 主工程配置与总蓝图只保留未提交更新，不提交主仓库或子模块指针。

## 7. 验收

- 默认值、覆盖、规范化、数组替换、深冻结及旧字段/未知字段/错误类型诊断有自动化测试。
- 配置 Reference 只包含本切片与此前真实交付节点，规划字段不泄漏。
- 源码搜索确认 head、Post、JSON-LD 与 canonical 上下文不再读取旧主题路径或 Hexo inject。
- 主题 `npm run check`、知识库核查、主工程 `npm run g` 与生成产物 SEO 抽查通过。
- Standards / Spec 双轨 review 无剩余问题后提交并推送 `v2`，闭环 #705。
