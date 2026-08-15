---
title: 本地搜索：点击结果定位章节并高亮关键词
date: 2026-08-15
status: 已实施
---

# 本地搜索定位与高亮方案

## 1. 问题与目标

- 现状：`search.json` 仅含 `title/path/content`，搜索结果链接到页面根路径，点击只能跳到页顶，无法直达关键词所在位置，也无法在目标页内高亮匹配词。
- 目标：
  - 搜索结果按章节拆分（一页可出多条），每条显示页面标题 + 章节名。
  - 点击结果直接跳转到对应章节锚点（复用现有 hash 锚点滚动逻辑，偏移 32、`#start` 贴顶）。
  - 目标页内用主题 mark 样式（`color="yellow"`）高亮匹配词；无锚点命中（intro / 仅标题）高亮后滚动到第一个匹配词实现定位。
- 范围：仅 `local_search`；Algolia 不动。索引结构只追加字段，不破坏现有字段。

## 2. 技术方案

### 服务端索引（`scripts/`）

- 新增 `scripts/lib/search_index.js`：`buildSearchIndex(html)` 把渲染后 HTML 按标题标签切分，逐段复用现有清洗流程重建正文（与 `stripHTML` 全文归一化逐字节一致），并输出 `anchors: [{id, text, offset}]`，`offset` 与客户端 `content.indexOf()` 对齐；无标题页输出空数组。
- 处理顺序：先全局移除 `span.line`/iframe/hr/br（与现状一致），再按标题切分；每段 stripHTML → 实体移除 → 换行转空格 → 空白折叠，段落拼接时合并跨段边界空白，最后整体 trim 并回移锚点偏移。
- 改造 `scripts/generators/search.js`：条目追加 `anchors`（非空时输出）；`title/path/content/tags/categories` 不变。

### 客户端结果（`source/js/`）

- `local-search.js`：
  - 缓存键升级 `search_cache_v4`；旧缓存缺 `anchors` 时回退现有页面级行为。
  - 按 anchors 划分章节（首个标题前为 intro 段），逐章节匹配关键词组合，每个命中章节生成一条结果：页面标题、章节名、章节内摘要（复用 `.search-keyword` 高亮）。
  - 链接规则：章节命中 → `页面路径?kw=<最长命中组合>#<锚点id>`；intro 或仅标题命中 → `页面路径?kw=<关键词>`（无锚点）。锚点 id 与 kw 均 `encodeURIComponent`；无锚点场景由 highlight.js 高亮后滚动到第一个匹配词。
  - 排序：章节内命中数降序，同分按章节顺序；仅标题命中排最后。不设结果数量上限。
- 新增 `source/js/search/highlight.js`：URL 带 `?kw=` 时在 `.md-text` 内遍历文本节点，大小写不敏感地把 kw 全部出现处包裹为 `<mark class="tag-plugin colorful mark" color="yellow">`（上限 50 处，跳过 script/style/已有 mark，纯 DOM API 构建防注入）。
- `layout/_partial/scripts/defines.ejs`：新增按需加载逻辑，URL 带 `?kw=` 时 DOMContentLoaded 后经 `utils.js` 加载 highlight.js（`utils` 是全局词法绑定，不能用 `window.utils` 判断）。

### 样式（`source/css/`）

- `_components/sidebar/search.styl`：结果卡片背景与圆角位于 `li a`（hover `--bg-a50`）；`.search-result-title` 为链接上方的纯文字标题（`fs-14`、`padding: 0.5rem 1rem`、单行省略）；`.search-result-section` 章节名采用标题样式（`fs-15` 加粗、`>` 前缀主题色、单行省略、底部 `var(--block-border)` 分割线）；摘要 `fs-13` 两行截断，命中词 `.search-keyword` 黄色高亮。页面跳转高亮复用现有 `.md-text .tag-plugin.mark` 样式，无需新增。

## 3. 影响范围

- 对外行为：搜索结果按章节展示并带章节名；点击跳转对应章节；目标页高亮关键词。
- 兼容性：`anchors` 为追加字段；旧缓存回退页面级行为；`content: false`、`lazy_load`、`cache_ttl`、`skip_search`、`indexing: false`、路径过滤均不变。
- 需要同步的知识库页面：`docs/knowledge/07-外部集成/search.md`、`docs/knowledge/知识库全量.md`，并登记 `VERIFICATION.md`。

## 4. 验证方式

- 单测 `test/search_index.test.js`：锚点提取、重建 content 与 `stripHTML` 全文归一化逐字节一致、中文/英文/带空格 id、正文先出现同名文本、无标题页、iframe/hr/br/HTML 实体/空白边界。
- 主题仓库 `npm run check`（lint + 单测 + 依赖声明检查 + 知识库硬事实核查）；主工程 `npm run g` 全量构建。
- 手工验收（`npm run s`）：帖子与 Wiki 页搜索 → 结果按章节出现并显示章节名 → 点击跳到对应章节 → 关键词黄色高亮；intro 命中滚动到匹配词；旧缓存回退；多关键词、无标题页、无结果状态正常。
