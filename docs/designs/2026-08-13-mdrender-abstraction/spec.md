---
title: 远程 MD 渲染能力抽象 + Wiki README 主页
date: 2026-08-13
status: 已实施
---

# 远程 MD 渲染能力抽象 + Wiki README 主页 方案

## 1. 问题与目标

- 现有 `{% md %}` 标签的「远程 Markdown 渲染」能力与服务端占位 HTML 绑定（`scripts/tags/lib/md.js` 与 `layout/_partial/widgets/markdown.ejs` 各写一份），其他场景无法复用；远程渲染的标题与本地文章标题格式不一致（marked v13 不再输出标题 id，README 常以 h1 开头而本地正文从 h2 开始），会导致样式与锚点行为差异。
- 成功标准：
  1. 底层组件（服务端生成器 + 客户端渲染服务）可复用，支持「容器内填充」与「原地替换（无外部容器）」两种模式；
  2. 标题默认适配本地文章格式：补齐与本地一致的标题 id、追加 `headerlink` 锚点，h1 视为页面标题直接隐藏（不降级）；
  3. GitHub raw src 使用主题配置 `api_host.ghraw`（配置即唯一默认值来源，代码不兜底），相对图片/链接解析到同一镜像基址；
  4. wiki 项目首页正文为空（剪裁空白后）且 yml 配置 `repo` 时，该页正文渲染为该仓库 README.md，页面外观与本地 wiki 页一致。
  5. 远程内容渲染完成后自动重建右侧 TOC（`layout/_partial/widgets/toc.ejs` 预留空容器，mdrender 服务派发 `stellar:mdrender` 事件，`source/js/main.js` 监听重建，滚动高亮动态查询标题）。

## 2. 技术方案

- 分层：底层通用组件 `scripts/lib/mdrender_html.js`（纯函数，只生成占位、识别 GitHub raw 并替换 `ghraw`、输出 `data-base`，不含应用逻辑）；wiki 应用层 `scripts/lib/wiki_readme.js`（README URL、空正文/首页判定、占位组合）；Hexo 适配层 `scripts/helpers/mdrender.js` 只注入 config 并注册 `mdrender_html` / `wiki_readme_html` / `has_remote_md`；`scripts/tags/lib/md.js` 与模板为应用层薄调用，`api_host.ghraw` 按现有标签惯例直接读配置；md 标签新增可选 `wrap` 参数（默认 true，`wrap:false` 时把 `replace` 传给底层组件输出无容器模式）。
- 客户端：`source/js/services/mdrender.js` 支持原地替换（replace）、相对 URL 解析（`data-base`）、标题适配（slug 规则与 hexo-util slugize transform=1 一致，重复/冲突 id 追加 `-1/-2`，并追加与 hexo-renderer-marked 一致的 `headerlink` 锚点）。
- 客户端分层：`source/js/services/mdrender.js` 只做渲染与内容规范化，完成后派发 `stellar:mdrender` 事件；`source/js/main.js`（页面层）监听事件并按服务端 `toc()` 输出结构（`ol.toc` / `li.toc-item.toc-level-N` / `a.toc-link` / 嵌套 `ol.toc-child`）重建右栏 TOC，事件委托绑定点击滚动。
- Wiki 触发：`layout/page.ejs` 在正文为空时调用 `wiki_readme_html(theme.wiki.tree[page.wiki], page)`（判定在 wiki 应用层，不适用返回空串）；`layout/_partial/widgets/toc.ejs` 用 `has_remote_md(page)` 预留 TOC 容器。
- 涉及文件：`scripts/lib/mdrender_html.js`、`scripts/lib/wiki_readme.js`（新增）、`scripts/helpers/mdrender.js`、`scripts/tags/lib/md.js`、`layout/_partial/widgets/markdown.ejs`、`layout/_partial/widgets/toc.ejs`、`layout/page.ejs`、`source/js/services/mdrender.js`、`source/js/main.js`、`test/mdrender.test.js`、`docs/knowledge/03-内容系统/wiki-docs.md`。

## 3. 影响范围

- `{% md %}` 新增可选 `wrap` 参数（默认 true，现状）；`wrap:false` 渲染后无外部容器。标题默认规范化（补 id + `headerlink`，h1 视为页面标题隐藏），远程内容样式与本地文章统一。
- 不新增配置项；`api_host.ghraw` 直接读主题配置（主题 `_config.yml` 默认值即唯一默认来源，代码不兜底）。
- Wiki 项目数据文件新增语义：`repo`（必填）+ 可选 `branch`；首页空正文触发 README 渲染。
- 需同步文档：`docs/knowledge/03-内容系统/wiki-docs.md`；主站点 wiki（`source/wiki/stellar/`）由主仓库侧同步。

## 4. 验证方式

- 单测：`npm test`（新增 `test/mdrender.test.js`，覆盖占位生成、镜像替换、README URL、slug 规则）。
- 构建：主工程 `npm run g` 全量验证。
- 知识库：`python3 docs/knowledge/tools/verify.py` 硬事实核查。
