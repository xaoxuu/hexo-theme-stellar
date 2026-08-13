---
title: Wiki 项目描述作为页面 meta/OG/JSON-LD 描述兜底
date: 2026-08-14
status: 已通过
---

# Wiki 项目描述兜底方案

## 1. 问题与目标

### 要解决的问题

远程 MD wiki 页（首页正文为空、配置 `repo` 渲染 README，如 `star-vote`）在 `open_graph.enable: true` 时：

- `generate_description()` 提前返回空串，其内置的「wiki 项目 description」兜底成为死代码；
- 实际生效的 `<meta name="description">` 与 `og:description` 来自 Hexo 内置 `open_graph` helper，而 `og_args()` 未传入项目描述，helper 级联到 `config.description`（站点默认文案）；
- JSON-LD（Website schema）的 `description` 同样为空，回落到站点默认描述。

即项目 YAML（`source/_data/wiki/{id}.yml`）中的 `description` 没有作为页面描述的备用方案生效。

### 成功标准

- 正文为空的 wiki 页（远程 README 主页）：`<meta name="description">`、`og:description`、JSON-LD `description` 输出项目 YAML 的 `description`；
- 页面 front matter 显式设置 `description`（或 `open_graph.description`）时，页面级描述优先于项目描述；
- 非 wiki 页面（首页、文章页、普通页面）描述行为不变；
- 关闭 `open_graph` 时 `generate_description()` 与开启时优先级语义一致。

## 2. 技术方案

统一级联语义：`page.description`（页面级）→ wiki 项目 `description`（项目级）→ `page.excerpt` → 截断正文 → `config.description`。

### `layout/_partial/head.ejs`

- `og_args()`：当 `page.wiki` 且未设置 `page.description`、且 `theme.wiki.tree[page.wiki].description` 存在时，把项目描述传入 `args.description`（`page.open_graph.description` 仍经 `Object.assign` 覆盖）。
- `generate_description()`：调整分支顺序为 `page.description` → wiki 项目描述 → `page.excerpt || page.content` → `config.description`，与 OG 模式语义对齐。

### `scripts/helpers/json_ld.js`

- Website schema 非首页分支：在 `page.description || page.excerpt` 之后、正文截断之前，插入 wiki 项目描述兜底。

### 文档

- `docs/knowledge/02-布局系统/head-seo.md`：更新「描述生成」优先级、「Open Graph 协议集成」`og_args()` 说明、Website schema 描述优先级。
- `docs/knowledge/VERIFICATION.md`：登记本次修正。
- 主仓库 `source/wiki/stellar/wiki-settings.md`：补充 README 主页页面的描述兜底说明。

## 3. 影响范围

- 对外行为：正文为空的 wiki 页描述由站点默认文案变为项目描述；本地 wiki 页（无显式 `page.description`）描述由正文摘要变为项目 YAML 描述（与卡片展示一致，也与非 OG 模式既有语义一致）；显式设置页面描述时不受影响。
- 配置项：无新增。
- 兼容性：`open_graph` 关闭时 `generate_description()` 分支顺序调整，仅影响「wiki 页同时设置 `page.description` 与项目描述」的场景（此前项目描述优先，此后页面描述优先）。
- 涉及文件：`layout/_partial/head.ejs`、`scripts/helpers/json_ld.js`、`docs/knowledge/02-布局系统/head-seo.md`、`docs/knowledge/VERIFICATION.md`。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 依赖检查 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建（涉及 `scripts/` 必做）。
- 抽查生成 HTML：远程 wiki 页（`/wiki/star-vote/`、`/wiki/feed-posts-parser/`）、本地 wiki 页（`/wiki/cloud-shell/`）、文章页、首页的描述标签。
